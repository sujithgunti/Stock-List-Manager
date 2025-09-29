import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Provider, atom, useAtom, useAtomValue } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// Shared types (duplicated to avoid import issues in content script)
interface StockSymbol {
  symbol: string;
  exchange: string;
  fullSymbol: string;
  stockName?: string;
}

interface SymbolList {
  id: string;
  name: string;
  symbols: StockSymbol[];
  createdAt: Date;
  updatedAt: Date;
}

interface FloatingWidgetProps {
  onClose: () => void;
  onMinimize: () => void;
  onStateChange?: (selectedListId?: string, searchTerm?: string) => void;
  initialState?: {
    selectedListId: string;
    searchTerm: string;
  };
}

// Import createJSONStorage for proper Jotai storage adapter
import { createJSONStorage } from 'jotai/utils';

// Create Chrome Extension Storage for content script context
const createContentScriptStorage = () => {
  return createJSONStorage(() => ({
    getItem: async (key: string) => {
      try {
        const result = await globalThis.chrome.storage.local.get([key]);
        return result[key] || null;
      } catch (error) {
        console.error(`Failed to get item "${key}" from storage:`, error);
        return null;
      }
    },
    setItem: async (key: string, value: string) => {
      try {
        await globalThis.chrome.storage.local.set({ [key]: value });
      } catch (error) {
        console.error(`Failed to set item "${key}" in storage:`, error);
        throw error;
      }
    },
    removeItem: async (key: string) => {
      try {
        await globalThis.chrome.storage.local.remove([key]);
      } catch (error) {
        console.error(`Failed to remove item "${key}" from storage:`, error);
        throw error;
      }
    }
  }));
};

// Content script atoms - shared with popup
const contentScriptStorage = createContentScriptStorage();
const symbolListsAtom = atomWithStorage<SymbolList[]>('symbolLists', [], contentScriptStorage);
const currentListIdAtom = atomWithStorage<string | null>('currentListId', null, contentScriptStorage);

// Widget-specific atoms
const searchTermAtom = atom<string>('');
const selectedListAtom = atom<SymbolList | null>(
  (get) => {
    const currentListId = get(currentListIdAtom);
    const allLists = get(symbolListsAtom);
    return currentListId ? allLists.find(list => list.id === currentListId) || null : null;
  }
);

// Self-contained UI Components (duplicated for content script isolation)
const Card = ({ className = '', children, onClick, ...props }: any) => (
  <div
    className={`card ${className}`}
    onClick={onClick}
    {...props}
  >
    {children}
  </div>
);

const CardHeader = ({ className = '', children, ...props }: any) => (
  <div className={`flex flex-col space-y-1.5 p-4 ${className}`} {...props}>
    {children}
  </div>
);

const CardContent = ({ className = '', children, ...props }: any) => (
  <div className={`p-4 pt-0 ${className}`} {...props}>
    {children}
  </div>
);

const Button = ({ variant = 'default', size = 'default', className = '', children, onClick, title, ...props }: any) => (
  <button
    className={`btn btn-${variant} btn-${size} ${className}`}
    onClick={onClick}
    title={title}
    {...props}
  >
    {children}
  </button>
);

const Badge = ({ variant = 'default', className = '', children, ...props }: any) => (
  <div className={`badge badge-${variant} ${className}`} {...props}>
    {children}
  </div>
);

const Input = ({ className = '', placeholder, value, onChange, ...props }: any) => (
  <input
    className={`input ${className}`}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    {...props}
  />
);

// Widget Statistics Component
const WidgetStats = ({ symbols }: { symbols: StockSymbol[] }) => {
  const nseCount = symbols.filter(s => s.exchange === 'NSE').length;
  const bseCount = symbols.filter(s => s.exchange === 'BSE').length;

  return (
    <div className="flex gap-2 mb-2">
      {nseCount > 0 && (
        <Badge variant="nse" className="text-xs">
          NSE: {nseCount}
        </Badge>
      )}
      {bseCount > 0 && (
        <Badge variant="bse" className="text-xs">
          BSE: {bseCount}
        </Badge>
      )}
      <Badge variant="secondary" className="text-xs">
        Total: {symbols.length}
      </Badge>
    </div>
  );
};

