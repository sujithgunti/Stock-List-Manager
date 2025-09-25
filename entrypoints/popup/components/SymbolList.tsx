import React, { useState, useCallback, useMemo } from 'react';
import { SymbolListProps, StockSymbol } from '../types/index.js';
import { generateTradingViewUrl } from '../utils/parser.js';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';

type SortOption = 'symbol' | 'exchange' | 'stockName';
type SortDirection = 'asc' | 'desc';

export const SymbolList: React.FC<SymbolListProps> = ({
  symbols,
  onSymbolClick,
  onSymbolDelete,
  isLoading
}) => {
  const [sortBy, setSortBy] = useState<SortOption>('symbol');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [searchTerm, setSearchTerm] = useState('');

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
      <div className="flex items-center justify-center p-4">
        <div className="spinner mr-2"></div>
        <span className="text-foreground-muted">Loading symbols...</span>
      </div>
    );
  }

  if (symbols.length === 0) {
    return (
      <div className="text-center p-4">
        <div className="text-2xl mb-2">📊</div>
        <h3 className="text-sm font-medium text-foreground mb-1">No symbols yet</h3>
        <p className="text-xs text-foreground-muted">Upload a CSV file or paste symbols to get started</p>
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
        {processedSymbols.map((symbol) => (
          <div
            key={symbol.fullSymbol}
            className="flex items-center justify-between p-2 rounded-md bg-background-muted hover:bg-background-muted/80 cursor-pointer transition-colors group"
            onClick={() => handleSymbolClick(symbol)}
            title={`Click to open ${symbol.fullSymbol} on TradingView`}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Badge variant={symbol.exchange === 'NSE' ? 'nse' : 'bse'} className="text-xs flex-shrink-0">
                {symbol.exchange}
              </Badge>
              <div className="min-w-0">
                <div className="text-sm font-medium text-foreground truncate">{symbol.symbol}</div>
                {symbol.stockName && (
                  <div className="text-xs text-foreground-muted truncate">{symbol.stockName}</div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <div className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">🔗</div>
              <Button
                onClick={(e) => handleDeleteClick(e, symbol)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error/20 hover:text-error"
                title="Remove symbol"
              >
                🗑️
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Help text */}
      {symbols.length > 0 && (
        <div className="text-xs text-foreground-muted text-center pt-1">
          💡 Click any symbol to open its chart on TradingView
        </div>
      )}
    </div>
  );
};