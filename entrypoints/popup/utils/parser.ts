import {
  StockSymbol,
  ParseResult,
  CSVRow,
  Exchange,
  ParsedSymbolInput,
  ParseError,
  SUPPORTED_EXCHANGES,
  CSV_HEADERS
} from '../types/index.js';

/**
 * Parse CSV content with flexible format detection
 * Auto-detects symbol and stock name columns
 */
export function parseCSV(csvContent: string): ParseResult {
  const result: ParseResult = {
    symbols: [],
    errors: [],
    successCount: 0,
    errorCount: 0
  };

  if (!csvContent?.trim()) {
    result.errors.push('CSV content is empty');
    return result;
  }

  try {
    // Clean content by removing BOM and normalizing line endings
    const cleanContent = csvContent.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = cleanContent.trim().split('\n').map(line => line.trim()).filter(line => line.length > 0);

    if (lines.length < 2) {
      result.errors.push('CSV must have at least a header and one data row');
      return result;
    }

    // Parse header row to identify columns
    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine);

    console.log('CSV Headers found:', headers);

    // Auto-detect columns using flexible matching
    const columnIndices = autoDetectColumns(headers, lines);

    console.log('Detected column indices:', columnIndices);

    if (columnIndices.symbol === -1) {
      // Try to extract symbols from any column that looks like it contains stock symbols
      return tryExtractSymbolsFromAnyColumn(lines, result);
    }

    // Parse data rows using detected columns
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue; // Skip empty lines

      try {
        const columns = parseCSVLine(line);

        // Get symbol from detected column
        const symbolText = columnIndices.symbol >= 0 && columns[columnIndices.symbol] ?
          columns[columnIndices.symbol].trim() : '';

        // Get stock name from detected column
        const stockNameText = columnIndices.stockName >= 0 && columns[columnIndices.stockName] ?
          columns[columnIndices.stockName].trim() : '';

        if (!symbolText) {
          result.errors.push(`Line ${i + 1}: Symbol is empty or missing`);
          result.errorCount++;
          continue;
        }

        // Clean and validate symbol
        const cleanSymbol = cleanSymbolName(symbolText);
        if (!cleanSymbol || cleanSymbol.length < 2) {
          result.errors.push(`Line ${i + 1}: Invalid symbol: "${symbolText}"`);
          result.errorCount++;
          continue;
        }

        // Create stock symbol with default NSE exchange
        const stockSymbol: StockSymbol = {
          symbol: cleanSymbol,
          exchange: 'NSE', // Default to NSE for CSV imports
          fullSymbol: `NSE:${cleanSymbol}`,
          stockName: stockNameText || undefined
        };

        result.symbols.push(stockSymbol);
        result.successCount++;

      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown parsing error';
        result.errors.push(`Line ${i + 1}: ${message}`);
        result.errorCount++;
      }
    }

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown CSV parsing error';
    result.errors.push(`CSV parsing failed: ${message}`);
    result.errorCount = 1;
  }

  return result;
}

/**
 * Auto-detect CSV columns by analyzing headers and sample data
 */
function autoDetectColumns(headers: string[], lines: string[]) {
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());

  // Try exact matches first
  let symbolIndex = findColumnIndex(normalizedHeaders, ['symbol', 'ticker', 'code', 'scrip']);
  let stockNameIndex = findColumnIndex(normalizedHeaders, ['stock name', 'company name', 'name', 'company', 'stock', 'security']);

  // If no exact matches, analyze sample data to find symbol column
  if (symbolIndex === -1 && lines.length > 1) {
    symbolIndex = findSymbolColumnByContent(lines.slice(1, Math.min(6, lines.length)));
  }

  // If still no symbol column, try more flexible header matching
  if (symbolIndex === -1) {
    symbolIndex = findColumnIndex(normalizedHeaders, ['sym', 'tick', 'scrip', 'security']);
  }

  // If still no stock name column, try more flexible matching
  if (stockNameIndex === -1) {
    stockNameIndex = findColumnIndex(normalizedHeaders, ['ltd', 'limited', 'corp', 'inc']);
  }

  return {
    symbol: symbolIndex,
    stockName: stockNameIndex
  };
}

/**
 * Find symbol column by analyzing actual data content
 */
