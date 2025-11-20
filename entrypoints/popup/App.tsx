import React, { useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { TextInput } from './components/TextInput';
import { WebsiteExtractor } from './components/WebsiteExtractor';
import { SymbolList } from './components/SymbolList';
import { ListManager } from './components/ListManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import {
  StockSymbol,
  ParseResult
} from './types/index';
import {
  useSymbolListManager,
  useActiveTab,
  useTextInput,
  useSuccessMessage,
  useMigrateToEnhancedSchema,
  useSymbolOccurrences,
  useCopySymbol,
  useEnhancedListManager
} from './atoms/hooks';
import './App.css';

function App() {
  // Jotai state management
  const [activeTab, setActiveTab] = useActiveTab();
  const [textInput, setTextInput] = useTextInput();
  const { successMessage, clearSuccess} = useSuccessMessage();
  const migrateSchema = useMigrateToEnhancedSchema();

  const {
    symbolLists,
    currentList,
    isLoading,
    error,
    setCurrentListId,
    createList,
    updateList,
    deleteList,
    removeSymbol,
    handleParsedSymbols,
    clearError
  } = useSymbolListManager();

  // Phase 7: Enhanced list management for multi-list support
  const symbolOccurrences = useSymbolOccurrences();
  const copySymbol = useCopySymbol();

  // Wrapper functions for SymbolList component
  const handleCopySymbol = async (symbol: StockSymbol, toListId: string) => {
    await copySymbol({ symbol, toListId });
  };

  const handleRemoveFromList = async (listId: string, symbol: StockSymbol) => {
    await removeSymbol({ listId, symbolToRemove: symbol });
  };

  // Phase 7: Migrate to enhanced schema on app load
  useEffect(() => {
    const runMigration = async () => {
      try {
        const result = await migrateSchema();
        if (result.migrated) {
          console.log('✅ Data migrated to enhanced schema with color lists');
        } else if (result.initialized) {
          console.log('✅ Initialized predefined colored lists');
        }
      } catch (error) {
        console.error('❌ Migration error:', error);
      }
    };

    runMigration();
  }, [migrateSchema]);

  // Auto-dismiss success messages (handled automatically by Jotai atoms)
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        clearSuccess();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, clearSuccess]);

  // Event handlers - simplified with Jotai
  const handleFileSelect = (file: File) => {
    clearError();
    clearSuccess();
    console.log('File selected:', file.name);
  };

  const handleTextChange = (value: string) => {
    setTextInput(value);
    clearError();
    clearSuccess();
  };

  const handleSymbolClick = (symbol: StockSymbol) => {
    console.log('Symbol clicked:', symbol.fullSymbol);
  };

  const handleSymbolDelete = async (symbol: StockSymbol) => {
    if (!currentList) return;
    await removeSymbol({ listId: currentList.id, symbolToRemove: symbol });
  };

  const handleListSelect = (list: any) => {
    setCurrentListId(list.id);
    clearError();
  };

  const handleListCreate = async (name: string) => {
    await createList({ name });
  };

  const handleListRename = async (listId: string, newName: string) => {
    await updateList({ listId, updates: { name: newName } });
  };

  const handleListDelete = async (listId: string) => {
    await deleteList(listId);
  };

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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="upload" className="text-xs">📊 CSV</TabsTrigger>
              <TabsTrigger value="text" className="text-xs">📝 Text</TabsTrigger>
              <TabsTrigger value="website" className="text-xs">🌐 Web</TabsTrigger>
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
                  onParsedSymbols={handleParsedSymbols}
                  isLoading={isLoading}
                  error={error}
                />
              </div>
            </TabsContent>

            <TabsContent value="website" className="h-full p-0 m-0">
              <div className="h-full overflow-y-auto p-4 pt-3">
                <WebsiteExtractor
                  onParsedSymbols={handleParsedSymbols}
                  isLoading={isLoading}
                  error={error}
                  lists={symbolLists}
                  currentList={currentList}
                />
              </div>
            </TabsContent>

            <TabsContent value="lists" className="h-full p-0 m-0">
              <div className="h-full overflow-y-auto p-4 pt-3">
                <div className="space-y-4">
                  <ListManager
                    lists={symbolLists}
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
                          currentListId={currentList.id}
                          allLists={symbolLists}
                          symbolOccurrences={symbolOccurrences}
                          onCopySymbol={handleCopySymbol}
                          onRemoveSymbol={handleRemoveFromList}
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
                  currentListId={currentList.id}
                  allLists={symbolLists}
                  symbolOccurrences={symbolOccurrences}
                  onCopySymbol={handleCopySymbol}
                  onRemoveSymbol={handleRemoveFromList}
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
