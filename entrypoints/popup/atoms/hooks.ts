import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import {
  symbolListsAtom,
  currentListIdAtom,
  currentListAtom,
  settingsAtom,
  isLoadingAtom,
  errorAtom,
  successMessageAtom,
  activeTabAtom,
  textInputAtom,
  allListsCountAtom,
  currentListSymbolCountAtom,
  createListAtom,
  updateListAtom,
  deleteListAtom,
  removeSymbolFromListAtom,
  handleParsedSymbolsAtom,
  autoDisimissSuccessAtom,
  favoriteListsAtom,
  predefinedListsAtom,
  customListsAtom,
  symbolOccurrencesAtom,
  toggleListFavoriteAtom,
  moveSymbolAtom,
  copySymbolAtom,
  initializePredefinedListsAtom,
  migrateToEnhancedSchemaAtom,
  authUserAtom,
  authLoadingAtom,
  authErrorAtom,
  signInWithGoogleAtom,
  signOutAtom
} from './index'
import { SymbolList, StockSymbol, AppSettings, ParseResult, ListReference, AuthUser } from '../types/index'
import React from 'react'
import { getFirebaseAuth } from '../lib/firebase'
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth'

// Symbol Lists Management
export const useSymbolLists = () => {
  return useAtom(symbolListsAtom)
}

export const useCurrentList = () => {
  const currentList = useAtomValue(currentListAtom)
  const setCurrentListId = useSetAtom(currentListIdAtom)

  return {
    currentList,
    setCurrentListId
  }
}

export const useSettings = () => {
  return useAtom(settingsAtom)
}

// UI State Management
export const useLoading = () => {
  return useAtom(isLoadingAtom)
}

export const useError = () => {
  const [error, setError] = useAtom(errorAtom)

  const clearError = () => setError('')

  return {
    error,
    setError,
    clearError
  }
}

export const useSuccessMessage = () => {
  const [successMessage, setSuccessMessage] = useAtom(successMessageAtom)
  const autoDisimiss = useSetAtom(autoDisimissSuccessAtom)

  const showSuccess = (message: string) => {
    setSuccessMessage(message)
    autoDisimiss()
  }

  const clearSuccess = () => setSuccessMessage('')

  return {
    successMessage,
    showSuccess,
    clearSuccess
  }
}

export const useActiveTab = () => {
  return useAtom(activeTabAtom)
}

export const useTextInput = () => {
  return useAtom(textInputAtom)
}

// Authentication
export const useAuth = () => {
  const [user, setUser] = useAtom(authUserAtom)
  const [loading, setLoading] = useAtom(authLoadingAtom)
  const [error, setError] = useAtom(authErrorAtom)
  const signIn = useSetAtom(signInWithGoogleAtom)
  const signOut = useSetAtom(signOutAtom)
  const [authStatusBound, setAuthStatusBound] = React.useState(false)

  // Listen for auth results from sandbox window via postMessage
  React.useEffect(() => {
    if (authStatusBound) return
    const handler = async (event: MessageEvent) => {
      const msg: any = event.data
      if (msg?.type === 'AUTH_SUCCESS') {
        // 1. Authenticate the local Firebase SDK (Critical for Firestore Rules)
        try {
          const auth = getFirebaseAuth();
          // Use Google ID Token (not Firebase Token) for credential
          const credential = GoogleAuthProvider.credential(msg.googleIdToken);
          await signInWithCredential(auth, credential);
          console.log("✅ Firebase SDK Signed In (Popup Context)");
        } catch (e) {
          console.error("❌ Failed to sign in Firebase SDK:", e);
        }

        setUser({
          uid: msg.user.uid,
          displayName: msg.user.displayName,
          email: msg.user.email,
          photoURL: msg.user.photoURL,
          idToken: msg.idToken,
          googleIdToken: msg.googleIdToken, // Save for future re-auth
        })
        setError('')
      } else if (msg?.type === 'AUTH_ERROR') {
        setError(msg.error || 'Auth failed')
      } else if (msg?.type === 'AUTH_SIGNED_OUT') {
        setUser(null)
        setError('')
      }
    }
    window.addEventListener('message', handler)
    setAuthStatusBound(true)
    return () => {
      window.removeEventListener('message', handler)
    }
  }, [authStatusBound, setUser, setError])

  const clearError = () => setError('')
  const setAuthUser = (value: AuthUser | null) => setUser(value)
  const setAuthLoading = (value: boolean) => setLoading(value)

  return {
    user,
    loading,
    error,
    signIn,
    signOut,
    clearError,
    setAuthUser,
    setAuthLoading,
  }
}

