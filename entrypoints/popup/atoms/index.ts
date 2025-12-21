import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import {
  SymbolList,
  StockSymbol,
  AppSettings,
  DEFAULT_SETTINGS,
  ParseResult,
  ListReference,
  AVAILABLE_COLORS,
  PREDEFINED_LISTS,
  AuthUser
} from '../types/index'
import { chromeExtensionStorage } from './storage'
import { getFirebaseAuth } from '../lib/firebase'
import { getIdToken } from 'firebase/auth'
import { saveListToFirestore, deleteListFromFirestore } from '../lib/firestore-utils'

// Helper function to generate unique IDs
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2)

// Storage atoms with Chrome Extension Storage API integration
export const symbolListsAtom = atomWithStorage<SymbolList[]>('symbolLists', [], chromeExtensionStorage)

export const currentListIdAtom = atomWithStorage<string | null>('currentListId', null, chromeExtensionStorage)

export const settingsAtom = atomWithStorage<AppSettings>('settings', DEFAULT_SETTINGS, chromeExtensionStorage)

// UI State atoms
export const isLoadingAtom = atom<boolean>(false)

export const errorAtom = atom<string>('')

export const successMessageAtom = atom<string>('')

export const activeTabAtom = atom<'upload' | 'text' | 'lists'>('upload')

export const textInputAtom = atom<string>('')

// Auth atoms
export const authUserAtom = atomWithStorage<AuthUser | null>('authUser', null, chromeExtensionStorage)
export const authLoadingAtom = atom<boolean>(false)
export const authErrorAtom = atom<string>('')

// Derived atoms
// Note: keep derived atoms synchronous to satisfy TypeScript typing (avoid async getters).
export const currentListAtom = atom<SymbolList | null>((get) => {
  const currentListId = get(currentListIdAtom)
  const allLists = get(symbolListsAtom)
  const actualLists = Array.isArray(allLists) ? allLists : []
  return currentListId ? actualLists.find((list: SymbolList) => list.id === currentListId) || null : null
})

export const allListsCountAtom = atom((get) => {
  const allLists = get(symbolListsAtom)
  const actualLists = Array.isArray(allLists) ? allLists : []
  return actualLists.length
})

export const currentListSymbolCountAtom = atom((get) => {
  const currentList = get(currentListAtom)
  return currentList ? currentList.symbols.length : 0
})

// Action atoms for complex operations
export const createListAtom = atom(
  null,
  async (get, set, {
    name,
    symbols = [],
    color,
    isPredefined = false,
    isFavoriteList = false
  }: {
    name: string;
    symbols?: StockSymbol[];
    color?: string;
    isPredefined?: boolean;
    isFavoriteList?: boolean;
  }) => {
    try {
      set(isLoadingAtom, true)
      set(errorAtom, '')

      const id = generateId()
      const now = new Date()

      // Ensure all symbols have addedAt timestamp
      const symbolsWithTimestamp = symbols.map(symbol => ({
        ...symbol,
        addedAt: symbol.addedAt || now,
        notes: symbol.notes || ''
      }))

      const newList: SymbolList = {
        id,
        name: name.trim(),
        color: color || AVAILABLE_COLORS[0].hex, // Default to first color (red)
        isPredefined,
        isFavoriteList,
        symbols: symbolsWithTimestamp,
        createdAt: now,
        updatedAt: now
      }

      const currentLists = await get(symbolListsAtom)
      const actualLists = Array.isArray(currentLists) ? currentLists : []
      const updatedLists = [...actualLists, newList]

      set(symbolListsAtom, updatedLists)
      set(currentListIdAtom, newList.id)

      // Sync to Cloud
      const authUser = await get(authUserAtom)
      if (authUser?.uid) {
        saveListToFirestore(authUser.uid, newList).catch(console.error)
      }

      return newList
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create list'
      set(errorAtom, message)
      throw error
    } finally {
      set(isLoadingAtom, false)
    }
  }
)

