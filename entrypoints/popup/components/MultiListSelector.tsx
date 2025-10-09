import React, { useState, useMemo } from 'react';
import { StockSymbol, SymbolList } from '../types/index';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from './ui/dialog';
import { Button } from './ui/button';

interface MultiListSelectorProps {
  symbol: StockSymbol;
  currentListId: string;
  allLists: SymbolList[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToList: (symbol: StockSymbol, listId: string) => Promise<void>;
  onRemoveFromList: (listId: string, symbol: StockSymbol) => Promise<void>;
}

export const MultiListSelector: React.FC<MultiListSelectorProps> = ({
  symbol,
  currentListId,
  allLists,
  open,
  onOpenChange,
  onAddToList,
  onRemoveFromList
}) => {
  const [processingListId, setProcessingListId] = useState<string | null>(null);

  // Determine which lists contain this symbol
  const listPresence = useMemo(() => {
    const presence: Record<string, boolean> = {};
    allLists.forEach(list => {
      presence[list.id] = list.symbols.some(s => s.fullSymbol === symbol.fullSymbol);
    });
    return presence;
  }, [allLists, symbol.fullSymbol]);

  const handleToggleList = async (listId: string, isCurrentlyInList: boolean) => {
    // Prevent action if already processing
    if (processingListId) return;

    // Prevent removing from current list (must keep at least in current list)
    if (listId === currentListId && isCurrentlyInList) {
      return;
    }

    setProcessingListId(listId);

    try {
      if (isCurrentlyInList) {
        // Remove from list
        await onRemoveFromList(listId, symbol);
      } else {
        // Add to list
        await onAddToList(symbol, listId);
      }
    } catch (error) {
      console.error('Error toggling list:', error);
    } finally {
      setProcessingListId(null);
    }
  };

  // Group lists: Favorites, Predefined, Custom
  const favoriteLists = allLists.filter(list => list.isFavoriteList);
  const predefinedLists = allLists.filter(list => list.isPredefined && !list.isFavoriteList);
  const customLists = allLists.filter(list => !list.isPredefined);

  const renderListItem = (list: SymbolList) => {
    const isInList = listPresence[list.id];
    const isCurrentList = list.id === currentListId;
    const isProcessing = processingListId === list.id;
    const isDisabled = isCurrentList && isInList; // Can't uncheck current list

    return (
      <div
        key={list.id}
        className={`flex items-center justify-between p-2 rounded-md hover:bg-background-muted transition-colors ${
          isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
        onClick={() => !isDisabled && !isProcessing && handleToggleList(list.id, isInList)}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Checkbox */}
          <div
            className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
              isInList
                ? 'bg-primary-500 border-primary-500'
                : 'border-foreground-muted'
            }`}
          >
            {isInList && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M10 3L4.5 8.5L2 6"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>

          {/* Color indicator */}
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: list.color }}
          />

          {/* List name */}
          <span className={`text-sm truncate ${isInList ? 'font-medium text-foreground' : 'text-foreground-muted'}`}>
            {list.name}
            {isCurrentList && ' (current)'}
          </span>
        </div>

        {/* Processing indicator */}
        {isProcessing && (
          <div className="spinner small"></div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Lists</DialogTitle>
          <DialogDescription>
            {symbol.fullSymbol} • Select lists to add or remove this symbol
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[400px] overflow-y-auto p-4 space-y-4">
          {/* Favorite Lists */}
          {favoriteLists.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-foreground-muted uppercase mb-2">
                ⭐ Favorites
              </h3>
              <div className="space-y-1">
                {favoriteLists.map(renderListItem)}
              </div>
            </div>
          )}

          {/* Predefined Lists */}
          {predefinedLists.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-foreground-muted uppercase mb-2">
                📋 Predefined Lists
              </h3>
              <div className="space-y-1">
                {predefinedLists.map(renderListItem)}
              </div>
            </div>
          )}

          {/* Custom Lists */}
          {customLists.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-foreground-muted uppercase mb-2">
                🎨 Custom Lists
              </h3>
              <div className="space-y-1">
                {customLists.map(renderListItem)}
              </div>
            </div>
          )}

          {/* Empty state */}
          {allLists.length === 0 && (
            <div className="text-center py-8 text-foreground-muted">
              <p className="text-sm">No lists available</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose onClick={() => onOpenChange(false)}>
            Done
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