function findSymbolColumnByContent(sampleLines: string[]): number {
  if (sampleLines.length === 0) return -1;

  // Parse first few lines and analyze each column
  const parsedLines = sampleLines.map(line => parseCSVLine(line));
  if (parsedLines.length === 0 || parsedLines[0].length === 0) return -1;

  const numColumns = Math.max(...parsedLines.map(line => line.length));

  for (let colIndex = 0; colIndex < numColumns; colIndex++) {
    let validSymbolCount = 0;
    let totalValues = 0;

    for (const line of parsedLines) {
      if (line[colIndex]) {
        const value = line[colIndex].trim();
        totalValues++;

        // Check if this looks like a stock symbol
        if (isLikelyStockSymbol(value)) {
          validSymbolCount++;
        }
      }
    }

    // If more than 70% of values in this column look like stock symbols
    if (totalValues > 0 && (validSymbolCount / totalValues) >= 0.7) {
      return colIndex;
    }
  }

  return -1;
}

/**
 * Check if a string looks like a stock symbol
 */
function isLikelyStockSymbol(value: string): boolean {
  if (!value || value.length < 2) return false;

  const cleaned = value.trim().toUpperCase();

  // Basic symbol patterns
  return /^[A-Z0-9]{2,12}$/.test(cleaned) &&
         !cleaned.includes(' ') &&
         !/^\d+$/.test(cleaned); // Not just numbers
}

/**
 * Fallback: try to extract symbols from any column that contains symbol-like data
 */
function tryExtractSymbolsFromAnyColumn(lines: string[], result: ParseResult): ParseResult {
  if (lines.length < 2) {
    result.errors.push('No symbol column detected and insufficient data for auto-extraction');
    return result;
  }

  const dataLines = lines.slice(1); // Skip header
  let extractedCount = 0;

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i];
    if (!line.trim()) continue;

    try {
      const columns = parseCSVLine(line);
      let symbolFound = false;

      // Check each column for symbol-like content
      for (let j = 0; j < columns.length; j++) {
        const value = columns[j]?.trim();
        if (value && isLikelyStockSymbol(value)) {
          const cleanSymbol = cleanSymbolName(value);
          if (cleanSymbol && cleanSymbol.length >= 2) {
            const stockSymbol: StockSymbol = {
              symbol: cleanSymbol,
              exchange: 'NSE',
              fullSymbol: `NSE:${cleanSymbol}`,
              stockName: undefined
            };

            result.symbols.push(stockSymbol);
            result.successCount++;
            extractedCount++;
            symbolFound = true;
            break; // Found symbol in this row, move to next
          }
        }
      }

      if (!symbolFound) {
        result.errors.push(`Line ${i + 2}: No recognizable symbol found`);
        result.errorCount++;
      }

    } catch (error) {
      result.errors.push(`Line ${i + 2}: Parse error`);
      result.errorCount++;
    }
  }

  if (extractedCount === 0) {
    result.errors.push('Could not auto-detect any stock symbols in the CSV file');
  }

  return result;
}

/**
 * Parse text input with "NSE:SYMBOL, BSE:SYMBOL" format
 */
export function parseTextInput(textContent: string): ParseResult {
  const result: ParseResult = {
    symbols: [],
    errors: [],
    successCount: 0,
    errorCount: 0
  };

  if (!textContent?.trim()) {
    result.errors.push('Text input is empty');
    return result;
  }

  try {
    // Split by comma and clean up whitespace
    const symbolStrings = textContent
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (symbolStrings.length === 0) {
      result.errors.push('No symbols found in text input');
      return result;
    }

    for (let i = 0; i < symbolStrings.length; i++) {
      const symbolString = symbolStrings[i];

      try {
        const parsedSymbol = parseSymbolString(symbolString);

        if (!parsedSymbol) {
          result.errors.push(`Symbol ${i + 1}: Invalid format: "${symbolString}". Expected format: "NSE:SYMBOL" or "BSE:SYMBOL"`);
          result.errorCount++;
          continue;
        }

        const stockSymbol: StockSymbol = {
          symbol: parsedSymbol.symbol,
          exchange: parsedSymbol.exchange,
          fullSymbol: `${parsedSymbol.exchange}:${parsedSymbol.symbol}`,
          stockName: parsedSymbol.stockName
        };

        result.symbols.push(stockSymbol);
        result.successCount++;

      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown parsing error';
        result.errors.push(`Symbol ${i + 1}: ${message}`);
        result.errorCount++;
      }
    }

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown text parsing error';
    result.errors.push(`Text parsing failed: ${message}`);
    result.errorCount = 1;
  }

  return result;
}

