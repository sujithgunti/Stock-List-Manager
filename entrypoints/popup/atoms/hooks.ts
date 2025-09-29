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
  autoDisimissSuccessAtom
} from './index'
import { SymbolList, StockSymbol, AppSettings, ParseResult } from '../types/index'

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