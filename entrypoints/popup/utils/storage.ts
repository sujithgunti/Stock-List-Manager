import {
  SymbolList,
  StockSymbol,
  StorageData,
  AppSettings,
  StorageError,
  DEFAULT_SETTINGS,
  STORAGE_KEYS
} from '../types/index.js';

/**
 * Chrome Extension Storage Manager for Symbol Lists
 */
export class StorageManager {
  private static instance: StorageManager;

  private constructor() {}

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  /**
   * Get all symbol lists from storage
   */
  async getAllLists(): Promise<SymbolList[]> {
    try {
      const data = await this.getStorageData();
      return data.symbolLists || [];
    } catch (error) {
      throw new StorageError('Failed to retrieve symbol lists', 'getAllLists');
    }
  }

  /**
   * Get a specific symbol list by ID
   */
  async getListById(id: string): Promise<SymbolList | null> {
    try {
      const lists = await this.getAllLists();
      return lists.find(list => list.id === id) || null;
    } catch (error) {
      throw new StorageError(`Failed to retrieve list with ID: ${id}`, 'getListById');
    }
  }

  /**
   * Create a new symbol list
   */
  async createList(name: string, symbols: StockSymbol[] = []): Promise<SymbolList> {
    try {
      const id = this.generateId();
      const now = new Date();

      const newList: SymbolList = {
        id,
        name: name.trim(),
        symbols,
        createdAt: now,
        updatedAt: now
      };

      const lists = await this.getAllLists();
      lists.push(newList);

      await this.saveAllLists(lists);
      return newList;
    } catch (error) {
      throw new StorageError(`Failed to create list: ${name}`, 'createList');
    }
  }

  /**
   * Update an existing symbol list
   */
  async updateList(listId: string, updates: Partial<Omit<SymbolList, 'id' | 'createdAt'>>): Promise<SymbolList> {
    try {
      const lists = await this.getAllLists();
      const listIndex = lists.findIndex(list => list.id === listId);

      if (listIndex === -1) {
        throw new StorageError(`List not found with ID: ${listId}`, 'updateList');
      }

      const updatedList: SymbolList = {
        ...lists[listIndex],
        ...updates,
        updatedAt: new Date()
      };

      lists[listIndex] = updatedList;
      await this.saveAllLists(lists);

      return updatedList;
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError(`Failed to update list: ${listId}`, 'updateList');
    }
  }

  /**
   * Delete a symbol list
   */
  async deleteList(listId: string): Promise<boolean> {
    try {
      const lists = await this.getAllLists();
      const initialLength = lists.length;
      const filteredLists = lists.filter(list => list.id !== listId);

      if (filteredLists.length === initialLength) {
        return false; // List not found
      }

      await this.saveAllLists(filteredLists);

      // If this was the current list, clear the current selection
      const currentListId = await this.getCurrentListId();
      if (currentListId === listId) {
        await this.setCurrentListId(null);
      }

      return true;
    } catch (error) {
      throw new StorageError(`Failed to delete list: ${listId}`, 'deleteList');
    }
  }

  /**
   * Add symbols to a list
   */
  async addSymbolsToList(listId: string, symbols: StockSymbol[]): Promise<SymbolList> {
    try {
      const list = await this.getListById(listId);
      if (!list) {
        throw new StorageError(`List not found with ID: ${listId}`, 'addSymbolsToList');
      }

      // Remove duplicates by fullSymbol
      const existingSymbolKeys = new Set(list.symbols.map(s => s.fullSymbol));
      const newSymbols = symbols.filter(s => !existingSymbolKeys.has(s.fullSymbol));

      const updatedSymbols = [...list.symbols, ...newSymbols];
      return this.updateList(listId, { symbols: updatedSymbols });
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError(`Failed to add symbols to list: ${listId}`, 'addSymbolsToList');
    }
  }

  /**
   * Remove a symbol from a list
   */
  async removeSymbolFromList(listId: string, symbolToRemove: StockSymbol): Promise<SymbolList> {
    try {
      const list = await this.getListById(listId);
      if (!list) {
        throw new StorageError(`List not found with ID: ${listId}`, 'removeSymbolFromList');
      }

      const updatedSymbols = list.symbols.filter(
        symbol => symbol.fullSymbol !== symbolToRemove.fullSymbol
      );

      return this.updateList(listId, { symbols: updatedSymbols });
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError(`Failed to remove symbol from list: ${listId}`, 'removeSymbolFromList');
    }
  }

  /**
   * Get the current selected list ID
   */
  async getCurrentListId(): Promise<string | null> {
    try {
      const data = await this.getStorageData();
      return data.currentListId || null;
    } catch (error) {
      throw new StorageError('Failed to get current list ID', 'getCurrentListId');
    }
  }

  /**
   * Set the current selected list ID
   */
  async setCurrentListId(listId: string | null): Promise<void> {
    try {
      const data = await this.getStorageData();
      data.currentListId = listId || undefined;
      await this.saveStorageData(data);
    } catch (error) {
      throw new StorageError(`Failed to set current list ID: ${listId}`, 'setCurrentListId');
    }
  }

  /**
   * Get current selected list
   */
  async getCurrentList(): Promise<SymbolList | null> {
    try {
      const currentId = await this.getCurrentListId();
      if (!currentId) return null;
      return this.getListById(currentId);
    } catch (error) {
      throw new StorageError('Failed to get current list', 'getCurrentList');
    }
  }

