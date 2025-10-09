# TradingView Symbol Manager - Data Flow & Schema Documentation

## 📊 **Current Architecture Overview**

The extension uses **Jotai atomic state management** with **Chrome Extension Storage API** for data persistence. All data is stored locally in the user's browser with real-time synchronization across extension contexts.

## 🗄️ **Data Storage Schema**

### **Chrome Extension Storage Structure**
```typescript
// Stored in chrome.storage.local
{
  "symbolLists": SymbolList[],     // Array of all user's symbol lists
  "currentListId": string | null,  // ID of currently selected list
  "settings": AppSettings          // User preferences and configuration
}
```

### **Core Data Types**

#### **StockSymbol Interface**
```typescript
interface StockSymbol {
  exchange: 'NSE' | 'BSE';           // Stock exchange identifier
  symbol: string;                    // Stock symbol (e.g., "BHARATGEAR")
  fullSymbol: string;                // Complete symbol (e.g., "NSE:BHARATGEAR")
  name?: string;                     // Stock company name (from CSV)
  originalInput?: string;            // Original input for debugging
}
```

#### **SymbolList Interface**
```typescript
interface SymbolList {
  id: string;                        // Unique identifier (timestamp + random)
  name: string;                      // User-defined list name
  symbols: StockSymbol[];            // Array of stock symbols
  createdAt: Date;                   // Creation timestamp
  updatedAt: Date;                   // Last modification timestamp
}
```

#### **AppSettings Interface**
```typescript
interface AppSettings {
  theme: 'dark' | 'light';           // UI theme preference
  defaultExchange: 'NSE' | 'BSE';    // Default exchange for CSV imports
  autoOpenTradingView: boolean;      // Auto-open behavior
  widgetPosition: {                  // Floating widget preferences
    x: number;
    y: number;
  };
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  defaultExchange: 'NSE',
  autoOpenTradingView: true,
  widgetPosition: { x: 20, y: 20 }
};
```

#### **ParseResult Interface**
```typescript
interface ParseResult {
  symbols: StockSymbol[];            // Successfully parsed symbols
  errors: string[];                  // Parsing error messages
  totalProcessed: number;            // Total lines/items processed
}
```

## 🔄 **Data Flow Architecture**

### **1. Input Processing Flow**

#### **CSV File Upload Flow**
```
User selects CSV file
       ↓
FileUpload.tsx handles file
       ↓
parser.ts parseCSV()
       ↓
Validates format: "Sr., Stock Name, Symbol"
       ↓
Extracts symbols and applies NSE default
       ↓
Returns ParseResult with StockSymbol[]
       ↓
handleParsedSymbolsAtom creates new SymbolList
       ↓
Updates symbolListsAtom in Chrome Storage
       ↓
Real-time sync to all extension contexts
```

#### **Text Input Flow**
```
User enters text: "NSE:SYMBOL, BSE:SYMBOL"
       ↓
TextInput.tsx captures input
       ↓
parser.ts parseTextInput()
       ↓
Splits by comma, extracts exchange:symbol pairs
       ↓
Validates and normalizes format
       ↓
Returns ParseResult with StockSymbol[]
       ↓
handleParsedSymbolsAtom creates new SymbolList
       ↓
Updates symbolListsAtom in Chrome Storage
       ↓
Real-time sync to all extension contexts
```

### **2. Jotai Atom State Management**

#### **Storage Atoms (Persistent)**
```typescript
// Core data atoms with Chrome Storage integration
symbolListsAtom = atomWithStorage<SymbolList[]>('symbolLists', [], chromeExtensionStorage)
currentListIdAtom = atomWithStorage<string | null>('currentListId', null, chromeExtensionStorage)
settingsAtom = atomWithStorage<AppSettings>('settings', DEFAULT_SETTINGS, chromeExtensionStorage)
```

#### **UI State Atoms (Transient)**
```typescript
// Temporary UI state (not persisted)
isLoadingAtom = atom<boolean>(false)
errorAtom = atom<string>('')
successMessageAtom = atom<string>('')
activeTabAtom = atom<'upload' | 'text' | 'lists'>('upload')
textInputAtom = atom<string>('')
```

#### **Derived Atoms (Computed)**
```typescript
// Computed values based on storage atoms
currentListAtom = atom<SymbolList | null>(async (get) => {
  const currentListId = await get(currentListIdAtom)
  const allLists = await get(symbolListsAtom)
  return currentListId ? allLists.find(list => list.id === currentListId) || null : null
})

allListsCountAtom = atom(async (get) => {
  const allLists = await get(symbolListsAtom)
  return Array.isArray(allLists) ? allLists.length : 0
})

currentListSymbolCountAtom = atom(async (get) => {
  const currentList = await get(currentListAtom)
  return currentList ? currentList.symbols.length : 0
})
```

### **3. Cross-Context Synchronization**

#### **Extension Context Communication**
```
Popup Context (React App)
       ↓ (Jotai atoms update)
Chrome Extension Storage API
       ↓ (storage.onChanged events)
Content Script Context (TradingView pages)
       ↓ (FloatingWidgetJotai.tsx)
Real-time UI updates across all tabs
```

#### **Storage Adapter Implementation**
```typescript
// Custom Chrome Extension Storage adapter for Jotai
export const chromeExtensionStorage = createJSONStorage(() => ({
  getItem: async (key: string) => {
    const result = await chrome.storage.local.get([key])
    return result[key] || null
  },
  setItem: async (key: string, value: string) => {
    await chrome.storage.local.set({ [key]: JSON.parse(value) })
  },
  removeItem: async (key: string) => {
    await chrome.storage.local.remove([key])
  },
  subscribe: (key: string, callback: (value: any) => void) => {
    const listener = (changes: any, namespace: string) => {
      if (namespace === 'local' && changes[key]) {
        callback(changes[key].newValue)
      }
    }
    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }
}))
```

