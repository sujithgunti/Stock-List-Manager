import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ListManagerProps, SymbolList } from '../types/index.js';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { List, FilePlus, PenLine, Trash2, Plus, LayoutGrid, AlertCircle, AlertTriangle } from 'lucide-react';

export const ListManager: React.FC<ListManagerProps> = ({
  lists,
  currentList,
  onListSelect,
  onListCreate,
  onListRename,
  onListDelete
}) => {
  // Ensure lists is always an array
  const safeLists = Array.isArray(lists) ? lists : [];

  const [isCreating, setIsCreating] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [listToDelete, setListToDelete] = useState<string | null>(null);

  const createInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Focus input when starting to create/rename
  useEffect(() => {
    if (isCreating && createInputRef.current) {
      createInputRef.current.focus();
    } else if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus();
    }
  }, [isCreating, isRenaming]);

  const handleListSelect = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const listId = e.target.value;
    if (listId) {
      const list = lists.find(l => l.id === listId);
      if (list) {
        onListSelect(list);
      }
    }
  }, [lists, onListSelect]);

  const startCreating = useCallback(() => {
    setIsCreating(true);
    setNewListName(`My List ${lists.length + 1}`);
  }, [lists.length]);

  const cancelCreating = useCallback(() => {
    setIsCreating(false);
    setNewListName('');
  }, []);

  const handleCreateList = useCallback(async () => {
    const name = newListName.trim();
    if (!name) return;

    try {
      await onListCreate(name);
      setIsCreating(false);
      setNewListName('');
    } catch (error) {
      console.error('Failed to create list:', error);
    }
  }, [newListName, onListCreate]);

  const handleCreateKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateList();
    } else if (e.key === 'Escape') {
      cancelCreating();
    }
  }, [handleCreateList, cancelCreating]);

  const startRenaming = useCallback(() => {
    if (currentList) {
      setIsRenaming(true);
      setNewListName(currentList.name);
    }
  }, [currentList]);

  const cancelRenaming = useCallback(() => {
    setIsRenaming(false);
    setNewListName('');
  }, []);

  const handleRenameList = useCallback(async () => {
    if (!currentList) return;

    const name = newListName.trim();
    if (!name || name === currentList.name) {
      cancelRenaming();
      return;
    }

    try {
      await onListRename(currentList.id, name);
      setIsRenaming(false);
      setNewListName('');
    } catch (error) {
      console.error('Failed to rename list:', error);
    }
  }, [currentList, newListName, onListRename, cancelRenaming]);

  const handleRenameKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameList();
    } else if (e.key === 'Escape') {
      cancelRenaming();
    }
  }, [handleRenameList, cancelRenaming]);

  const confirmDelete = useCallback((listId: string) => {
    setListToDelete(listId);
    setShowDeleteConfirm(true);
  }, []);

  const cancelDelete = useCallback(() => {
    setShowDeleteConfirm(false);
    setListToDelete(null);
  }, []);

  const handleDeleteList = useCallback(async () => {
    if (!listToDelete) return;

    try {
      await onListDelete(listToDelete);
      setShowDeleteConfirm(false);
      setListToDelete(null);
    } catch (error) {
      console.error('Failed to delete list:', error);
    }
  }, [listToDelete, onListDelete]);

  return (
    <div className="space-y-4">
      {/* Current List Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center">
              <List size={16} className="text-primary-400" />
            </div>
            <div>
              <CardTitle className="text-sm">Current List</CardTitle>
              <CardDescription>Select and manage your watchlists</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {lists.length > 0 ? (
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground-muted">Select List</label>
              <select
                value={currentList?.id || ''}
                onChange={(e) => {
                  const list = lists.find(l => l.id === e.target.value);
                  if (list) onListSelect(list);
                }}
                className="flex h-10 w-full rounded-lg border border-border/60 bg-background-muted/50 px-3 py-2 text-sm transition-all duration-200 hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:border-primary-500/50"
              >
                <option value="">Choose a list...</option>
                {lists.map(list => (
                  <option key={list.id} value={list.id}>
                    {list.name} ({list.symbols.length} symbols)
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="empty-state py-4">
              <div className="empty-state-icon">
                <FilePlus size={28} className="mx-auto text-foreground-muted" strokeWidth={1.5} />
              </div>
              <p className="text-xs text-foreground-muted">No lists created yet</p>
            </div>
          )}

          {/* Current List Actions */}
          {currentList && (
            <div className="bg-background-muted/50 p-3 rounded-lg border border-border/30 space-y-3">
              {isRenaming ? (
                <div className="space-y-3">
                  <Input
                    ref={renameInputRef}
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    onKeyDown={handleRenameKeyDown}
                    placeholder="Enter new list name..."
                    maxLength={50}
                    className="bg-background"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleRenameList} size="sm" className="flex-1">
                      Save
                    </Button>
                    <Button onClick={cancelRenaming} variant="outline" size="sm" className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: currentList.color || '#2962FF' }}
                      ></div>
                      <h3 className="font-medium text-foreground text-sm">{currentList.name}</h3>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {currentList.symbols.length} symbol{currentList.symbols.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-foreground-muted">
                    Created {new Date(currentList.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={startRenaming} variant="outline" size="sm" className="flex-1 text-xs">
                      <PenLine size={12} />
                      Rename
                    </Button>
                    <Button
                      onClick={() => confirmDelete(currentList.id)}
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs hover:bg-error/15 hover:text-error hover:border-error/30"
                    >
                      <Trash2 size={12} />
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create New List */}
      <Card className="bg-background-card/50">
        <CardContent className="p-4">
          {isCreating ? (
            <div className="space-y-3">
              <label className="text-xs font-medium text-foreground">New List Name</label>
              <Input
                ref={createInputRef}
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={handleCreateKeyDown}
                placeholder="Enter list name..."
                maxLength={50}
              />
              <div className="flex gap-2">
                <Button onClick={handleCreateList} className="flex-1" size="sm">
                  Create List
                </Button>
                <Button onClick={cancelCreating} variant="outline" size="sm" className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={startCreating} variant="outline" className="w-full" size="default">
              <Plus size={14} />
              Create New List
            </Button>
          )}
        </CardContent>
      </Card>

      {/* All Lists Overview */}
      {lists.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs text-foreground-muted flex items-center gap-2">
              <LayoutGrid size={14} />
              All Lists ({lists.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 gap-1.5">
              {lists.map(list => (
                <div
                  key={list.id}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all duration-150 hover:bg-background-muted/50 ${currentList?.id === list.id
                    ? 'border-primary-500/50 bg-primary-500/10'
                    : 'border-border/30 hover:border-border/60'
                    }`}
                  onClick={() => onListSelect(list)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0 flex-1">

                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm text-foreground truncate">
                          {list.name}
                        </div>
                        <div className="text-[10px] text-foreground-muted">
                          Updated {new Date(list.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Badge variant="count" className="ml-2">
                      {list.symbols.length}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in" style={{ backdropFilter: 'blur(4px)' }}>
          <Card className="w-80 mx-4 animate-slide-in shadow-popup">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-error flex items-center gap-2">
                <AlertCircle size={18} />
                Delete List
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm">
                <p className="text-foreground-muted mb-2">Are you sure you want to delete this list?</p>
                <div className="font-medium text-foreground bg-background-muted p-2.5 rounded-lg border border-border/30">
                  {lists.find(l => l.id === listToDelete)?.name}
                </div>
              </div>
              <div className="text-xs text-warning bg-warning/10 p-2.5 rounded-lg border border-warning/25 flex items-center gap-2">
                <AlertTriangle size={14} />
                This action cannot be undone
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  onClick={handleDeleteList}
                  variant="destructive"
                  className="flex-1"
                  size="sm"
                >
                  Delete
                </Button>
                <Button
                  onClick={cancelDelete}
                  variant="outline"
                  className="flex-1"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};