  /**
   * Get application settings
   */
  async getSettings(): Promise<AppSettings> {
    try {
      const data = await this.getStorageData();
      return { ...DEFAULT_SETTINGS, ...data.settings };
    } catch (error) {
      throw new StorageError('Failed to get settings', 'getSettings');
    }
  }

  /**
   * Update application settings
   */
  async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    try {
      const currentSettings = await this.getSettings();
      const updatedSettings = { ...currentSettings, ...settings };

      const data = await this.getStorageData();
      data.settings = updatedSettings;
      await this.saveStorageData(data);

      return updatedSettings;
    } catch (error) {
      throw new StorageError('Failed to update settings', 'updateSettings');
    }
  }

  /**
   * Clear all data (for testing or reset)
   */
  async clearAll(): Promise<void> {
    try {
      if (typeof browser !== 'undefined' && browser.storage) {
        await browser.storage.local.clear();
      } else if (typeof chrome !== 'undefined' && chrome.storage) {
        await new Promise<void>((resolve, reject) => {
          chrome.storage.local.clear(() => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve();
            }
          });
        });
      } else {
        // Fallback to localStorage
        Object.values(STORAGE_KEYS).forEach(key => {
          localStorage.removeItem(key);
        });
      }
    } catch (error) {
      throw new StorageError('Failed to clear all data', 'clearAll');
    }
  }

  /**
   * Export all data as JSON
   */
  async exportData(): Promise<string> {
    try {
      const data = await this.getStorageData();
      return JSON.stringify(data, null, 2);
    } catch (error) {
      throw new StorageError('Failed to export data', 'exportData');
    }
  }

  /**
   * Import data from JSON
   */
  async importData(jsonData: string): Promise<void> {
    try {
      const data: StorageData = JSON.parse(jsonData);

      // Validate data structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data format');
      }

      // Ensure arrays exist
      if (!Array.isArray(data.symbolLists)) {
        data.symbolLists = [];
      }

      // Validate each list
      data.symbolLists = data.symbolLists.filter(list => {
        return list && typeof list === 'object' && list.id && list.name && Array.isArray(list.symbols);
      });

      // Set default settings if not provided
      if (!data.settings) {
        data.settings = DEFAULT_SETTINGS;
      }

      await this.saveStorageData(data);
    } catch (error) {
      throw new StorageError('Failed to import data', 'importData');
    }
  }

  // Private helper methods

  private async getStorageData(): Promise<StorageData> {
    try {
      let data: StorageData;

      if (typeof browser !== 'undefined' && browser.storage) {
        // Firefox/WebExtensions API
        const result = await browser.storage.local.get();
        data = {
          symbolLists: result.symbolLists || [],
          currentListId: result.currentListId,
          settings: result.settings || DEFAULT_SETTINGS
        };
      } else if (typeof chrome !== 'undefined' && chrome.storage) {
        // Chrome Extensions API
        const result = await new Promise<any>((resolve, reject) => {
          chrome.storage.local.get((items) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(items);
            }
          });
        });

        data = {
          symbolLists: result.symbolLists || [],
          currentListId: result.currentListId,
          settings: result.settings || DEFAULT_SETTINGS
        };
      } else {
        // Fallback to localStorage for development
        const symbolLists = localStorage.getItem(STORAGE_KEYS.SYMBOL_LISTS);
        const currentListId = localStorage.getItem(STORAGE_KEYS.CURRENT_LIST);
        const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS);

        data = {
          symbolLists: symbolLists ? JSON.parse(symbolLists) : [],
          currentListId: currentListId || undefined,
          settings: settings ? JSON.parse(settings) : DEFAULT_SETTINGS
        };
      }

      // Ensure dates are properly converted
      if (data.symbolLists) {
        data.symbolLists.forEach(list => {
          list.createdAt = new Date(list.createdAt);
          list.updatedAt = new Date(list.updatedAt);
        });
      }

      return data;
    } catch (error) {
      console.error('Storage get error:', error);
      return {
        symbolLists: [],
        settings: DEFAULT_SETTINGS
      };
    }
  }

  private async saveStorageData(data: StorageData): Promise<void> {
    try {
      if (typeof browser !== 'undefined' && browser.storage) {
        // Firefox/WebExtensions API
        await browser.storage.local.set(data);
      } else if (typeof chrome !== 'undefined' && chrome.storage) {
        // Chrome Extensions API
        await new Promise<void>((resolve, reject) => {
          chrome.storage.local.set(data, () => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve();
            }
          });
        });
      } else {
        // Fallback to localStorage for development
        localStorage.setItem(STORAGE_KEYS.SYMBOL_LISTS, JSON.stringify(data.symbolLists));
        if (data.currentListId) {
          localStorage.setItem(STORAGE_KEYS.CURRENT_LIST, data.currentListId);
        } else {
          localStorage.removeItem(STORAGE_KEYS.CURRENT_LIST);
        }
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
      }
    } catch (error) {
      console.error('Storage save error:', error);
      throw error;
    }
  }

  private async saveAllLists(lists: SymbolList[]): Promise<void> {
    const data = await this.getStorageData();
    data.symbolLists = lists;
    await this.saveStorageData(data);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

// Export singleton instance
export const storage = StorageManager.getInstance();