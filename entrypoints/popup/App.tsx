import React, { useState, useEffect, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { TextInput } from './components/TextInput';
import { SymbolList } from './components/SymbolList';
import { ListManager } from './components/ListManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import {
  StockSymbol,
  SymbolList as SymbolListType,
  ParseResult,
  AppSettings
} from './types/index';
import { storage } from './utils/storage';
import { parseTextInput, removeDuplicateSymbols } from './utils/parser';
import './App.css';

type TabType = 'upload' | 'text' | 'lists';

function App() {
  // State management
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [currentList, setCurrentList] = useState<SymbolListType | null>(null);
  const [allLists, setAllLists] = useState<SymbolListType[]>([]);
  const [textInput, setTextInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [settings, setSettings] = useState<AppSettings | null>(null);

  // Load data on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Auto-dismiss success messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Load settings
      const appSettings = await storage.getSettings();
      setSettings(appSettings);

      // Load all lists
      const lists = await storage.getAllLists();
      setAllLists(lists);

      // Load current list
      const current = await storage.getCurrentList();
      setCurrentList(current);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data';
      setError(message);
      console.error('Load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // File upload handlers
  const handleFileSelect = useCallback((file: File) => {
    setError('');
    setSuccessMessage('');
    console.log('File selected:', file.name);
  }, []);

  const handleParsedSymbols = useCallback(async (result: ParseResult, customListName: string) => {
    if (result.symbols.length === 0) {
      setError('No valid symbols found in the file');
      return;
    }

    try {
      setIsLoading(true);

      // Use the custom list name provided by the FileUpload component
      const newList = await storage.createList(customListName, result.symbols);
      setCurrentList(newList);
      await storage.setCurrentListId(newList.id);

      // Refresh all lists
      const lists = await storage.getAllLists();
      setAllLists(lists);

      // Show success message
      setError(''); // Clear any previous errors
      if (result.errors.length > 0) {
        setSuccessMessage(`Created "${customListName}" with ${result.symbols.length} symbols and ${result.errors.length} errors`);
      } else {
        setSuccessMessage(`Successfully created "${customListName}" with ${result.symbols.length} symbols`);
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create list';
      setError(message);
      console.error('Save error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentList]);

  // Text input handlers
  const handleTextChange = useCallback((value: string) => {
    setTextInput(value);
    setError('');
    setSuccessMessage('');
  }, []);

  const handleTextParsedSymbols = useCallback(async (result: ParseResult, customListName: string) => {
    if (result.symbols.length === 0) {
      setError('No valid symbols found in the text');
      return;
    }

    try {
      setIsLoading(true);

      // Use the custom list name provided by the TextInput component
      const newList = await storage.createList(customListName, result.symbols);
      setCurrentList(newList);
      await storage.setCurrentListId(newList.id);

      // Refresh all lists
      const lists = await storage.getAllLists();
      setAllLists(lists);

      // Show success message
      setError(''); // Clear any previous errors
      if (result.errors.length > 0) {
        setSuccessMessage(`Created "${customListName}" with ${result.symbols.length} symbols and ${result.errors.length} errors`);
      } else {
        setSuccessMessage(`Successfully created "${customListName}" with ${result.symbols.length} symbols`);
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create list';
      setError(message);
      console.error('List creation error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Symbol list handlers
  const handleSymbolClick = useCallback((symbol: StockSymbol) => {
    console.log('Symbol clicked:', symbol.fullSymbol);
  }, []);

  const handleSymbolDelete = useCallback(async (symbol: StockSymbol) => {
    if (!currentList) return;

    try {
      setIsLoading(true);
      const updatedList = await storage.removeSymbolFromList(currentList.id, symbol);
      setCurrentList(updatedList);

      // Refresh all lists
      const lists = await storage.getAllLists();
      setAllLists(lists);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete symbol';
      setError(message);
      console.error('Delete error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentList]);

  // List management handlers
  const handleListSelect = useCallback(async (list: SymbolListType) => {
    try {
      setCurrentList(list);
      await storage.setCurrentListId(list.id);
      setError('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to select list';
      setError(message);
      console.error('Select error:', err);
    }
  }, []);

  const handleListCreate = useCallback(async (name: string) => {
    try {
      setIsLoading(true);
      const newList = await storage.createList(name);
      setCurrentList(newList);
      await storage.setCurrentListId(newList.id);

      // Refresh all lists
      const lists = await storage.getAllLists();
      setAllLists(lists);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create list';
      setError(message);
      console.error('Create error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleListRename = useCallback(async (listId: string, newName: string) => {
    try {
      setIsLoading(true);
      const updatedList = await storage.updateList(listId, { name: newName });

      if (currentList?.id === listId) {
        setCurrentList(updatedList);
      }

      // Refresh all lists
      const lists = await storage.getAllLists();
      setAllLists(lists);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to rename list';
      setError(message);
      console.error('Rename error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentList]);

  const handleListDelete = useCallback(async (listId: string) => {
    try {
      setIsLoading(true);
      await storage.deleteList(listId);

      if (currentList?.id === listId) {
        setCurrentList(null);
      }

      // Refresh all lists
      const lists = await storage.getAllLists();
      setAllLists(lists);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete list';
      setError(message);
      console.error('Delete error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentList]);

  return (
    <div className="w-full h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">TV</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">TradingView Symbol Manager</h1>
            <p className="text-xs text-foreground-muted">Manage your stock symbol lists</p>
          </div>
        </div>
      </div>

      {/* Global Messages */}
      {successMessage && (
        <div className="mx-4 mt-3 p-2 rounded-md text-sm bg-success/20 text-success border border-success/30">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="mx-4 mt-3 p-2 rounded-md text-sm bg-error/20 text-error border border-error/30">
          {error}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="upload" className="h-full flex flex-col">
          <div className="flex-shrink-0 px-4 pt-3">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload" className="text-xs">📊 CSV Upload</TabsTrigger>
              <TabsTrigger value="text" className="text-xs">📝 Text Input</TabsTrigger>
              <TabsTrigger value="lists" className="text-xs">📋 Lists</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="upload" className="h-full p-0 m-0">
              <div className="h-full overflow-y-auto p-4 pt-3">
                <FileUpload
                  onFileSelect={handleFileSelect}
                  onParsedSymbols={handleParsedSymbols}
                  isLoading={isLoading}
                  error={error}
                />
              </div>
            </TabsContent>

            <TabsContent value="text" className="h-full p-0 m-0">
              <div className="h-full overflow-y-auto p-4 pt-3">
                <TextInput
                  value={textInput}
                  onChange={handleTextChange}
                  onParsedSymbols={handleTextParsedSymbols}
                  isLoading={isLoading}
                  error={error}
                />
              </div>
            </TabsContent>

            <TabsContent value="lists" className="h-full p-0 m-0">
              <div className="h-full overflow-y-auto p-4 pt-3">
                <div className="space-y-4">
                  <ListManager
                    lists={allLists}
                    currentList={currentList}
                    onListSelect={handleListSelect}
                    onListCreate={handleListCreate}
                    onListRename={handleListRename}
                    onListDelete={handleListDelete}
                  />

                  {/* Show symbols when a list is selected */}
                  {currentList && currentList.symbols.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">📊 {currentList.name} Symbols</CardTitle>
                        <CardDescription>
                          {currentList.symbols.length} symbols • Click any symbol to open on TradingView
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <SymbolList
                          symbols={currentList.symbols}
                          onSymbolClick={handleSymbolClick}
                          onSymbolDelete={handleSymbolDelete}
                          isLoading={isLoading}
                        />
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Current List Display - Fixed at bottom */}
        {currentList && (
          <div className="border-t border-border bg-background-muted">
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-foreground">{currentList.name}</h3>
                <span className="text-xs text-foreground-muted">
                  {currentList.symbols.length} symbols
                </span>
              </div>
              <div className="max-h-40 overflow-y-auto">
                <SymbolList
                  symbols={currentList.symbols}
                  onSymbolClick={handleSymbolClick}
                  onSymbolDelete={handleSymbolDelete}
                  isLoading={isLoading}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-4 py-2 border-t border-border bg-background-muted">
        <p className="text-xs text-foreground-muted text-center">
          Click any symbol to open on TradingView India
        </p>
      </div>
    </div>
  );
}

export default App;
