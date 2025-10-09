import React, { useState, useEffect, useMemo, useCallback } from 'react';

// Types (inline to avoid import issues)
interface StockSymbol {
  symbol: string;
  exchange: string;
  fullSymbol: string;
  stockName?: string;
  addedAt: Date;
  notes?: string;
}

interface SymbolList {
  id: string;
  name: string;
  color: string;
  isPredefined: boolean;
  isFavoriteList: boolean;
  symbols: StockSymbol[];
  createdAt: Date;
  updatedAt: Date;
}

interface ListReference {
  listId: string;
  listName: string;
  listColor: string;
}

interface ColorOption {
  name: string;
  hex: string;
}

// Predefined colored lists
const PREDEFINED_LISTS = [
  { name: "🔴 Red List", color: "#ef4444", isPredefined: true, isFavoriteList: false },
  { name: "🔵 Blue List", color: "#3b82f6", isPredefined: true, isFavoriteList: false },
  { name: "🟢 Green List", color: "#10b981", isPredefined: true, isFavoriteList: false },
  { name: "🟠 Orange List", color: "#f59e0b", isPredefined: true, isFavoriteList: false },
  { name: "🟣 Purple List", color: "#8b5cf6", isPredefined: true, isFavoriteList: false },
  { name: "⭐ Favorites", color: "#ffd700", isPredefined: true, isFavoriteList: true }
] as const;

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

