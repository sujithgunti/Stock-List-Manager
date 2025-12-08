import React, { useState, useCallback, useMemo } from 'react';
import { SymbolListProps, StockSymbol } from '../types/index.js';
import { generateTradingViewUrl } from '../utils/parser.js';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { MultiListSelector } from './MultiListSelector';
import { TrendingUp, Star, ExternalLink, Trash2, Info } from 'lucide-react';

type SortOption = 'symbol' | 'exchange' | 'stockName';
type SortDirection = 'asc' | 'desc';

export const SymbolList: React.FC<SymbolListProps> = ({
  symbols,
  onSymbolClick,
  onSymbolDelete,
  isLoading,
  currentListId,
  allLists = [],
  symbolOccurrences = {},
  onCopySymbol,
  onRemoveSymbol
}) => {
  const [sortBy, setSortBy] = useState<SortOption>('symbol');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState<StockSymbol | null>(null);
  const [isMultiListModalOpen, setIsMultiListModalOpen] = useState(false);

  // Check if multi-list features are enabled
  const multiListEnabled = currentListId && allLists.length > 0 && onCopySymbol && onRemoveSymbol;

  // Filter and sort symbols
  const processedSymbols = useMemo(() => {
    let filtered = symbols;

    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = symbols.filter(symbol =>
        symbol.symbol.toLowerCase().includes(search) ||
        symbol.exchange.toLowerCase().includes(search) ||
        symbol.stockName?.toLowerCase().includes(search)
      );
    }

    // Sort symbols
    filtered.sort((a, b) => {
      let aValue: string, bValue: string;

      switch (sortBy) {
        case 'exchange':
          aValue = a.exchange;
          bValue = b.exchange;
          break;
        case 'stockName':
          aValue = a.stockName || a.symbol;
          bValue = b.stockName || b.symbol;
          break;
        default:
          aValue = a.symbol;
          bValue = b.symbol;
      }

      const comparison = aValue.localeCompare(bValue);
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [symbols, searchTerm, sortBy, sortDirection]);

  const handleSort = useCallback((option: SortOption) => {
    if (sortBy === option) {
      // Toggle direction if same column
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, start with ascending
      setSortBy(option);
      setSortDirection('asc');
    }
  }, [sortBy]);

  const handleSymbolClick = useCallback((symbol: StockSymbol) => {
    onSymbolClick(symbol);

    // Open TradingView in new tab
    const url = generateTradingViewUrl(symbol);
    window.open(url, '_blank');
  }, [onSymbolClick]);

  const handleDeleteClick = useCallback((e: React.MouseEvent, symbol: StockSymbol) => {
    e.stopPropagation(); // Prevent triggering symbol click
    onSymbolDelete(symbol);
  }, [onSymbolDelete]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  // Phase 7: Multi-list star icon handlers
  const handleStarClick = useCallback((e: React.MouseEvent, symbol: StockSymbol) => {
    e.stopPropagation(); // Prevent triggering symbol click
    if (multiListEnabled) {
      setSelectedSymbol(symbol);
      setIsMultiListModalOpen(true);
    }
  }, [multiListEnabled]);

  const handleAddToList = useCallback(async (symbol: StockSymbol, toListId: string) => {
    if (onCopySymbol) {
      await onCopySymbol(symbol, toListId);
    }
  }, [onCopySymbol]);

  const handleRemoveFromList = useCallback(async (listId: string, symbol: StockSymbol) => {
    if (onRemoveSymbol) {
      await onRemoveSymbol(listId, symbol);
    }
  }, [onRemoveSymbol]);

  // Check if symbol is in other lists (for star state)
  const isSymbolInOtherLists = useCallback((symbol: StockSymbol) => {
    return symbolOccurrences[symbol.fullSymbol]?.length > 0;
  }, [symbolOccurrences]);

  // Group symbols by exchange for stats
  const exchangeStats = useMemo(() => {
    const stats: Record<string, number> = {};
    symbols.forEach(symbol => {
      stats[symbol.exchange] = (stats[symbol.exchange] || 0) + 1;
    });
    return stats;
  }, [symbols]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="spinner mr-2"></div>
        <span className="text-sm text-foreground-muted">Loading symbols...</span>
      </div>
    );
  }

  if (symbols.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <TrendingUp size={32} className="mx-auto text-foreground-muted" strokeWidth={1.5} />
        </div>
        <h3 className="empty-state-title">No symbols yet</h3>
        <p className="empty-state-description">Upload a CSV or paste symbols to start</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      {symbols.length > 3 && (
        <div className="relative">
          <Input
            type="text"
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

      {/* Stats */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-foreground-muted">{symbols.length} symbols</span>
        {Object.entries(exchangeStats).map(([exchange, count]) => (
          <Badge key={exchange} variant={exchange === 'NSE' ? 'nse' : 'bse'} className="text-xs">
            {exchange}: {count}
          </Badge>
        ))}
      </div>

      {/* Filtered results info */}
      {searchTerm && (
        <div className="text-xs text-foreground-muted">
          Showing {processedSymbols.length} of {symbols.length} symbols
          {processedSymbols.length === 0 && (
            <span className="text-error"> - No matches found</span>
          )}
        </div>
      )}

      {/* Symbol list */}
      <div className="space-y-1">
        {processedSymbols.map((symbol) => {
          const inOtherLists = isSymbolInOtherLists(symbol);

          return (
            <div
              key={symbol.fullSymbol}
              className="symbol-item flex items-center justify-between p-2 rounded-lg bg-background-muted/50 hover:bg-background-muted cursor-pointer transition-all duration-150 group border border-transparent hover:border-border/30"
              onClick={() => handleSymbolClick(symbol)}
              title={`Click to open ${symbol.fullSymbol} on TradingView`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {/* Star icon for multi-list indicator */}
                {multiListEnabled && (
                  <button
                    onClick={(e) => handleStarClick(e, symbol)}
                    className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-150 ${
                      inOtherLists
                        ? 'text-warning bg-warning/10 hover:bg-warning/20'
                        : 'text-foreground-muted/40 hover:text-foreground-muted hover:bg-background-card'
                    }`}
                    title={inOtherLists ? 'In multiple lists - click to manage' : 'Click to add to other lists'}
                  >
                    <Star size={12} fill={inOtherLists ? 'currentColor' : 'none'} />
                  </button>
                )}

                <Badge variant={symbol.exchange === 'NSE' ? 'nse' : 'bse'} className="text-[10px] flex-shrink-0">
                  {symbol.exchange}
                </Badge>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{symbol.symbol}</div>
                  {symbol.stockName && (
                    <div className="text-[11px] text-foreground-muted truncate">{symbol.stockName}</div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <ExternalLink size={12} className="opacity-0 group-hover:opacity-50 transition-opacity text-foreground-muted" />
                <Button
                  onClick={(e) => handleDeleteClick(e, symbol)}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error/20 hover:text-error"
                  title="Remove symbol"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Help text */}
      {symbols.length > 3 && (
        <div className="text-[11px] text-foreground-muted/70 text-center pt-1 flex items-center justify-center gap-1">
          <Info size={10} />
          Click any symbol to open on TradingView
        </div>
      )}

      {/* Multi-list selector modal */}
      {multiListEnabled && selectedSymbol && currentListId && (
        <MultiListSelector
          symbol={selectedSymbol}
          currentListId={currentListId}
          allLists={allLists}
          open={isMultiListModalOpen}
          onOpenChange={setIsMultiListModalOpen}
          onAddToList={handleAddToList}
          onRemoveFromList={handleRemoveFromList}
        />
      )}
    </div>
  );
};