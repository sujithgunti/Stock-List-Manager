import React, { useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { TextInput } from './components/TextInput';
import { WebsiteExtractor } from './components/WebsiteExtractor';
import { SymbolList } from './components/SymbolList';
import { ListManager } from './components/ListManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import {
  TrendingUp,
  CheckCircle2,
  XCircle,
  FileText,
  PenLine,
  Globe,
  List,
  ExternalLink
} from 'lucide-react';
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
  const { successMessage, clearSuccess } = useSuccessMessage();
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
      <div className="flex-shrink-0 px-4 py-3 border-b border-border/50 bg-gradient-to-r from-background to-background-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 header-gradient rounded-xl flex items-center justify-center shadow-lg p-2">
            <img src="/icon/48.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-foreground tracking-tight">TradeFlow</h1>
            <p className="text-xs text-foreground-muted">Import and manage your watchlists</p>
          </div>
          {currentList && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-500/10 border border-primary-500/20">
              <div className="w-2 h-2 rounded-full bg-primary-500"></div>
              <span className="text-xs font-medium text-primary-400">{currentList.symbols.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* Global Messages */}
      {successMessage && (
        <div className="mx-4 mt-3 alert-success flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{successMessage}</span>
        </div>
      )}
      {error && (
        <div className="mx-4 mt-3 alert-error flex items-center gap-2">
          <XCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="upload" className="h-full flex flex-col">
          <div className="flex-shrink-0 px-4 pt-3">
            <TabsList className="grid w-full grid-cols-4 h-10 p-1 bg-background-muted rounded-lg">
              <TabsTrigger value="upload" className="text-xs gap-1.5 data-[state=active]:shadow-md">
                <FileText size={14} />
                CSV
              </TabsTrigger>
              <TabsTrigger value="text" className="text-xs gap-1.5 data-[state=active]:shadow-md">
                <PenLine size={14} />
                Text
              </TabsTrigger>
              <TabsTrigger value="website" className="text-xs gap-1.5 data-[state=active]:shadow-md">
                <Globe size={14} />
                Web
              </TabsTrigger>
              <TabsTrigger value="lists" className="text-xs gap-1.5 data-[state=active]:shadow-md">
                <List size={14} />
                Lists
              </TabsTrigger>
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
        {currentList && currentList.symbols.length > 0 && (
          <div className="border-t border-border/50 bg-background-card/50">
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: currentList.color || '#2962FF' }}
                  ></div>
                  <h3 className="text-sm font-medium text-foreground">{currentList.name}</h3>
                </div>
                <span className="text-xs text-foreground-muted px-2 py-0.5 rounded-full bg-background-muted">
                  {currentList.symbols.length} symbols
                </span>
              </div>
              <div className="max-h-32 overflow-y-auto rounded-lg bg-background-muted/50 p-1">
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
      <div className="flex-shrink-0 px-4 py-2.5 border-t border-border/30 bg-background-muted/50">
        <div className="flex items-center justify-center gap-2 text-xs text-foreground-muted">
          <ExternalLink size={12} />
          <span>Click any symbol to open on TradingView</span>
        </div>
      </div>
    </div>
  );
}

export default App;