export const updateListAtom = atom(
  null,
  async (get, set, { listId, updates }: { listId: string; updates: Partial<Omit<SymbolList, 'id' | 'createdAt'>> }) => {
    try {
      set(isLoadingAtom, true)
      set(errorAtom, '')

      const currentLists = await get(symbolListsAtom)
      const actualLists = Array.isArray(currentLists) ? currentLists : []
      const listIndex = actualLists.findIndex((list: SymbolList) => list.id === listId)

      if (listIndex === -1) {
        throw new Error(`List not found with ID: ${listId}`)
      }

      const updatedList: SymbolList = {
        ...actualLists[listIndex],
        ...updates,
        updatedAt: new Date()
      }

      const updatedLists = [...actualLists]
      updatedLists[listIndex] = updatedList

      set(symbolListsAtom, updatedLists)

      return updatedList
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update list'
      set(errorAtom, message)
      throw error
    } finally {
      set(isLoadingAtom, false)
    }
  }
)

export const deleteListAtom = atom(
  null,
  async (get, set, listId: string) => {
    try {
      set(isLoadingAtom, true)
      set(errorAtom, '')

      const currentLists = await get(symbolListsAtom)
      const actualLists = Array.isArray(currentLists) ? currentLists : []
      const filteredLists = actualLists.filter((list: SymbolList) => list.id !== listId)

      set(symbolListsAtom, filteredLists)

      // Clear current selection if this was the current list
      const currentListId = await get(currentListIdAtom)
      if (currentListId === listId) {
        set(currentListIdAtom, null)
      }

      // Sync to Cloud
      const authUser = await get(authUserAtom)
      if (authUser?.uid) {
        deleteListFromFirestore(authUser.uid, listId).catch(console.error)
      }


      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete list'
      set(errorAtom, message)
      throw error
    } finally {
      set(isLoadingAtom, false)
    }
  }
)

export const removeSymbolFromListAtom = atom(
  null,
  async (get, set, { listId, symbolToRemove }: { listId: string; symbolToRemove: StockSymbol }) => {
    try {
      set(isLoadingAtom, true)
      set(errorAtom, '')

      const currentLists = await get(symbolListsAtom)
      const actualLists = Array.isArray(currentLists) ? currentLists : []
      const listIndex = actualLists.findIndex((list: SymbolList) => list.id === listId)

      if (listIndex === -1) {
        throw new Error(`List not found with ID: ${listId}`)
      }

      const list = actualLists[listIndex]
      const updatedSymbols = list.symbols.filter(
        (symbol: StockSymbol) => symbol.fullSymbol !== symbolToRemove.fullSymbol
      )

      const updatedList: SymbolList = {
        ...list,
        symbols: updatedSymbols,
        updatedAt: new Date()
      }

      const updatedLists = [...actualLists]
      updatedLists[listIndex] = updatedList

      set(symbolListsAtom, updatedLists)

      // Sync to Cloud
      const authUser = await get(authUserAtom)
      if (authUser?.uid) {
        saveListToFirestore(authUser.uid, updatedList).catch(console.error)
      }

      return updatedList
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove symbol'
      set(errorAtom, message)
      throw error
    } finally {
      set(isLoadingAtom, false)
    }
  }
)

export const handleParsedSymbolsAtom = atom(
  null,
  async (get, set, { result, customListName }: { result: ParseResult; customListName: string }) => {
    if (result.symbols.length === 0) {
      set(errorAtom, 'No valid symbols found')
      return
    }

    try {
      const newList = await set(createListAtom, { name: customListName, symbols: result.symbols })

      // Success message is handled locally by components to avoid duplication
      set(errorAtom, '') // Clear any previous errors

      return newList
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create list'
      set(errorAtom, message)
      throw error
    }
  }
)

// Auto-dismiss success messages after 5 seconds
export const autoDisimissSuccessAtom = atom(
  null,
  (get, set) => {
    const successMessage = get(successMessageAtom)
    if (successMessage) {
      setTimeout(() => {
        set(successMessageAtom, '')
      }, 5000)
    }
  }
)