### **4. TradingView Integration Flow**

#### **Symbol Navigation Process**
```
User clicks symbol in FloatingWidget
       ↓
openSymbolSameTab() or openSymbolNewTab()
       ↓
Generates TradingView URL: "https://in.tradingview.com/chart/?symbol=NSE%3ASYMBOL"
       ↓
Same Tab: window.location.href = url
New Tab: window.open(url, '_blank')
       ↓
Content script detects navigation
       ↓
Widget state restoration from sessionStorage
       ↓
Jotai atoms re-sync from Chrome Storage
       ↓
Widget reappears with preserved state
```

#### **Widget State Persistence**
```typescript
// Session storage for cross-navigation state
const WIDGET_STATE = {
  visible: 'tv-widget-visible',
  selectedListId: 'tv-widget-selected-list',
  searchTerm: 'tv-widget-search'
}

// Restoration timing: 50ms for optimal performance
setTimeout(() => {
  restoreWidgetState()
  syncWithChromeStorage()
}, 50)
```

## 🏗️ **CRUD Operations Data Flow**

### **Create List Operation**
```typescript
createListAtom = atom(null, async (get, set, { name, symbols }) => {
  1. Generate unique ID: Date.now().toString(36) + Math.random().toString(36)
  2. Create SymbolList object with timestamps
  3. Get current symbolListsAtom value
  4. Append new list to array
  5. Update symbolListsAtom (triggers Chrome Storage write)
  6. Set currentListIdAtom to new list ID
  7. Broadcast change to all extension contexts
})
```

### **Update List Operation**
```typescript
updateListAtom = atom(null, async (get, set, { listId, updates }) => {
  1. Get current symbolListsAtom array
  2. Find list by ID
  3. Apply partial updates with new updatedAt timestamp
  4. Replace list in array at same index
  5. Update symbolListsAtom (triggers Chrome Storage write)
  6. Broadcast change to all extension contexts
})
```

### **Delete List Operation**
```typescript
deleteListAtom = atom(null, async (get, set, listId) => {
  1. Get current symbolListsAtom array
  2. Filter out list with matching ID
  3. Update symbolListsAtom with filtered array
  4. Check if deleted list was current selection
  5. Clear currentListIdAtom if necessary
  6. Broadcast change to all extension contexts
})
```

### **Remove Symbol Operation**
```typescript
removeSymbolFromListAtom = atom(null, async (get, set, { listId, symbolToRemove }) => {
  1. Get current symbolListsAtom array
  2. Find target list by ID
  3. Filter symbols by fullSymbol comparison
  4. Update list with new symbols array and updatedAt
  5. Replace list in main array
  6. Update symbolListsAtom (triggers Chrome Storage write)
  7. Broadcast change to all extension contexts
})
```

## 📈 **Performance Optimization**

### **Data Loading Strategy**
- **Lazy Loading**: Symbols only loaded when list is selected
- **Memoization**: Derived atoms cached until dependencies change
- **Debouncing**: Storage writes debounced to prevent excessive I/O
- **Batch Updates**: Multiple operations grouped into single storage write

### **Memory Management**
- **Cleanup**: Event listeners removed on component unmount
- **State Persistence**: Only essential state maintained across navigation
- **Error Boundaries**: Prevent corrupted data from crashing UI

### **Cross-Tab Optimization**
- **Event Filtering**: Only relevant storage changes trigger updates
- **State Deduplication**: Prevents unnecessary re-renders
- **Background Script Minimal**: 95% code reduction with Jotai migration

## 🔒 **Data Validation & Security**

### **Input Validation**
```typescript
// Symbol validation regex
const SYMBOL_REGEX = /^[A-Z0-9]+$/
const EXCHANGE_REGEX = /^(NSE|BSE)$/

// List name validation
const validateListName = (name: string) => {
  return name.trim().length > 0 && name.trim().length <= 100
}
```

### **Error Handling**
- **Parse Errors**: Invalid CSV/text formats gracefully handled
- **Storage Errors**: Chrome API failures with user feedback
- **Network Errors**: TradingView navigation failures logged
- **State Corruption**: Automatic data structure validation and repair

### **Data Integrity**
- **Type Safety**: Full TypeScript coverage prevents runtime errors
- **Schema Validation**: Incoming data validated against interfaces
- **Migration Support**: Future schema changes handled gracefully
- **Backup Strategy**: Local data exportable for user backup

## 🚀 **Extension Contexts Data Access**

### **Popup Context (Main UI)**
```
React App → Jotai Hooks → Storage Atoms → Chrome Storage API
• Full CRUD operations
• Real-time UI updates
• Error handling and user feedback
```

### **Content Script Context (TradingView Integration)**
```
FloatingWidgetJotai → Jotai Provider → Storage Atoms → Chrome Storage API
• Read-only symbol list access
• Widget state persistence
• Cross-navigation synchronization
```

### **Background Script Context (Minimal)**
```
Service Worker → Chrome Storage Events → Logging
• Extension lifecycle management
• Storage change monitoring
• Future extensibility hooks
```

This data flow architecture provides a robust, scalable foundation for the current local storage implementation while being easily extensible for future cloud-based features.