// Statistics
export const useListsCount = () => {
  return useAtomValue(allListsCountAtom)
}

export const useCurrentListSymbolCount = () => {
  return useAtomValue(currentListSymbolCountAtom)
}

// Actions
export const useListActions = () => {
  const createList = useSetAtom(createListAtom)
  const updateList = useSetAtom(updateListAtom)
  const deleteList = useSetAtom(deleteListAtom)
  const removeSymbol = useSetAtom(removeSymbolFromListAtom)

  return {
    createList: (data: { name: string; symbols?: StockSymbol[] }) => createList(data),
    updateList: (data: { listId: string; updates: Partial<Omit<SymbolList, 'id' | 'createdAt'>> }) => updateList(data),
    deleteList: (listId: string) => deleteList(listId),
    removeSymbol: (data: { listId: string; symbolToRemove: StockSymbol }) => removeSymbol(data)
  }
}

export const useHandleParsedSymbols = () => {
  const handleParsedSymbols = useSetAtom(handleParsedSymbolsAtom)

  return (result: ParseResult, customListName: string) =>
    handleParsedSymbols({ result, customListName })
}

// Combined hook for complete symbol list management
export const useSymbolListManager = () => {
  const [symbolLists] = useSymbolLists()
  const { currentList, setCurrentListId } = useCurrentList()
  const [isLoading] = useLoading()
  const { error, clearError } = useError()
  const { successMessage, showSuccess, clearSuccess } = useSuccessMessage()
  const actions = useListActions()
  const handleParsedSymbols = useHandleParsedSymbols()

  return {
    // State
    symbolLists,
    currentList,
    isLoading,
    error,
    successMessage,

    // Actions
    setCurrentListId,
    createList: actions.createList,
    updateList: actions.updateList,
    deleteList: actions.deleteList,
    removeSymbol: actions.removeSymbol,
    handleParsedSymbols,

    // Helpers
    clearError,
    showSuccess,
    clearSuccess
  }
}

// ============================================================================
// Phase 7: Color-Based Lists & Multi-List Enhancement Hooks
// ============================================================================

// List Categorization Hooks
export const useFavoriteLists = () => {
  return useAtomValue(favoriteListsAtom)
}

export const usePredefinedLists = () => {
  return useAtomValue(predefinedListsAtom)
}

export const useCustomLists = () => {
  return useAtomValue(customListsAtom)
}

// Cross-list Symbol Tracking
export const useSymbolOccurrences = () => {
  return useAtomValue(symbolOccurrencesAtom)
}

// List Actions
export const useToggleListFavorite = () => {
  return useSetAtom(toggleListFavoriteAtom)
}

export const useMoveSymbol = () => {
  return useSetAtom(moveSymbolAtom)
}

export const useCopySymbol = () => {
  return useSetAtom(copySymbolAtom)
}

// Combined hook for enhanced list management
export const useEnhancedListManager = () => {
  const favoriteLists = useFavoriteLists()
  const predefinedLists = usePredefinedLists()
  const customLists = useCustomLists()
  const symbolOccurrences = useSymbolOccurrences()
  const toggleFavorite = useToggleListFavorite()
  const moveSymbol = useMoveSymbol()
  const copySymbol = useCopySymbol()

  return {
    // Categorized lists
    favoriteLists,
    predefinedLists,
    customLists,

    // Cross-list tracking
    symbolOccurrences,

    // Actions
    toggleFavorite,
    moveSymbol: (symbol: StockSymbol, fromListId: string, toListId: string) =>
      moveSymbol({ symbol, fromListId, toListId }),
    copySymbol: (symbol: StockSymbol, toListId: string) =>
      copySymbol({ symbol, toListId })
  }
}

// Initialization & Migration Hooks
export const useInitializePredefinedLists = () => {
  return useSetAtom(initializePredefinedListsAtom)
}

export const useMigrateToEnhancedSchema = () => {
  return useSetAtom(migrateToEnhancedSchemaAtom)
}

export { useUserProfileSync, useDataSync } from './sync';