// Authentication actions
export const signInWithGoogleAtom = atom(
  null,
  async (_get, set) => {
    try {
      set(authLoadingAtom, true)
      set(authErrorAtom, '')

      // Send message to background to handle auth
      await (globalThis as any).chrome.runtime.sendMessage({
        type: 'AUTH_START',
        config: {
          apiKey: import.meta.env.WXT_FIREBASE_API_KEY,
          authDomain: import.meta.env.WXT_FIREBASE_AUTH_DOMAIN,
          projectId: import.meta.env.WXT_FIREBASE_PROJECT_ID,
          appId: import.meta.env.WXT_FIREBASE_APP_ID,
          messagingSenderId: import.meta.env.WXT_FIREBASE_MESSAGING_SENDER_ID,
          storageBucket: import.meta.env.WXT_FIREBASE_STORAGE_BUCKET,
        }
      });

      // Note: AUTH_SUCCESS will be handled by a message listener
      // We need to set up that listener if it's not already globally handled.
      // However, usually atoms are just state holders.
      // The listener should be in a useEffect or global handler.
      // But since we are inside an atom action, we rely on the global connection or another mechanism.
      // Wait, 'authUserAtom' is stored in storage.
      // Only 'authErrorAtom' needs update.
      // The background/offscreen will update storage?
      // No, offscreen sends 'AUTH_SUCCESS' back.
      // We need to listen to it.

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign in'
      set(authErrorAtom, message)
      set(authLoadingAtom, false)
    }
  }
)

export const signOutAtom = atom(
  null,
  async (_get, set) => {
    try {
      set(authLoadingAtom, true)
      set(authErrorAtom, '')

      await (globalThis as any).chrome.runtime.sendMessage({ type: 'AUTH_SIGNOUT' });

      set(authUserAtom, null)
      set(successMessageAtom, 'Signed out')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign out'
      set(authErrorAtom, message)
    } finally {
      set(authLoadingAtom, false)
    }
  }
)

// ============================================================================
// Phase 7: Color-Based Lists & Multi-List Enhancement Atoms
// ============================================================================

// Derived atoms for list categorization
export const favoriteListsAtom = atom(
  async (get) => {
    const allLists = await get(symbolListsAtom)
    const actualLists = Array.isArray(allLists) ? allLists : []
    return actualLists.filter((list: SymbolList) => list.isFavoriteList)
  }
)

export const predefinedListsAtom = atom(
  async (get) => {
    const allLists = await get(symbolListsAtom)
    const actualLists = Array.isArray(allLists) ? allLists : []
    return actualLists.filter((list: SymbolList) => list.isPredefined)
  }
)

export const customListsAtom = atom(
  async (get) => {
    const allLists = await get(symbolListsAtom)
    const actualLists = Array.isArray(allLists) ? allLists : []
    return actualLists.filter((list: SymbolList) => !list.isPredefined)
  }
)

// Cross-list symbol occurrence tracking
export const symbolOccurrencesAtom = atom(
  async (get) => {
    const allLists = await get(symbolListsAtom)
    const currentList = await get(currentListAtom)

    if (!currentList) return {}

    const actualLists = Array.isArray(allLists) ? allLists : []
    const occurrences: Record<string, ListReference[]> = {}

    // For each symbol in current list, find other occurrences
    currentList.symbols.forEach((symbol: StockSymbol) => {
      const otherLists: ListReference[] = []

      actualLists.forEach((list: SymbolList) => {
        // Skip current list
        if (list.id === currentList.id) return

        // Check if symbol exists in this list
        const symbolExists = list.symbols.some(
          (s: StockSymbol) => s.fullSymbol === symbol.fullSymbol
        )

        if (symbolExists) {
          otherLists.push({
            listId: list.id,
            listName: list.name,
            listColor: list.color
          })
        }
      })

      if (otherLists.length > 0) {
        occurrences[symbol.fullSymbol] = otherLists
      }
    })

    return occurrences
  }
)