/**
 * Parse individual symbol string like "NSE:INNOVANA" or "BSE:CIANAGRO"
 */
function parseSymbolString(symbolString: string): ParsedSymbolInput | null {
  if (!symbolString?.trim()) return null;

  const cleanInput = symbolString.trim().toUpperCase();

  // Check if it contains a colon (exchange:symbol format)
  if (!cleanInput.includes(':')) {
    throw new ParseError(`Missing exchange prefix. Expected format: "NSE:SYMBOL" or "BSE:SYMBOL"`);
  }

  const parts = cleanInput.split(':');
  if (parts.length !== 2) {
    throw new ParseError(`Invalid symbol format. Expected exactly one colon separator.`);
  }

  const [exchangePart, symbolPart] = parts;

  // Validate exchange
  const exchange = exchangePart.trim() as Exchange;
  if (!SUPPORTED_EXCHANGES.includes(exchange)) {
    throw new ParseError(`Unsupported exchange: "${exchangePart}". Supported exchanges: ${SUPPORTED_EXCHANGES.join(', ')}`);
  }

  // Validate and clean symbol
  const symbol = symbolPart.trim();
  if (!symbol) {
    throw new ParseError(`Symbol part is empty`);
  }

  const cleanSymbol = cleanSymbolName(symbol);
  if (!isValidSymbolName(cleanSymbol)) {
    throw new ParseError(`Invalid symbol: "${symbol}"`);
  }

  return {
    exchange,
    symbol: cleanSymbol
  };
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i += 2;
        continue;
      } else {
        // Start or end of quoted field
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
    i++;
  }

  // Add the last field
  result.push(current.trim());

  return result;
}

/**
 * Find column index by matching possible header names
 */
function findColumnIndex(headers: string[], possibleNames: string[]): number {
  for (const name of possibleNames) {
    const index = headers.findIndex(header =>
      header.includes(name) || name.includes(header)
    );
    if (index >= 0) return index;
  }
  return -1;
}

/**
 * Clean symbol name by removing invalid characters
 */
function cleanSymbolName(symbol: string): string {
  return symbol
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, ''); // Remove non-alphanumeric characters
}

/**
 * Validate if symbol name is in correct format
 */
function isValidSymbolName(symbol: string): boolean {
  return /^[A-Z0-9]{1,20}$/.test(symbol); // 1-20 alphanumeric characters
}

/**
 * Generate TradingView URL for a stock symbol
 */
export function generateTradingViewUrl(symbol: StockSymbol): string {
  const baseUrl = 'https://in.tradingview.com/chart/';
  const encodedSymbol = encodeURIComponent(`${symbol.exchange}:${symbol.symbol}`);
  return `${baseUrl}?symbol=${encodedSymbol}`;
}

/**
 * Validate file content before parsing
 */
export function validateFileContent(content: string, filename: string): string[] {
  const errors: string[] = [];

  if (!content?.trim()) {
    errors.push('File is empty');
    return errors;
  }

  // Check file extension
  if (!filename.toLowerCase().endsWith('.csv')) {
    errors.push('File must be a CSV file (.csv extension)');
  }

  // Check content size (max 1MB)
  if (content.length > 1024 * 1024) {
    errors.push('File is too large. Maximum size is 1MB');
  }

  // Check for basic CSV structure
  const lines = content.trim().split('\n');
  if (lines.length < 2) {
    errors.push('CSV must have at least a header row and one data row');
  }

  return errors;
}

/**
 * Remove duplicate symbols from array
 */
export function removeDuplicateSymbols(symbols: StockSymbol[]): StockSymbol[] {
  const seen = new Set<string>();
  return symbols.filter(symbol => {
    const key = symbol.fullSymbol;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Sort symbols by exchange and then by symbol name
 */
export function sortSymbols(symbols: StockSymbol[]): StockSymbol[] {
  return [...symbols].sort((a, b) => {
    // First sort by exchange
    if (a.exchange !== b.exchange) {
      return a.exchange.localeCompare(b.exchange);
    }
    // Then sort by symbol name
    return a.symbol.localeCompare(b.symbol);
  });
}