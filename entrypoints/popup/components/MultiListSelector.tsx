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
import { Star, List, PlusCircle, Check, XSquare } from 'lucide-react';

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
        className={`flex items-center justify-between p-2.5 rounded-lg border transition-all duration-150 ${
          isDisabled
            ? 'opacity-50 cursor-not-allowed bg-background-muted/30 border-border/20'
            : isInList
            ? 'cursor-pointer bg-primary-500/10 border-primary-500/30 hover:bg-primary-500/15'
            : 'cursor-pointer bg-background-muted/30 border-border/20 hover:bg-background-muted/50 hover:border-border/40'
        }`}
        onClick={() => !isDisabled && !isProcessing && handleToggleList(list.id, isInList)}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {/* Checkbox */}
          <div
            className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
              isInList
                ? 'bg-primary-500 shadow-sm'
                : 'border border-foreground-muted/40'
            }`}
          >
            {isInList && (
              <Check size={10} className="text-white" strokeWidth={3} />
            )}
          </div>

          {/* Color indicator */}
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-1 ring-white/10"
            style={{ backgroundColor: list.color }}
          />

          {/* List name */}
          <span className={`text-sm truncate ${isInList ? 'font-medium text-foreground' : 'text-foreground-muted'}`}>
            {list.name}
            {isCurrentList && <span className="text-[10px] text-primary-400 ml-1">(current)</span>}
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
          <DialogTitle className="flex items-center gap-2">
            <Star size={16} className="text-primary-400" />
            Manage Lists
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{symbol.fullSymbol}</span> - Select lists to add or remove
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[350px] overflow-y-auto p-4 space-y-4">
          {/* Favorite Lists */}
          {favoriteLists.length > 0 && (
            <div>
              <h3 className="text-[10px] font-semibold text-foreground-muted uppercase tracking-wider mb-2 flex items-center gap-1">
                <Star size={10} className="text-warning" fill="currentColor" />
                Favorites
              </h3>
              <div className="space-y-1">
                {favoriteLists.map(renderListItem)}
              </div>
            </div>
          )}

          {/* Predefined Lists */}
          {predefinedLists.length > 0 && (
            <div>
              <h3 className="text-[10px] font-semibold text-foreground-muted uppercase tracking-wider mb-2 flex items-center gap-1">
                <List size={10} />
                Predefined Lists
              </h3>
              <div className="space-y-1">
                {predefinedLists.map(renderListItem)}
              </div>
            </div>
          )}

          {/* Custom Lists */}
          {customLists.length > 0 && (
            <div>
              <h3 className="text-[10px] font-semibold text-foreground-muted uppercase tracking-wider mb-2 flex items-center gap-1">
                <PlusCircle size={10} />
                Custom Lists
              </h3>
              <div className="space-y-1">
                {customLists.map(renderListItem)}
              </div>
            </div>
          )}

          {/* Empty state */}
          {allLists.length === 0 && (
            <div className="empty-state py-6">
              <div className="empty-state-icon">
                <XSquare size={24} className="mx-auto text-foreground-muted" strokeWidth={1.5} />
              </div>
              <p className="text-xs text-foreground-muted">No lists available</p>
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
