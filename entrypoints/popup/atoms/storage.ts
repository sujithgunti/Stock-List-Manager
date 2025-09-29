import { createJSONStorage } from 'jotai/utils'

/**
 * Custom Chrome Extension Storage adapter for Jotai
 *
 * This adapter allows Jotai's atomWithStorage to work seamlessly
 * with Chrome Extension Storage API, providing automatic persistence
 * and cross-context synchronization.
 */
export const createChromeExtensionStorage = () => {
  // Check if we're in a Chrome Extension context
  const isExtensionContext = typeof globalThis.chrome !== 'undefined' && globalThis.chrome.storage

  return createJSONStorage<any>(() => ({
    getItem: async (key: string) => {
      try {
        if (isExtensionContext) {
          // Use Chrome Extension Storage API
          const result = await globalThis.chrome.storage.local.get([key])
          return result[key] || null
        } else {
          // Fallback to localStorage for development
          return localStorage.getItem(key)
        }
      } catch (error) {
        console.error(`Failed to get item "${key}" from storage:`, error)
        return null
      }
    },

    setItem: async (key: string, value: string) => {
      try {
        if (isExtensionContext) {
          // Use Chrome Extension Storage API
          await globalThis.chrome.storage.local.set({ [key]: value })
        } else {
          // Fallback to localStorage for development
          localStorage.setItem(key, value)
        }
      } catch (error) {
        console.error(`Failed to set item "${key}" in storage:`, error)
        throw error
      }
    },

    removeItem: async (key: string) => {
      try {
        if (isExtensionContext) {
          // Use Chrome Extension Storage API
          await globalThis.chrome.storage.local.remove([key])
        } else {
          // Fallback to localStorage for development
          localStorage.removeItem(key)
        }
      } catch (error) {
        console.error(`Failed to remove item "${key}" from storage:`, error)
        throw error
      }
    },

    // Subscribe to storage changes for cross-context synchronization
    subscribe: (key: string, callback: (value: any) => void) => {
      if (isExtensionContext) {
        const listener = (changes: { [key: string]: any }, namespace: string) => {
          if (namespace === 'local' && changes[key]) {
            callback(changes[key].newValue)
          }
        }

        globalThis.chrome.storage.onChanged.addListener(listener)

        // Return cleanup function
        return () => {
          globalThis.chrome.storage.onChanged.removeListener(listener)
        }
      } else {
        // Fallback for development - use storage events
        const listener = (event: StorageEvent) => {
          if (event.key === key && event.newValue) {
            try {
              callback(JSON.parse(event.newValue))
            } catch (error) {
              console.error('Failed to parse storage event value:', error)
            }
          }
        }

        window.addEventListener('storage', listener)

        return () => {
          window.removeEventListener('storage', listener)
        }
      }
    }
  }))
}

/**
 * Chrome Extension Storage instance for Jotai atoms
 */
export const chromeExtensionStorage = createChromeExtensionStorage()

/**
 * Enhanced atom with storage that includes cross-context broadcast
 * This combines Chrome Extension Storage with BroadcastChannel for real-time sync
 */
export function createAtomWithBroadcastStorage<T>(key: string, initialValue: T) {
  // This function will be called from within React components where dynamic imports are safe
  return async () => {
    const { atom } = await import('jotai')
    const { atomWithStorage } = await import('jotai/utils')

    // Create base storage atom
    const storageAtom = atomWithStorage(key, initialValue, chromeExtensionStorage)

    // Add broadcast channel for cross-tab communication
    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(key) : null
    const listeners = new Set<(event: MessageEvent<any>) => void>()

    if (channel) {
      channel.onmessage = (event) => {
        listeners.forEach((l) => l(event))
      }
    }

    // Create enhanced atom that combines storage with broadcast
    const broadcastStorageAtom = atom(
      (get) => get(storageAtom),
      async (get, set, update: any) => {
        // Update storage atom
        await set(storageAtom, update)

        // Broadcast to other tabs if available
        if (channel) {
          try {
            const newValue = get(storageAtom)
            channel.postMessage(newValue)
          } catch (error) {
            console.warn('Failed to broadcast storage update:', error)
          }
        }
      }
    )

    // Set up broadcast listener
    if (channel) {
      broadcastStorageAtom.onMount = (setAtom) => {
        const listener = (event: MessageEvent<any>) => {
          setAtom(event.data)
        }

        listeners.add(listener)

        return () => {
          listeners.delete(listener)
        }
      }
    }

    return broadcastStorageAtom
  }
}

/**
 * Utility to clear all extension storage (for testing/reset)
 */
export async function clearAllStorage(): Promise<void> {
  try {
    if (typeof globalThis.chrome !== 'undefined' && globalThis.chrome.storage) {
      await globalThis.chrome.storage.local.clear()
    } else {
      // Fallback for development
      localStorage.clear()
    }
  } catch (error) {
    console.error('Failed to clear storage:', error)
    throw error
  }
}

/**
 * Utility to export all storage data as JSON
 */
export async function exportStorageData(): Promise<string> {
  try {
    let data: any = {}

    if (typeof globalThis.chrome !== 'undefined' && globalThis.chrome.storage) {
      data = await globalThis.chrome.storage.local.get()
    } else {
      // Fallback for development
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          data[key] = localStorage.getItem(key)
        }
      }
    }

    return JSON.stringify(data, null, 2)
  } catch (error) {
    console.error('Failed to export storage data:', error)
    throw error
  }
}

/**
 * Utility to import storage data from JSON
 */
export async function importStorageData(jsonData: string): Promise<void> {
  try {
    const data = JSON.parse(jsonData)

    if (typeof globalThis.chrome !== 'undefined' && globalThis.chrome.storage) {
      await globalThis.chrome.storage.local.set(data)
    } else {
      // Fallback for development
      Object.entries(data).forEach(([key, value]) => {
        if (typeof value === 'string') {
          localStorage.setItem(key, value)
        }
      })
    }
  } catch (error) {
    console.error('Failed to import storage data:', error)
    throw error
  }
}