// Main Widget Component using Jotai
function FloatingWidgetContent({ onClose, onMinimize, onStateChange, initialState }: FloatingWidgetProps) {
  const symbolLists = useAtomValue(symbolListsAtom);
  const [currentListId, setCurrentListId] = useAtom(currentListIdAtom);
  const selectedList = useAtomValue(selectedListAtom);
  const [searchTerm, setSearchTerm] = useAtom(searchTermAtom);

  // Initialize state from props
  useEffect(() => {
    if (initialState?.selectedListId && symbolLists.length > 0) {
      const savedList = symbolLists.find(list => list.id === initialState.selectedListId);
      if (savedList) {
        setCurrentListId(savedList.id);
      }
    }
    if (initialState?.searchTerm) {
      setSearchTerm(initialState.searchTerm);
    }
  }, [symbolLists, initialState, setCurrentListId, setSearchTerm]);

  // Save state when it changes
  useEffect(() => {
    if (onStateChange) {
      onStateChange(currentListId || '', searchTerm);
    }
  }, [currentListId, searchTerm, onStateChange]);

  const selectList = useCallback((listId: string) => {
    setCurrentListId(listId);
    setSearchTerm(''); // Reset search when selecting a list
  }, [setCurrentListId, setSearchTerm]);

  const openSymbol = useCallback((symbol: StockSymbol, forceCurrentTab: boolean = false) => {
    const url = `https://in.tradingview.com/chart/?symbol=${symbol.exchange}%3A${symbol.symbol}`;

    if (forceCurrentTab) {
      // Save state before navigation since current tab navigation will reload the page
      if (onStateChange) {
        onStateChange(currentListId || '', searchTerm);
      }
      // Navigate in current tab (will close overlay but state will be restored)
      window.location.href = url;
    } else {
      // Default: Open in new tab (keeps overlay open)
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, [currentListId, searchTerm, onStateChange]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, [setSearchTerm]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, [setSearchTerm]);

  // Filter and process symbols (matching main popup logic)
  const processedSymbols = useMemo(() => {
    if (!selectedList) return [];

    let filtered = selectedList.symbols;

    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = selectedList.symbols.filter(symbol =>
        symbol.symbol.toLowerCase().includes(search) ||
        symbol.exchange.toLowerCase().includes(search) ||
        symbol.stockName?.toLowerCase().includes(search)
      );
    }

    return filtered;
  }, [selectedList, searchTerm]);

  if (symbolLists.length === 0) {
    return (
      <Card className="w-80 max-h-96 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Symbol Manager</h3>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={onMinimize} title="Minimize">
                —
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose} title="Close">
                ×
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">No symbol lists found.</p>
            <p className="text-xs text-muted-foreground mt-1">Create lists in the extension popup.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-80 max-h-96 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Symbol Manager</h3>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={onMinimize} title="Minimize">
              —
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} title="Close">
              ×
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* List Selection */}
        <div className="space-y-3">
          <div>
            <select
              className="input text-xs w-full"
              value={currentListId || ''}
              onChange={(e) => selectList(e.target.value)}
            >
              <option value="" disabled>
                Select a list ({symbolLists.length} available)
              </option>
              {symbolLists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name} ({list.symbols.length} symbols)
                </option>
              ))}
            </select>
          </div>

          {/* Search Input (show only if a list is selected and has symbols) */}
          {selectedList && selectedList.symbols.length > 3 && (
            <div className="relative">
              <Input
                placeholder="Search symbols..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="text-xs pr-8"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 p-0 text-xs"
                  title="Clear search"
                >
                  ×
                </Button>
              )}
            </div>
          )}

          {/* Statistics */}
          {selectedList && (
            <WidgetStats symbols={processedSymbols} />
          )}

          {/* Symbol List */}
          {selectedList && (
            <div className="max-h-80 overflow-y-auto space-y-1">
              {processedSymbols.length === 0 ? (
                <div className="py-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    {searchTerm ? 'No symbols match your search.' : 'No symbols in this list.'}
                  </p>
                </div>
              ) : (
                processedSymbols.map((symbol, index) => (
                  <div
                    key={`${symbol.fullSymbol}-${index}`}
                    className="group flex items-center justify-between p-2 rounded-md border border-muted hover:bg-accent transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={symbol.exchange === 'NSE' ? 'nse' : 'bse'}
                          className="text-xs flex-shrink-0"
                        >
                          {symbol.exchange}
                        </Badge>
                        <span className="text-xs font-medium text-foreground truncate">
                          {symbol.symbol}
                        </span>
                      </div>
                      {symbol.stockName && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {symbol.stockName}
                        </p>
                      )}
                    </div>

                    {/* Navigation buttons */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openSymbol(symbol, true)}
                        className="h-6 w-6 p-0 text-xs"
                        title="Open in same tab"
                      >
                        👆
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openSymbol(symbol, false)}
                        className="h-6 w-6 p-0 text-xs"
                        title="Open in new tab"
                      >
                        🔗
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Main export with Jotai Provider
export default function FloatingWidget(props: FloatingWidgetProps) {
  return (
    <Provider>
      <FloatingWidgetContent {...props} />
    </Provider>
  );
}