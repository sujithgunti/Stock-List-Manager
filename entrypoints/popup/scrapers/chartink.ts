// ChartInk.com symbol scraper

import { SiteScraper, SiteDetection, SupportedSite } from './types.js';

/**
 * ChartInk.com scraper implementation
 */
export const chartinkScraper: SiteScraper = {
  /**
   * Detect if current URL is ChartInk.com screener
   */
  detect(url: string): boolean {
    try {
      const urlObj = new URL(url);
      // Match both chartink.com/screener/* pages
      return urlObj.hostname.includes('chartink.com') &&
             url.includes('/screener/');
    } catch {
      return false;
    }
  },

  /**
   * Get site information for ChartInk.com
   */
  getSiteInfo(): SiteDetection {
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
  },

  /**
   * Process scraped data from ChartInk
   * @param rawData - Scraped data containing symbols and metadata
   * @returns Formatted string "NSE:SYMBOL, BSE:SYMBOL, ..."
   */
  async processData(rawData: any): Promise<string> {
    if (!rawData.success) {
      throw new Error(rawData.error || 'Failed to scrape symbols from ChartInk');
    }

    const stocks: Array<{
      symbol: string;
      exchange: string;
      metadata?: {
        price?: string;
        volume?: string;
        change?: string;
        [key: string]: any;
      };
    }> = rawData.symbols;

    if (!stocks || stocks.length === 0) {
      throw new Error('No symbols found in ChartInk screener results');
    }

    // Format symbols as "EXCHANGE:SYMBOL"
    // ChartInk typically uses NSE symbols by default
    const formattedSymbols: string[] = stocks.map(stock => {
      const exchange = stock.exchange || 'NSE';
      const symbol = stock.symbol.toUpperCase();

      // For now, return simple format
      // Metadata will be added to symbol notes in future enhancement
      return `${exchange}:${symbol}`;
    });

    // Remove duplicates and return as comma-separated string
    const uniqueSymbols = Array.from(new Set(formattedSymbols));
    return uniqueSymbols.join(', ');
  }
};
