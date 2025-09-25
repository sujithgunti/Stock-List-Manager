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
}

export interface SymbolList {
  /** Unique identifier for the list */
  id: string;
  /** User-defined name for the list */
  name: string;
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

export interface SymbolListProps {
  symbols: StockSymbol[];
  onSymbolClick: (symbol: StockSymbol) => void;
  onSymbolDelete: (symbol: StockSymbol) => void;
  isLoading: boolean;
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