// Screener.in symbol scraper

import { SiteScraper, SiteDetection, SupportedSite } from './types.js';

/**
 * Screener.in scraper implementation
 */
export const screenerScraper: SiteScraper = {
  /**
   * Detect if current URL is Screener.in
   */
  detect(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.includes('screener.in');
    } catch {
      return false;
    }
  },

  /**
   * Get site information for Screener.in
   */
  getSiteInfo(): SiteDetection {
    return {
      site: SupportedSite.SCREENER,
      isSupported: true,
      displayName: 'Screener.in',
      instructions: `📊 **Screener.in Detected**

**How to use:**
1. Navigate to a Screener.in search results or screen page
2. Click "Extract Symbols" below
3. Review the extracted symbols
4. Select a list to add them to
5. Click "Add to List"

**Features:**
- ✅ Automatically extracts from ALL pages (pagination support)
- ✅ Sets results to 50 per page for efficiency
- ✅ Handles both stock codes and numeric IDs automatically
- ✅ Deduplicates symbols across all pages

**Note:** Extraction may take a few seconds for multi-page results`
    };
  },

  /**
   * Process scraped data - convert numeric tokens to symbols
   * @param rawData - Array of symbols (may contain numeric token IDs)
   * @returns Formatted string "NSE:SYMBOL, BSE:SYMBOL, ..."
   */
  async processData(rawData: any): Promise<string> {
    if (!rawData.success) {
      throw new Error(rawData.error || 'Failed to scrape symbols');
    }

    const symbols: string[] = rawData.symbols;

    // Separate numeric tokens from regular symbols
    const numericTokens: string[] = [];
    const regularSymbols: string[] = [];

    symbols.forEach(symbol => {
      if (/^\d+$/.test(symbol)) {
        numericTokens.push(symbol);
      } else {
        regularSymbols.push(symbol);
      }
    });

    // Convert numeric tokens to symbols via Screener API
    let convertedSymbols: Array<{ symbol: string; exchange: string }> = [];

    if (numericTokens.length > 0) {
      try {
        const response = await fetch(
          `https://d3odwfz2snlzhh.cloudfront.net/default/screener-exchange-token-to-symbol?exchange_tokens=${numericTokens.join(',')}`
        );

        if (response.ok) {
          const data = await response.json();
          convertedSymbols = data.map((item: any) => ({
            symbol: item.tradingsymbol,
            exchange: item.exchange
          }));
        } else {
          console.warn('Failed to convert numeric tokens, using NSE as default exchange');
          // Fallback: treat numeric tokens as symbols with NSE exchange
          convertedSymbols = numericTokens.map(token => ({
            symbol: token,
            exchange: 'NSE'
          }));
        }
      } catch (error) {
        console.error('Error converting tokens:', error);
        // Fallback: treat numeric tokens as symbols with NSE exchange
        convertedSymbols = numericTokens.map(token => ({
          symbol: token,
          exchange: 'NSE'
        }));
      }
    }

    // Format all symbols as "EXCHANGE:SYMBOL"
    const formattedSymbols: string[] = [];

    // Add regular symbols (default to NSE)
    regularSymbols.forEach(symbol => {
      formattedSymbols.push(`NSE:${symbol}`);
    });

    // Add converted symbols (with their actual exchange)
    convertedSymbols.forEach(({ symbol, exchange }) => {
      formattedSymbols.push(`${exchange}:${symbol}`);
    });

    // Return as comma-separated string (ready for parseTextInput)
    return formattedSymbols.join(', ');
  }
};

/**
 * Detect which site the user is currently on
 * @param url - Current tab URL
 * @returns Site detection result
 */
export function detectSite(url: string): SiteDetection {
  if (screenerScraper.detect(url)) {
    return screenerScraper.getSiteInfo();
  }

  // ChartInk detection
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes('chartink.com') && url.includes('/screener/')) {
      return {
        site: SupportedSite.CHARTINK,
        isSupported: true,
        displayName: 'ChartInk.com',
        instructions: `📈 **ChartInk.com Detected**

**How to use:**
1. Navigate to a ChartInk screener results page
2. Make sure the scan has completed and results are visible
3. Click "Extract Symbols" below
4. Review the extracted symbols with metadata
5. Select a list to add them to
6. Click "Add to List"

**Features:**
- ✅ Extracts stock symbols with exchange info (NSE/BSE)
- ✅ Includes metadata (price, volume, change%, etc.)
- ✅ Supports pagination for multi-page results
- ✅ Deduplicates symbols across all pages

**Note:** Extraction may take a few seconds for multi-page results`
      };
    }
  } catch {
    // Invalid URL, continue to unknown
  }

  // Future: Add TradingEdge detection here

  return {
    site: SupportedSite.UNKNOWN,
    isSupported: false,
    displayName: 'Unknown Site',
    instructions: `❌ **Unsupported Website**

This feature currently supports:
- 📊 Screener.in (search results and screens)
- 📈 ChartInk.com (screener results)

**Coming soon:**
- 📉 TradingEdge

**How to use:**
Navigate to one of the supported websites and open this extension again.`
  };
}
