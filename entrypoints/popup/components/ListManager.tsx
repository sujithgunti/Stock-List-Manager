import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ListManagerProps, SymbolList } from '../types/index.js';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

export const ListManager: React.FC<ListManagerProps> = ({
  lists,
  currentList,
  onListSelect,
  onListCreate,
  onListRename,
  onListDelete
}) => {
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
          <CardTitle className="text-base">📋 Current List</CardTitle>
          <CardDescription>Select and manage your symbol lists</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {lists.length > 0 ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Select List:</label>
              <select
                value={currentList?.id || ''}
                onChange={(e) => {
                  const list = lists.find(l => l.id === e.target.value);
                  if (list) onListSelect(list);
                }}
                className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-foreground-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
            <div className="text-center py-4">
              <div className="text-2xl mb-2">📝</div>
              <p className="text-sm text-foreground-muted">No lists created yet</p>
            </div>
          )}

          {/* Current List Actions */}
          {currentList && (
            <div className="bg-background-muted p-3 rounded-md space-y-3">
              {isRenaming ? (
                <div className="space-y-2">
                  <Input
                    ref={renameInputRef}
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    onKeyDown={handleRenameKeyDown}
                    placeholder="Enter new list name..."
                    maxLength={50}
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleRenameList} size="sm" className="flex-1">
                      ✓ Save
                    </Button>
                    <Button onClick={cancelRenaming} variant="outline" size="sm" className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">{currentList.name}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {currentList.symbols.length} symbol{currentList.symbols.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <div className="text-xs text-foreground-muted">
                    Created: {new Date(currentList.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button onClick={startRenaming} variant="outline" size="sm" className="flex-1">
                      ✏️ Rename
                    </Button>
                    <Button
                      onClick={() => confirmDelete(currentList.id)}
                      variant="outline"
                      size="sm"
                      className="flex-1 hover:bg-error/20 hover:text-error hover:border-error/30"
                    >
                      🗑️ Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create New List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">➕ Create New List</CardTitle>
          <CardDescription>Start a new symbol collection</CardDescription>
        </CardHeader>
        <CardContent>
          {isCreating ? (
            <div className="space-y-3">
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
                <Button onClick={handleCreateList} className="flex-1">
                  ✓ Create List
                </Button>
                <Button onClick={cancelCreating} variant="outline" className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={startCreating} className="w-full" size="lg">
              ➕ Create New List
            </Button>
          )}
        </CardContent>
      </Card>

      {/* All Lists Overview */}
      {lists.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">📋 All Lists ({lists.length})</CardTitle>
            <CardDescription>Quick access to all your symbol lists</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2">
              {lists.map(list => (
                <div
                  key={list.id}
                  className={`p-3 rounded-md border cursor-pointer transition-colors hover:bg-background-muted/50 ${
                    currentList?.id === list.id
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-border hover:border-border-light'
                  }`}
                  onClick={() => onListSelect(list)}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm text-foreground truncate">
                        {list.name}
                      </div>
                      <div className="text-xs text-foreground-muted">
                        Updated: {new Date(list.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs ml-2">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-80 mx-4">
            <CardHeader>
              <CardTitle className="text-lg text-error">🗑️ Delete List</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm">
                <p className="text-foreground mb-2">Are you sure you want to delete this list?</p>
                <div className="font-semibold text-foreground bg-background-muted p-2 rounded">
                  {lists.find(l => l.id === listToDelete)?.name}
                </div>
              </div>
              <div className="text-sm text-warning bg-warning/10 p-2 rounded border border-warning/30">
                ⚠️ This action cannot be undone.
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleDeleteList}
                  className="flex-1 bg-error hover:bg-error/90 text-white"
                >
                  🗑️ Delete
                </Button>
                <Button
                  onClick={cancelDelete}
                  variant="outline"
                  className="flex-1"
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