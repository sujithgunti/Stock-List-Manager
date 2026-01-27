// Core data structures for the TradingView Stock Symbol List Manager

export interface StockSymbol {
  /** The symbol name without exchange prefix (e.g., "BHARATGEAR") */
  symbol: string;
  /** The exchange name (e.g., "NSE" or "BSE") */
  exchange: string;
  /** The full symbol with exchange prefix (e.g., "NSE:BHARATGEAR") */
  fullSymbol: string;
  /** Optional stock name from CSV (e.g., "Bharat Gears Limited") */
  stockName?: string;
  /** Timestamp when symbol was added to the list */
  addedAt: Date;
  /** Optional user notes for this symbol in this specific list */
  notes?: string;
}

export interface SymbolList {
  /** Unique identifier for the list */
  id: string;
  /** User-defined name for the list */
  name: string;
  /** Hex color for list theming (e.g., "#ef4444" for red) */
  color: string;
  /** Whether this is a predefined system list */
  isPredefined: boolean;
  /** Whether this list is marked as favorite for quick access */
  isFavoriteList: boolean;
  /** Array of stock symbols in this list */
  symbols: StockSymbol[];
  /** Timestamp when the list was created */
  createdAt: Date;
  /** Timestamp when the list was last modified */
  updatedAt: Date;
}

// Parser types
export interface ParseResult {
  /** Successfully parsed symbols */
  symbols: StockSymbol[];
  /** Any errors encountered during parsing */
  errors: string[];
  /** Number of symbols successfully parsed */
  successCount: number;
  /** Number of symbols that failed to parse */
  errorCount: number;
}

export interface CSVRow {
  /** Serial number column */
  sr?: string;
  /** Stock name column */
  stockName?: string;
  /** Symbol column */
  symbol?: string;
}

// Storage types
export interface StorageData {
  /** All saved symbol lists */
  symbolLists: SymbolList[];
  /** ID of the currently selected list */
  currentListId?: string;
  /** Application settings */
  settings: AppSettings;
}

export interface AppSettings {
  /** Default exchange for symbols without prefix */
  defaultExchange: 'NSE' | 'BSE';
  /** Theme preference */
  theme: 'dark' | 'light';
  /** Maximum number of symbols per list */
  maxSymbolsPerList: number;
}

// Auth types
export interface AuthUser {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
  idToken?: string;
  googleIdToken?: string;
  isPremium?: boolean;
  trialStartDate?: number;
}

// Component prop types
export interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onParsedSymbols: (result: ParseResult, listName: string) => void;
  isLoading: boolean;
  error?: string;
}

export interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  onParsedSymbols: (result: ParseResult, listName: string) => void;
  isLoading: boolean;
  error?: string;
}

export interface WebsiteExtractorProps {
  onParsedSymbols: (result: ParseResult, listName: string) => void;
  isLoading: boolean;
  error?: string;
}

export interface SymbolListProps {
  symbols: StockSymbol[];
  onSymbolClick: (symbol: StockSymbol) => void;
  onSymbolDelete: (symbol: StockSymbol) => void;
  isLoading: boolean;
  // Phase 7: Multi-list support props
  currentListId?: string;
  allLists?: SymbolList[];
  symbolOccurrences?: Record<string, ListReference[]>;
  onCopySymbol?: (symbol: StockSymbol, toListId: string) => Promise<void>;
  onRemoveSymbol?: (listId: string, symbol: StockSymbol) => Promise<void>;
}

export interface ListManagerProps {
  lists: SymbolList[];
  currentList: SymbolList | null;
  onListSelect: (list: SymbolList) => void;
  onListCreate: (name: string) => void;
  onListRename: (listId: string, newName: string) => void;
  onListDelete: (listId: string) => void;
}

// Utility types
export type Exchange = 'NSE' | 'BSE';

export type ParsedSymbolInput = {
  exchange: Exchange;
  symbol: string;
  stockName?: string;
};

// TradingView integration types
export interface TradingViewConfig {
  /** Base URL for Indian TradingView */
  baseUrl: 'https://in.tradingview.com/chart/';
  /** URL parameter for symbol */
  symbolParam: 'symbol';
}

// Error types
export class ParseError extends Error {
  constructor(
    message: string,
    public line?: number,
    public column?: string
  ) {
    super(message);
    this.name = 'ParseError';
  }
}

export class StorageError extends Error {
  constructor(message: string, public operation?: string) {
    super(message);
    this.name = 'StorageError';
  }
}

// Constants
export const SUPPORTED_EXCHANGES: Exchange[] = ['NSE', 'BSE'];
export const DEFAULT_SETTINGS: AppSettings = {
  defaultExchange: 'NSE',
  theme: 'dark',
  maxSymbolsPerList: 1000,
};

export const CSV_HEADERS = {
  SERIAL: 'sr',
  STOCK_NAME: 'stock name',
  SYMBOL: 'symbol',
} as const;

export const STORAGE_KEYS = {
  SYMBOL_LISTS: 'symbolLists',
  CURRENT_LIST: 'currentListId',
  SETTINGS: 'settings',
} as const;

// Cross-list tracking types
export interface ListReference {
  /** ID of the list containing the symbol */
  listId: string;
  /** Name of the list */
  listName: string;
  /** Color of the list */
  listColor: string;
}

// Color system types
export interface ColorOption {
  /** Display name of the color */
  name: string;
  /** Hex color value */
  hex: string;
}

// Predefined colored lists (created on first install)
export const PREDEFINED_LISTS = [
  {
    name: "🔴 Red List",
    color: "#ef4444",
    isPredefined: true,
    isFavoriteList: false
  },
  {
    name: "🔵 Blue List",
    color: "#3b82f6",
    isPredefined: true,
    isFavoriteList: false
  },
  {
    name: "🟢 Green List",
    color: "#10b981",
    isPredefined: true,
    isFavoriteList: false
  },
  {
    name: "🟠 Orange List",
    color: "#f59e0b",
    isPredefined: true,
    isFavoriteList: false
  },
  {
    name: "🟣 Purple List",
    color: "#8b5cf6",
    isPredefined: true,
    isFavoriteList: false
  },
  {
    name: "⭐ Favorites",
    color: "#ffd700",
    isPredefined: true,
    isFavoriteList: true
  }
] as const;

// Available colors for custom lists
export const AVAILABLE_COLORS: ColorOption[] = [
  { name: "Red", hex: "#ef4444" },
  { name: "Blue", hex: "#3b82f6" },
  { name: "Green", hex: "#10b981" },
  { name: "Orange", hex: "#f59e0b" },
  { name: "Yellow", hex: "#eab308" },
  { name: "Purple", hex: "#8b5cf6" },
  { name: "Pink", hex: "#ec4899" },
  { name: "Cyan", hex: "#06b6d4" },
  { name: "Lime", hex: "#84cc16" },
  { name: "Indigo", hex: "#6366f1" },
  { name: "Teal", hex: "#14b8a6" },
  { name: "Rose", hex: "#f43f5e" }
];