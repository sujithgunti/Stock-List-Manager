import React, { useState, useEffect, useMemo, useCallback } from 'react';

// Types (inline to avoid import issues)
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


// Self-contained UI Components
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

export default function FloatingWidget({ onClose, onMinimize, onStateChange, initialState }: FloatingWidgetProps) {
  const [lists, setLists] = useState<SymbolList[]>([]);
  const [selectedList, setSelectedList] = useState<SymbolList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState(initialState?.searchTerm || '');
  const [currentListId, setCurrentListId] = useState<string | null>(null);

  // Load symbol lists on component mount
  useEffect(() => {
    loadSymbolLists();
  }, []);

  // Restore selected list from saved state or current list ID
  useEffect(() => {
    if (lists.length > 0) {
      let targetListId = initialState?.selectedListId || currentListId;
      if (targetListId) {
        const savedList = lists.find(list => list.id === targetListId);
        if (savedList) {
          setSelectedList(savedList);
        }
      }
    }
  }, [lists, initialState?.selectedListId, currentListId]);

  // Save state when search term or selected list changes
  useEffect(() => {
    if (onStateChange) {
      onStateChange(selectedList?.id, searchTerm);
    }
  }, [selectedList?.id, searchTerm, onStateChange]);

  // Listen for storage changes from popup
  useEffect(() => {
    const handleStorageChange = (changes: any, namespace: string) => {
      if (namespace === 'local') {
        if (changes.symbolLists) {
          loadSymbolLists();
        }
      }
    };

    if (globalThis.chrome && globalThis.chrome.storage) {
      globalThis.chrome.storage.onChanged.addListener(handleStorageChange);

      return () => {
        globalThis.chrome.storage.onChanged.removeListener(handleStorageChange);
      };
    }
  }, []);

  const loadSymbolLists = async () => {
    try {
      setLoading(true);
      setError('');

      // Check if Chrome API is available
      if (!globalThis.chrome || !globalThis.chrome.storage) {
        throw new Error('Chrome extension APIs not available');
      }

      const result = await globalThis.chrome.storage.local.get(['symbolLists', 'currentListId']);

      // Parse data with compatibility for both Jotai JSON strings and raw objects
      let lists: SymbolList[] = [];
      let storedCurrentListId: string | null = null;

      // Handle symbolLists - could be JSON string (Jotai) or raw array
      if (result.symbolLists) {
        if (typeof result.symbolLists === 'string') {
          try {
            lists = JSON.parse(result.symbolLists);
          } catch (parseError) {
            console.error('Failed to parse symbolLists JSON:', parseError);
            lists = [];
          }
        } else if (Array.isArray(result.symbolLists)) {
          lists = result.symbolLists;
        } else {
          console.warn('Unexpected symbolLists format:', typeof result.symbolLists);
          lists = [];
        }
      }

      // Handle currentListId - could be JSON string (Jotai) or raw value
      if (result.currentListId !== undefined && result.currentListId !== null) {
        if (typeof result.currentListId === 'string') {
          // Could be a JSON string or just a regular string
          if (result.currentListId.startsWith('"') && result.currentListId.endsWith('"')) {
            try {
              storedCurrentListId = JSON.parse(result.currentListId);
            } catch (parseError) {
              storedCurrentListId = result.currentListId;
            }
          } else {
            storedCurrentListId = result.currentListId;
          }
        } else {
          storedCurrentListId = result.currentListId;
        }
      }

      // Validate that lists is actually an array
      if (!Array.isArray(lists)) {
        console.error('lists is not an array:', lists);
        lists = [];
      }

      setLists(lists);
      setCurrentListId(storedCurrentListId);
    } catch (err) {
      console.error('Error loading symbol lists:', err);
      setError('Failed to load symbol lists');
    } finally {
      setLoading(false);
    }
  };

  const selectList = async (listId: string) => {
    try {
      // Find the list from already loaded lists
      const list = lists.find(l => l.id === listId);
      if (list) {
        setSelectedList(list);
        setSearchTerm(''); // Reset search when selecting a list

        // Update currentListId in storage
        globalThis.chrome.storage.local.set({ currentListId: listId }).catch(console.error);
      } else {
        setError('Failed to find list');
      }
    } catch (err) {
      console.error('Error selecting list:', err);
      setError('Failed to load list');
    }
  };

  const openSymbol = useCallback((symbol: StockSymbol, forceCurrentTab: boolean = false) => {
    const url = `https://in.tradingview.com/chart/?symbol=${symbol.exchange}%3A${symbol.symbol}`;

    if (forceCurrentTab) {
      // Save state before navigation since current tab navigation will reload the page
      if (onStateChange) {
        onStateChange(selectedList?.id, searchTerm);
      }
      // Navigate in current tab (will close overlay but state will be restored)
      window.location.href = url;
    } else {
      // Default: Open in new tab (keeps overlay open)
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, [selectedList?.id, searchTerm, onStateChange]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

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

    // Sort symbols by symbol name
    filtered.sort((a, b) => a.symbol.localeCompare(b.symbol));

    return filtered;
  }, [selectedList, searchTerm]);

  // Group symbols by exchange for stats (matching main popup logic)
  const exchangeStats = useMemo(() => {
    if (!selectedList) return {};
    const stats: Record<string, number> = {};
    selectedList.symbols.forEach(symbol => {
      stats[symbol.exchange] = (stats[symbol.exchange] || 0) + 1;
    });
    return stats;
  }, [selectedList]);

  const EmptyState = () => (
    <div className="text-center py-8 text-muted-foreground">
      <div className="text-sm">📊</div>
      <div className="text-sm font-medium mb-1">No symbol lists found</div>
      <div className="text-xs">Use the extension popup to create lists</div>
    </div>
  );

  const LoadingState = () => (
    <div className="text-center py-8">
      <div className="text-sm text-muted-foreground">Loading symbol lists...</div>
    </div>
  );

  const ErrorState = () => (
    <div className="text-center py-8 text-destructive">
      <div className="text-sm">{error}</div>
      <Button
        variant="outline"
        size="sm"
        className="mt-2"
        onClick={loadSymbolLists}
      >
        Retry
      </Button>
    </div>
  );

  return (
    <Card className="w-80 max-h-96 bg-background border shadow-lg">
      {/* Header */}
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
        <h3 className="text-sm font-semibold">Symbol Lists</h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onMinimize}
          >
            −
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onClose}
          >
            ✕
          </Button>
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="px-4 pb-4">
        <div className="max-h-80 overflow-y-auto space-y-2">
          {loading && <LoadingState />}
          {error && !loading && <ErrorState />}
          {!loading && !error && lists.length === 0 && <EmptyState />}

          {!loading && !error && lists.length > 0 && (
            <>
              {/* Lists View */}
              {!selectedList && (
                <div className="space-y-2">
                  {lists.map((list) => (
                    <Card
                      key={list.id}
                      className="cursor-pointer hover:bg-accent transition-colors border-muted"
                      onClick={() => selectList(list.id)}
                    >
                      <CardContent className="p-3">
                        <div className="font-medium text-sm">{list.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {list.symbols.length} symbols
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Selected List Symbols View (matching main popup design) */}
              {selectedList && (
                <div className="space-y-3">
                  {/* Back button */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedList(null)}
                      className="text-xs"
                    >
                      ← Back to Lists
                    </Button>
                  </div>

                  {/* Search (only show if more than 3 symbols, matching main popup) */}
                  {selectedList.symbols.length > 3 && (
                    <div className="relative">
                      <Input
                        value={searchTerm}
                        onChange={handleSearchChange}
                        placeholder="Search symbols..."
                        className="pr-8"
                      />
                      {searchTerm && (
                        <Button
                          onClick={clearSearch}
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                        >
                          ✕
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Stats (matching main popup) */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground">{selectedList.symbols.length} symbols</span>
                    {Object.entries(exchangeStats).map(([exchange, count]) => (
                      <Badge key={exchange} variant={exchange === 'NSE' ? 'nse' : 'bse'} className="text-xs">
                        {exchange}: {count}
                      </Badge>
                    ))}
                  </div>

                  {/* Filtered results info */}
                  {searchTerm && (
                    <div className="text-xs text-muted-foreground">
                      Showing {processedSymbols.length} of {selectedList.symbols.length} symbols
                      {processedSymbols.length === 0 && (
                        <span className="text-error"> - No matches found</span>
                      )}
                    </div>
                  )}

                  {/* Symbol list (matching main popup row-based design) */}
                  <div className="space-y-1">
                    {processedSymbols.map((symbol) => (
                      <div
                        key={symbol.fullSymbol}
                        className="flex items-center justify-between p-2 rounded-md bg-background-muted hover:bg-background-muted/80 transition-colors group"
                      >
                        <div
                          className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
                          onClick={() => openSymbol(symbol, true)}
                          title={`Click to open ${symbol.fullSymbol} in same tab (overlay will restore quickly)`}
                        >
                          <Badge variant={symbol.exchange === 'NSE' ? 'nse' : 'bse'} className="text-xs flex-shrink-0">
                            {symbol.exchange}
                          </Badge>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">{symbol.symbol}</div>
                            {symbol.stockName && (
                              <div className="text-xs text-muted-foreground truncate">{symbol.stockName}</div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* Navigation buttons */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              openSymbol(symbol, true);
                            }}
                            title="Open in current tab (overlay will restore quickly)"
                          >
                            👆
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              openSymbol(symbol, false);
                            }}
                            title="Open in new tab (keeps overlay open)"
                          >
                            🔗
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Help text */}
                  {selectedList.symbols.length > 0 && (
                    <div className="text-xs text-muted-foreground text-center pt-1">
                      💡 Click symbol to open in same tab, or hover for more options
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}