// Dialog Component for Modal
interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  useEffect(() => {
    if (!open) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="dialog-backdrop"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="dialog-content-wrapper"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

const DialogContent = ({ children, className = '' }: DialogContentProps) => (
  <div className={`dialog-content ${className}`}>
    {children}
  </div>
);

const DialogHeader = ({ children, className = '' }: any) => (
  <div className={`dialog-header ${className}`}>
    {children}
  </div>
);

const DialogTitle = ({ children, className = '' }: any) => (
  <h3 className={`dialog-title ${className}`}>
    {children}
  </h3>
);

const DialogDescription = ({ children, className = '' }: any) => (
  <p className={`dialog-description ${className}`}>
    {children}
  </p>
);

// MultiListSelector Component
interface MultiListSelectorProps {
  symbol: StockSymbol;
  currentListId: string;
  allLists: SymbolList[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToList: (symbol: StockSymbol, toListId: string) => Promise<void>;
  onRemoveFromList: (listId: string, symbol: StockSymbol) => Promise<void>;
}

const MultiListSelector = ({
  symbol,
  currentListId,
  allLists,
  open,
  onOpenChange,
  onAddToList,
  onRemoveFromList
}: MultiListSelectorProps) => {
  // Calculate which lists contain this symbol
  const listPresence = useMemo(() => {
    const presence: Record<string, boolean> = {};
    allLists.forEach(list => {
      presence[list.id] = list.symbols.some(s => s.fullSymbol === symbol.fullSymbol);
    });
    return presence;
  }, [allLists, symbol.fullSymbol]);

  // Group lists by type
  const favoriteList = useMemo(() => allLists.find(l => l.isFavoriteList), [allLists]);
  const predefinedLists = useMemo(() => allLists.filter(l => l.isPredefined && !l.isFavoriteList), [allLists]);
  const customLists = useMemo(() => allLists.filter(l => !l.isPredefined), [allLists]);

  const handleToggleList = async (listId: string, isCurrentlyInList: boolean) => {
    // Prevent removing from current list
    if (listId === currentListId && isCurrentlyInList) {
      return;
    }

    if (isCurrentlyInList) {
      await onRemoveFromList(listId, symbol);
    } else {
      await onAddToList(symbol, listId);
    }
  };

  const renderListCheckbox = (list: SymbolList) => {
    const isInList = listPresence[list.id];
    const isCurrentList = list.id === currentListId;
    const canToggle = !isCurrentList || !isInList;

    return (
      <div
        key={list.id}
        className={`list-checkbox-item ${!canToggle ? 'disabled' : ''}`}
        onClick={() => canToggle && handleToggleList(list.id, isInList)}
      >
        <div className="checkbox-wrapper">
          <input
            type="checkbox"
            checked={isInList}
            disabled={!canToggle}
            readOnly
            className="checkbox-input"
          />
        </div>
        <div className="list-info">
          <div className="list-name-row">
            <span className="list-color-dot" style={{ backgroundColor: list.color }}></span>
            <span className="list-name">{list.name}</span>
          </div>
          {isCurrentList && (
            <span className="current-list-badge">Current List</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Symbol Across Lists</DialogTitle>
          <DialogDescription>
            Add or remove <strong>{symbol.fullSymbol}</strong> from lists
          </DialogDescription>
        </DialogHeader>

        <div className="multi-list-selector-body">
          {/* Favorites */}
          {favoriteList && (
            <div className="list-group">
              <div className="list-group-title">⭐ Favorite List</div>
              {renderListCheckbox(favoriteList)}
            </div>
          )}

          {/* Predefined Lists */}
          {predefinedLists.length > 0 && (
            <div className="list-group">
              <div className="list-group-title">🎨 Predefined Lists</div>
              <div className="list-group-items">
                {predefinedLists.map(renderListCheckbox)}
              </div>
            </div>
          )}

          {/* Custom Lists */}
          {customLists.length > 0 && (
            <div className="list-group">
              <div className="list-group-title">📝 Custom Lists</div>
              <div className="list-group-items">
                {customLists.map(renderListCheckbox)}
              </div>
            </div>
          )}

          {/* No other lists message */}
          {allLists.length <= 1 && (
            <div className="text-center text-muted-foreground text-sm py-4">
              No other lists available. Create more lists in the popup!
            </div>
          )}
        </div>

        <div className="dialog-footer">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function FloatingWidget({ onClose, onMinimize, onStateChange, initialState }: FloatingWidgetProps) {
  const [lists, setLists] = useState<SymbolList[]>([]);
  const [selectedList, setSelectedList] = useState<SymbolList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState(initialState?.searchTerm || '');
  const [currentListId, setCurrentListId] = useState<string | null>(null);

  // Multi-list modal state
  const [selectedSymbol, setSelectedSymbol] = useState<StockSymbol | null>(null);
  const [isMultiListModalOpen, setIsMultiListModalOpen] = useState(false);

  // Calculate symbol occurrences across lists (for star indicator)
  const symbolOccurrences = useMemo(() => {
    if (!selectedList) return {};

    const occurrences: Record<string, ListReference[]> = {};

    selectedList.symbols.forEach((symbol) => {
      const otherLists: ListReference[] = [];

      lists.forEach((list) => {
        if (list.id === selectedList.id) return; // Skip current list

        const symbolExists = list.symbols.some(s => s.fullSymbol === symbol.fullSymbol);
        if (symbolExists) {
          otherLists.push({
            listId: list.id,
            listName: list.name,
            listColor: list.color
          });
        }
      });

      if (otherLists.length > 0) {
        occurrences[symbol.fullSymbol] = otherLists;
      }
    });

    return occurrences;
  }, [lists, selectedList]);

  // Multi-list handlers
  const handleCopySymbol = useCallback(async (symbol: StockSymbol, toListId: string) => {
    try {
      // Load current lists from storage
      const result = await globalThis.chrome.storage.local.get(['symbolLists']);
      let storedLists: SymbolList[] = [];

      if (result.symbolLists) {
        if (typeof result.symbolLists === 'string') {
          storedLists = JSON.parse(result.symbolLists);
        } else {
          storedLists = result.symbolLists;
        }
      }

      // Find target list and add symbol if not already present
      const updatedLists = storedLists.map(list => {
        if (list.id === toListId) {
          const symbolExists = list.symbols.some(s => s.fullSymbol === symbol.fullSymbol);
          if (!symbolExists) {
            return {
              ...list,
              symbols: [...list.symbols, symbol],
              updatedAt: new Date()
            };
          }
        }
        return list;
      });

      // Save back to storage
      const dataToStore = typeof result.symbolLists === 'string'
        ? JSON.stringify(updatedLists)
        : updatedLists;

      await globalThis.chrome.storage.local.set({ symbolLists: dataToStore });

      // Reload lists to reflect changes
      await loadSymbolLists();
    } catch (err) {
      console.error('Error copying symbol:', err);
      setError('Failed to copy symbol');
    }
  }, []);

  const handleRemoveFromList = useCallback(async (listId: string, symbol: StockSymbol) => {
    try {
      // Load current lists from storage
      const result = await globalThis.chrome.storage.local.get(['symbolLists']);
      let storedLists: SymbolList[] = [];

      if (result.symbolLists) {
        if (typeof result.symbolLists === 'string') {
          storedLists = JSON.parse(result.symbolLists);
        } else {
          storedLists = result.symbolLists;
        }
      }

      // Find target list and remove symbol
      const updatedLists = storedLists.map(list => {
        if (list.id === listId) {
          return {
            ...list,
            symbols: list.symbols.filter(s => s.fullSymbol !== symbol.fullSymbol),
            updatedAt: new Date()
          };
        }
        return list;
      });

      // Save back to storage
      const dataToStore = typeof result.symbolLists === 'string'
        ? JSON.stringify(updatedLists)
        : updatedLists;

      await globalThis.chrome.storage.local.set({ symbolLists: dataToStore });

      // Reload lists to reflect changes
      await loadSymbolLists();
    } catch (err) {
      console.error('Error removing symbol:', err);
      setError('Failed to remove symbol');
    }
  }, []);

  const handleStarClick = useCallback((e: React.MouseEvent, symbol: StockSymbol) => {
    e.stopPropagation(); // Prevent triggering symbol click
    setSelectedSymbol(symbol);
    setIsMultiListModalOpen(true);
  }, []);

  const isSymbolInOtherLists = useCallback((symbol: StockSymbol) => {
    return symbolOccurrences[symbol.fullSymbol]?.length > 0;
  }, [symbolOccurrences]);

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
                    {processedSymbols.map((symbol) => {
                      const inOtherLists = isSymbolInOtherLists(symbol);
                      const starIcon = inOtherLists ? '★' : '☆';
                      const starClass = inOtherLists ? 'text-warning' : 'text-muted-foreground opacity-50';

                      return (
                        <div
                          key={symbol.fullSymbol}
                          className="flex items-center justify-between p-2 rounded-md bg-background-muted hover:bg-background-muted/80 transition-colors group"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {/* Star icon for multi-list indicator */}
                            <button
                              onClick={(e) => handleStarClick(e, symbol)}
                              className={`flex-shrink-0 text-lg hover:scale-110 transition-transform ${starClass} star-button`}
                              title={inOtherLists ? 'In multiple lists - click to manage' : 'Only in this list - click to add to others'}
                            >
                              {starIcon}
                            </button>

                            {/* Symbol info - clickable to open TradingView */}
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
                          </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* Navigation buttons */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e: React.MouseEvent) => {
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
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              openSymbol(symbol, false);
                            }}
                            title="Open in new tab (keeps overlay open)"
                          >
                            🔗
                          </Button>
                        </div>
                        </div>
                      );
                    })}
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

      {/* Multi-list selector modal */}
      {selectedList && selectedSymbol && (
        <MultiListSelector
          symbol={selectedSymbol}
          currentListId={selectedList.id}
          allLists={lists}
          open={isMultiListModalOpen}
          onOpenChange={setIsMultiListModalOpen}
          onAddToList={handleCopySymbol}
          onRemoveFromList={handleRemoveFromList}
        />
      )}
    </Card>
  );
}