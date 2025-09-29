import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import {
  SymbolList,
  StockSymbol,
  AppSettings,
  DEFAULT_SETTINGS,
  ParseResult
} from '../types/index'
import { chromeExtensionStorage } from './storage'

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

// Derived atoms
export const currentListAtom = atom<SymbolList | null>(
  async (get) => {
    const currentListId = await get(currentListIdAtom)
    const allLists = await get(symbolListsAtom)
    const actualLists = Array.isArray(allLists) ? allLists : []
    return currentListId ? actualLists.find((list: SymbolList) => list.id === currentListId) || null : null
  }
)

export const allListsCountAtom = atom(
  async (get) => {
    const allLists = await get(symbolListsAtom)
    const actualLists = Array.isArray(allLists) ? allLists : []
    return actualLists.length
  }
)

export const currentListSymbolCountAtom = atom(
  async (get) => {
    const currentList = await get(currentListAtom)
    return currentList ? currentList.symbols.length : 0
  }
)

// Action atoms for complex operations
export const createListAtom = atom(
  null,
  async (get, set, { name, symbols = [] }: { name: string; symbols?: StockSymbol[] }) => {
    try {
      set(isLoadingAtom, true)
      set(errorAtom, '')

      const id = Date.now().toString(36) + Math.random().toString(36).substr(2)
      const now = new Date()

      const newList: SymbolList = {
        id,
        name: name.trim(),
        symbols,
        createdAt: now,
        updatedAt: now
      }

      const currentLists = await get(symbolListsAtom)
      const actualLists = Array.isArray(currentLists) ? currentLists : []
      const updatedLists = [...actualLists, newList]

      set(symbolListsAtom, updatedLists)
      set(currentListIdAtom, newList.id)

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

      // Show success message
      set(errorAtom, '') // Clear any previous errors
      if (result.errors.length > 0) {
        set(successMessageAtom, `Created "${customListName}" with ${result.symbols.length} symbols and ${result.errors.length} errors`)
      } else {
        set(successMessageAtom, `Successfully created "${customListName}" with ${result.symbols.length} symbols`)
      }

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