// Action atom: Toggle list favorite status
export const toggleListFavoriteAtom = atom(
  null,
  async (get, set, listId: string) => {
    try {
      const lists = await get(symbolListsAtom)
      const actualLists = Array.isArray(lists) ? lists : []

      const updatedLists = actualLists.map((list: SymbolList) =>
        list.id === listId
          ? { ...list, isFavoriteList: !list.isFavoriteList, updatedAt: new Date() }
          : list
      )

      set(symbolListsAtom, updatedLists)

      // Sync to Cloud
      const authUser = await get(authUserAtom)
      if (authUser?.uid) {
        // Find the specific updated list to save bandwidth
        const updatedList = updatedLists.find(l => l.id === listId)
        if (updatedList) {
          saveListToFirestore(authUser.uid, updatedList).catch(console.error)
        }
      }

      set(successMessageAtom, 'List favorite status updated')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to toggle favorite'
      set(errorAtom, message)
      throw error
    }
  }
)

// Action atom: Move symbol between lists
export const moveSymbolAtom = atom(
  null,
  async (get, set, {
    symbol,
    fromListId,
    toListId
  }: {
    symbol: StockSymbol;
    fromListId: string;
    toListId: string;
  }) => {
    try {
      set(isLoadingAtom, true)
      set(errorAtom, '')

      const lists = await get(symbolListsAtom)
      const actualLists = Array.isArray(lists) ? lists : []

      const updatedLists = actualLists.map((list: SymbolList) => {
        // Remove from source list
        if (list.id === fromListId) {
          return {
            ...list,
            symbols: list.symbols.filter((s: StockSymbol) => s.fullSymbol !== symbol.fullSymbol),
            updatedAt: new Date()
          }
        }

        // Add to target list (if not already exists)
        if (list.id === toListId) {
          const exists = list.symbols.some((s: StockSymbol) => s.fullSymbol === symbol.fullSymbol)

          if (!exists) {
            return {
              ...list,
              symbols: [
                ...list.symbols,
                {
                  ...symbol,
                  addedAt: new Date(),
                  notes: '' // Reset notes when moving
                }
              ],
              updatedAt: new Date()
            }
          }
        }

        return list
      })

      set(symbolListsAtom, updatedLists)

      // Sync to Cloud
      const authUser = await get(authUserAtom)
      if (authUser?.uid) {
        const fromList = updatedLists.find(l => l.id === fromListId)
        const toList = updatedLists.find(l => l.id === toListId)
        if (fromList) saveListToFirestore(authUser.uid, fromList).catch(console.error)
        if (toList) saveListToFirestore(authUser.uid, toList).catch(console.error)
      }

      set(successMessageAtom, `Moved ${symbol.symbol} successfully`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to move symbol'
      set(errorAtom, message)
      throw error
    } finally {
      set(isLoadingAtom, false)
    }
  }
)

// Action atom: Copy symbol to another list
export const copySymbolAtom = atom(
  null,
  async (get, set, {
    symbol,
    toListId
  }: {
    symbol: StockSymbol;
    toListId: string;
  }) => {
    try {
      set(isLoadingAtom, true)
      set(errorAtom, '')

      const lists = await get(symbolListsAtom)
      const actualLists = Array.isArray(lists) ? lists : []

      const updatedLists = actualLists.map((list: SymbolList) => {
        if (list.id === toListId) {
          const exists = list.symbols.some((s: StockSymbol) => s.fullSymbol === symbol.fullSymbol)

          if (!exists) {
            return {
              ...list,
              symbols: [
                ...list.symbols,
                {
                  ...symbol,
                  addedAt: new Date(),
                  notes: '' // Reset notes when copying
                }
              ],
              updatedAt: new Date()
            }
          } else {
            set(errorAtom, 'Symbol already exists in target list')
          }
        }

        return list
      })

      set(symbolListsAtom, updatedLists)

      // Sync to Cloud
      const authUser = await get(authUserAtom)
      if (authUser?.uid) {
        const toList = updatedLists.find(l => l.id === toListId)
        if (toList) saveListToFirestore(authUser.uid, toList).catch(console.error)
      }

      set(successMessageAtom, `Copied ${symbol.symbol} successfully`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to copy symbol'
      set(errorAtom, message)
      throw error
    } finally {
      set(isLoadingAtom, false)
    }
  }
)

// ============================================================================
// Initialization & Migration Functions
// ============================================================================

/**
 * Initialize predefined colored lists on first install
 * Creates 6 predefined lists if no lists exist
 */
export const initializePredefinedListsAtom = atom(
  null,
  async (get, set) => {
    try {
      const existingLists = await get(symbolListsAtom)
      const actualLists = Array.isArray(existingLists) ? existingLists : []

      // Only initialize if no lists exist (fresh install)
      if (actualLists.length === 0) {
        const now = new Date()
        const predefinedLists: SymbolList[] = PREDEFINED_LISTS.map(template => ({
          id: generateId(),
          name: template.name,
          color: template.color,
          isPredefined: template.isPredefined,
          isFavoriteList: template.isFavoriteList,
          symbols: [],
          createdAt: now,
          updatedAt: now
        }))

        set(symbolListsAtom, predefinedLists)
        console.log('✅ Initialized 6 predefined colored lists')
        return true
      }

      return false
    } catch (error) {
      console.error('❌ Failed to initialize predefined lists:', error)
      return false
    }
  }
)

/**
 * Migrate existing data to new schema
 * Adds color, isPredefined, and isFavoriteList fields to existing lists
 * Adds addedAt timestamps to existing symbols
 */
export const migrateToEnhancedSchemaAtom = atom(
  null,
  async (get, set) => {
    try {
      const existingLists = await get(symbolListsAtom)
      const actualLists = Array.isArray(existingLists) ? existingLists : []

      if (actualLists.length === 0) {
        // Fresh install - just initialize predefined lists
        await set(initializePredefinedListsAtom)
        return { migrated: false, initialized: true }
      }

      // Check if migration is needed (check if any list is missing new fields)
      const needsMigration = actualLists.some((list: any) =>
        list.color === undefined ||
        list.isPredefined === undefined ||
        list.isFavoriteList === undefined
      )

      if (!needsMigration) {
        console.log('✅ Schema is already up to date')
        return { migrated: false, initialized: false }
      }

      console.log('🔄 Migrating existing data to enhanced schema...')

      const now = new Date()

      // Migrate existing lists
      const migratedLists = actualLists.map((list: any, index: number) => {
        // Assign color if missing (cycle through available colors)
        const color = list.color || AVAILABLE_COLORS[index % AVAILABLE_COLORS.length].hex

        // Ensure all symbols have addedAt timestamp
        const migratedSymbols = (list.symbols || []).map((symbol: any) => ({
          ...symbol,
          addedAt: symbol.addedAt || list.createdAt || now,
          notes: symbol.notes || ''
        }))

        return {
          ...list,
          color,
          isPredefined: list.isPredefined !== undefined ? list.isPredefined : false,
          isFavoriteList: list.isFavoriteList !== undefined ? list.isFavoriteList : false,
          symbols: migratedSymbols,
          updatedAt: now
        }
      })

      // Check if predefined lists exist
      const hasPredefinedLists = migratedLists.some((list: SymbolList) => list.isPredefined)

      // Add predefined lists if they don't exist
      if (!hasPredefinedLists) {
        const predefinedLists: SymbolList[] = PREDEFINED_LISTS.map(template => ({
          id: generateId(),
          name: template.name,
          color: template.color,
          isPredefined: template.isPredefined,
          isFavoriteList: template.isFavoriteList,
          symbols: [],
          createdAt: now,
          updatedAt: now
        }))

        // Add predefined lists at the beginning
        migratedLists.unshift(...predefinedLists)
      }

      set(symbolListsAtom, migratedLists)
      console.log('✅ Migration complete! Enhanced schema applied.')

      return { migrated: true, initialized: false }
    } catch (error) {
      console.error('❌ Migration failed:', error)
      throw error
    }
  }
)