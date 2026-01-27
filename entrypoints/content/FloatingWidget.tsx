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


// Inline SVG Icons (for content script isolation)
const Icons = {
  minimize: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
    </svg>
  ),
  close: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
  arrowLeft: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  ),
  search: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  ),
  externalLink: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
    </svg>
  ),
  pointer: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 14a8 8 0 0 1-8 8M18 11v-1a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0M14 10V9a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v1M10 9.5V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v10" />
      <path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
    </svg>
  ),
  star: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  starOutline: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  list: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  info: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
    </svg>
  ),
  check: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  trendingUp: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
    </svg>
  ),
};

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
              <div className="list-group-title flex items-center gap-1">
                <span className="text-warning">{Icons.star}</span>
                <span>Favorite List</span>
              </div>
              {renderListCheckbox(favoriteList)}
            </div>
          )}

          {/* Predefined Lists */}
          {predefinedLists.length > 0 && (
            <div className="list-group">
              <div className="list-group-title flex items-center gap-1">
                {Icons.list}
                <span>Predefined Lists</span>
              </div>
              <div className="list-group-items">
                {predefinedLists.map(renderListCheckbox)}
              </div>
            </div>
          )}

          {/* Custom Lists */}
          {customLists.length > 0 && (
            <div className="list-group">
              <div className="list-group-title flex items-center gap-1">
                {Icons.list}
                <span>Custom Lists</span>
              </div>
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
  const [viewedListId, setViewedListId] = useState<string | null>(initialState?.selectedListId || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState(initialState?.searchTerm || '');
  const [globalCurrentListId, setGlobalCurrentListId] = useState<string | null>(null);

  // Multi-list modal state
  const [selectedSymbol, setSelectedSymbol] = useState<StockSymbol | null>(null);
  const [isMultiListModalOpen, setIsMultiListModalOpen] = useState(false);

  // Derive selectedList from lists and viewedListId to ensure it's always fresh
  const selectedList = useMemo(() => {
    if (!viewedListId) return null;
    return lists.find(l => l.id === viewedListId) || null;
  }, [lists, viewedListId]);

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
      const result = await chrome.storage.local.get(['symbolLists']);
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

      // Save back to storage (Always as JSON string for atomWithStorage compatibility)
      const dataToStore = JSON.stringify(updatedLists);
      await chrome.storage.local.set({ symbolLists: dataToStore });

      // Send message to background to sync changes to Cloud
      chrome.runtime.sendMessage({ type: 'SYNC_LIST_UPDATE', listId: toListId });

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
      const result = await chrome.storage.local.get(['symbolLists']);
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

      // Save back to storage (Always as JSON string for atomWithStorage compatibility)
      const dataToStore = JSON.stringify(updatedLists);
      await chrome.storage.local.set({ symbolLists: dataToStore });

      // Send message to background to sync changes to Cloud
      chrome.runtime.sendMessage({ type: 'SYNC_LIST_UPDATE', listId: listId });

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

  // Sync viewedListId with globalCurrentListId if no explicit selection
  useEffect(() => {
    if (lists.length > 0 && !viewedListId && globalCurrentListId) {
      // Only auto-select if we don't have a selection and have a global default
      // But respect 'Back' navigation (which sets viewedListId to null explicitely? No, null is 'Lists View')
      // Logic: If I just loaded and have no state, use global.
      // If I am in 'Lists View', viewedListId is null.
      // We should checking logic in loadSymbolLists instead.
      // For now, let's leave this blank or ensure correct initial hydration.
    }
  }, [lists, globalCurrentListId]);

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
        // Reload lists if symbolLists data changes
        if (changes.symbolLists) {
          loadSymbolLists();
        }
        // Update selection if global selection changes
        if (changes.currentListId) {
          // We might want to reload to get the fresh ID
          loadSymbolLists();
        }
      }
    };

    if (chrome && chrome.storage) {
      chrome.storage.onChanged.addListener(handleStorageChange);

      return () => {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      };
    }
  }, []);

  const loadSymbolLists = async () => {
    try {
      setLoading(true);
      setError('');

      // Check if Chrome API is available
      if (!chrome || !chrome.storage) {
        throw new Error('Chrome extension APIs not available');
      }

      const result = await chrome.storage.local.get(['symbolLists', 'currentListId']);

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
      setGlobalCurrentListId(storedCurrentListId);

      // If we have no viewed list yet, and we have a stored current list (and no initial state override), use it
      if (!viewedListId && !initialState?.selectedListId && storedCurrentListId) {
        setViewedListId(storedCurrentListId);
      } else if (initialState?.selectedListId && !viewedListId) {
        // ensure initial state is respected on first load (already handled by useState default, but safe to reinforce)
        setViewedListId(initialState.selectedListId);
      }

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
        setViewedListId(listId);
        setSearchTerm(''); // Reset search when selecting a list

        // Update currentListId in storage
        chrome.storage.local.set({ currentListId: listId }).catch(console.error);
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
      <div className="flex justify-center mb-2 opacity-60">{Icons.list}</div>
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

  // Detect current symbol from URL
  const [currentOpenedSymbol, setCurrentOpenedSymbol] = useState<string | null>(null);

  useEffect(() => {
    const detectSymbol = () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const symbolParam = urlParams.get('symbol');
        if (symbolParam) {
          // Param is usually "EXCHANGE:SYMBOL"
          setCurrentOpenedSymbol(symbolParam);
        } else {
          // Fallback: try to grab from page title or other elements if needed
          // For now, URL param is the most reliable for the extension's navigation flow
          setCurrentOpenedSymbol(null);
        }
      } catch (e) {
        console.error('Error detecting symbol:', e);
      }
    };

    detectSymbol();
    // Listen for URL changes if possible (though popstate might not trigger on query param change without navigation)
    window.addEventListener('popstate', detectSymbol);
    return () => window.removeEventListener('popstate', detectSymbol);
  }, []);

  // Ref for scrolling to active symbol
  const activeSymbolRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to active symbol when list changes or symbol is detected
  useEffect(() => {
    if (activeSymbolRef.current) {
      activeSymbolRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentOpenedSymbol, selectedList]);

  return (
    <Card className="w-80 max-h-96 bg-background border shadow-lg">
      {/* Header */}
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 header-gradient">
        <div className="flex items-center gap-2">
          <span className="text-white">{Icons.trendingUp}</span>
          <h3 className="text-sm font-semibold text-white">Symbol Lists</h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-white/80 hover:text-white"
            onClick={onMinimize}
            title="Minimize"
          >
            {Icons.minimize}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-white/80 hover:text-white"
            onClick={onClose}
            title="Close"
          >
            {Icons.close}
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
                      onClick={() => setViewedListId(null)}
                      className="text-xs flex items-center gap-1"
                    >
                      {Icons.arrowLeft}
                      <span>Back to Lists</span>
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
                          title="Clear search"
                        >
                          {Icons.close}
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
                      const starClass = inOtherLists ? 'text-warning' : 'text-muted-foreground opacity-50';

                      // Check if symbol is currently opened (matches URL)
                      const isCurrent = currentOpenedSymbol === symbol.fullSymbol ||
                        currentOpenedSymbol === `${symbol.exchange}:${symbol.symbol}`;

                      return (
                        <div
                          key={symbol.fullSymbol}
                          ref={isCurrent ? activeSymbolRef : null}
                          className={`flex items-center justify-between p-2 rounded-lg border transition-all duration-150 group ${isCurrent
                            ? 'border-primary-500/50 bg-primary-500/10'
                            : 'border-transparent bg-background-muted hover:bg-background-muted/80 hover:border-border/30'
                            }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {/* Star icon for multi-list indicator */}
                            <button
                              onClick={(e) => handleStarClick(e, symbol)}
                              className={`flex-shrink-0 hover:scale-110 transition-transform ${starClass} star-button`}
                              title={inOtherLists ? 'In multiple lists - click to manage' : 'Only in this list - click to add to others'}
                            >
                              {inOtherLists ? Icons.star : Icons.starOutline}
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
                                <div className={`text-sm font-medium truncate ${isCurrent ? 'text-primary-400' : 'text-foreground'}`}>{symbol.symbol}</div>
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
                              title="Open in current tab"
                            >
                              {Icons.pointer}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                openSymbol(symbol, false);
                              }}
                              title="Open in new tab"
                            >
                              {Icons.externalLink}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Help text */}
                  {selectedList.symbols.length > 0 && (
                    <div className="text-xs text-muted-foreground text-center pt-1 flex items-center justify-center gap-1">
                      {Icons.info}
                      <span>Click symbol to open, hover for more options</span>
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