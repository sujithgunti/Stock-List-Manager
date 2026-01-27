import React, { useEffect } from 'react';
import { getFirebaseAuth } from './lib/firebase';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { FileUpload } from './components/FileUpload';
import { TextInput } from './components/TextInput';
import { WebsiteExtractor } from './components/WebsiteExtractor';
import { SymbolList } from './components/SymbolList';
import { ListManager } from './components/ListManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { LoginScreen } from './components/LoginScreen';
import { TrialExpiredScreen } from './components/TrialExpiredScreen';
import { PricingOverlay } from './components/PricingOverlay';
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
  useEnhancedListManager,
  useAuth,
  useUserProfileSync,
  useDataSync
} from './atoms/hooks';
import { Loader2, Crown } from 'lucide-react';
import './App.css';

import { useStorageSync } from './atoms/useStorageSync';

function App() {
  // Manual Storage Sync
  const isHydrated = useStorageSync();

  // Jotai state management
  const [activeTab, setActiveTab] = useActiveTab();
  const [textInput, setTextInput] = useTextInput();
  const { successMessage, clearSuccess } = useSuccessMessage();
  const migrateSchema = useMigrateToEnhancedSchema();

  // Phase 8: Firebase Sync (Freemium Split)
  useUserProfileSync();
  useDataSync();



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

  // Debug Logging
  useEffect(() => {
    console.log('App Debug: symbolLists count:', symbolLists?.length);
    console.log('App Debug: currentListId:', currentList?.id);
    console.log('App Debug: currentList:', currentList);
    if (currentList) {
      console.log('App Debug: currentList symbols:', currentList.symbols?.length);
      console.log('App Debug: currentList first symbol:', currentList.symbols?.[0]);
    }
  }, [symbolLists, currentList]);

  // Phase 7: Enhanced list management for multi-list support
  const symbolOccurrences = useSymbolOccurrences();
  const copySymbol = useCopySymbol();
  const {
    user: authUser,
    loading: authLoading,
    error: authError,
    signIn,
    signOut,
    clearError: clearAuthError,
    setAuthUser
  } = useAuth();

  const [showPricing, setShowPricing] = React.useState(false);

  // Freemium Trial Logic
  const [isTrialExpired, setIsTrialExpired] = React.useState(false);
  const [checkingTrial, setCheckingTrial] = React.useState(true);

  useEffect(() => {
    const checkTrialStatus = async () => {
      try {
        const result = await chrome.storage.local.get('installDate');
        let installTimestamp = result.installDate;

        if (!installTimestamp) {
          // First run: save install date
          installTimestamp = Date.now();
          await chrome.storage.local.set({ installDate: installTimestamp });
        }

        // Calculate days used
        const msPerDay = 1000 * 60 * 60 * 24;
        const daysUsed = (Date.now() - installTimestamp) / msPerDay;

        // If > 30 days and NOT premium, expire
        if (daysUsed > 30) {
          setIsTrialExpired(true);
        }
      } catch (e) {
        console.error('Trial check failed:', e);
      } finally {
        setCheckingTrial(false);
      }
    };
    checkTrialStatus();
  }, []);

  // Effect to Un-expire if user becomes Premium (via sync)
  useEffect(() => {
    if (authUser?.isPremium) {
      setIsTrialExpired(false);
    }
  }, [authUser?.isPremium]);

  // Manual hydration check to ensure auth state is synced
  useEffect(() => {
    const checkStorage = async () => {
      try {
        const result = await chrome.storage.local.get('authUser');
        console.log('🔍 Manual Storage Check:', result);

        if (result.authUser) {
          let finalUser = result.authUser;
          // If Jotai saved it, it might be a JSON string. Parse it.
          if (typeof finalUser === 'string') {
            try {
              finalUser = JSON.parse(finalUser);
            } catch (e) {
              console.error('Failed to parse authUser string:', e);
            }
          }

          // Only set if we have a valid object and current state is empty
          if (finalUser && typeof finalUser === 'object' && !authUser) {
            console.log('⚡ Force-setting auth user from storage (parsed)');
            setAuthUser(finalUser);
          }
        }
      } catch (e) {
        console.error('Storage check failed:', e);
      }
    };
    checkStorage();
  }, []);

  // Re-authenticate Firebase SDK if we have a stored user
  useEffect(() => {
    const reAuth = async () => {
      // Debug logs
      console.log("🔍 Re-Auth Check:", {
        hasToken: !!authUser?.idToken,
        currentUser: !!getFirebaseAuth().currentUser
      });

      if (authUser?.googleIdToken) {
        const auth = getFirebaseAuth();
        if (!auth.currentUser) {
          try {
            await signInWithCredential(auth, GoogleAuthProvider.credential(authUser.googleIdToken));
          } catch (e) {
            console.warn("⚠️ SDK Re-auth failed:", e);
          }
        }
      }
    };
    reAuth();
  }, [authUser]); // Run whenever authUser is set

  // Wrapper functions for SymbolList component
  const handleCopySymbol = async (symbol: StockSymbol, toListId: string) => {
    await copySymbol({ symbol, toListId });
  };

  const handleRemoveFromList = async (listId: string, symbol: StockSymbol) => {
    await removeSymbol({ listId, symbolToRemove: symbol });
  };

  // Phase 7: Migrate to enhanced schema on app load
  useEffect(() => {
    if (!isHydrated) return;

    const runMigration = async () => {
      try {
        const result = await migrateSchema();
        if (result.migrated) {
          // Migration success
        } else if (result.initialized) {
          // Initialization success
        }
      } catch (error) {
        console.error('❌ Migration error:', error);
      }
    };

    runMigration();
  }, [migrateSchema, isHydrated]);

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
    console.log('App: handleListSelect called for:', list.id, list.name);
    try {
      setCurrentListId(list.id);
      console.log('App: setCurrentListId called with', list.id);
    } catch (e) {
      console.error('App: Error setting list ID', e);
    }
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

  const handleSignIn = async () => {
    clearAuthError();
    await signIn();
  };

  const handleSignOut = async () => {
    clearAuthError();
    await signOut();
  };

  // If not authenticated, show Login Screen
  if (!authUser) {
    return (
      <LoginScreen
        onSignIn={handleSignIn}
        isLoading={authLoading}
        error={authError}
      />
    );
  }

  // Freemium Blocking: If logged in but Trial Expired and NOT Premium
  if (!authLoading && !checkingTrial && isTrialExpired && !authUser?.isPremium) {
    return <TrialExpiredScreen />;
  }

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
          <div className="flex items-center gap-2">
            {/* User is guaranteed to be logged in here now */}
            {authUser.photoURL && (
              <img
                src={authUser.photoURL}
                alt={authUser.displayName || 'User'}
                className="w-7 h-7 rounded-full border border-border/50"
              />
            )}
            <div className="flex flex-col leading-tight">
              <span className="text-xs text-foreground">{authUser.displayName || 'User'}</span>

              {!authUser.isPremium && (
                <button
                  className="text-[10px] bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-full font-medium shadow-sm hover:shadow-md transition-all flex items-center gap-1 mb-0.5 w-fit"
                  onClick={() => setShowPricing(true)}
                >
                  <Crown size={10} />
                  Upgrade
                </button>
              )}

              <button
                className="text-[11px] text-primary-400 hover:text-primary-300 transition-colors text-right"
                onClick={handleSignOut}
                disabled={authLoading}
              >
                {authLoading ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          </div>
          {/* {currentList && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-500/10 border border-primary-500/20">

              <span className="text-xs font-medium text-primary-400">{currentList.symbols.length}</span>
            </div>
          )} */}
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
      {authError && (
        <div className="mx-4 mt-3 alert-error flex items-center gap-2">
          <XCircle size={16} />
          <span>{authError}</span>
        </div>
      )}

      {/* PRICING OVERLAY */}
      {showPricing && (
        <PricingOverlay onClose={() => setShowPricing(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="h-full flex flex-col">
          <div className="flex-shrink-0 px-4 pt-3">
            <TabsList className="grid w-full grid-cols-4 h-10 p-1 bg-background-muted rounded-lg">
              <TabsTrigger value="website" className="text-xs gap-1.5 data-[state=active]:shadow-md">
                <Globe size={14} />
                Web
              </TabsTrigger>
              <TabsTrigger value="lists" className="text-xs gap-1.5 data-[state=active]:shadow-md">
                <List size={14} />
                Lists
              </TabsTrigger>
              <TabsTrigger value="upload" className="text-xs gap-1.5 data-[state=active]:shadow-md">
                <FileText size={14} />
                CSV
              </TabsTrigger>
              <TabsTrigger value="text" className="text-xs gap-1.5 data-[state=active]:shadow-md">
                <PenLine size={14} />
                Text
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
                  {currentList && (
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
          <div className="border-t border-border/50 bg-background-card/50">
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">

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
          <span>Made with ❤️ by TradeFlow</span>
        </div>
      </div>
    </div>
  );
}

export default App;
