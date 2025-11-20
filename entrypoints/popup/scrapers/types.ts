// Types for website scraping functionality

import { StockSymbol } from '../types/index.js';

/**
 * Supported websites for symbol extraction
 */
export enum SupportedSite {
  SCREENER = 'screener',
  CHARTINK = 'chartink',
  TRADINGEDGE = 'tradingedge',
  UNKNOWN = 'unknown'
}

/**
 * Site detection result
 */
export interface SiteDetection {
  /** The detected site type */
  site: SupportedSite;
  /** Whether the site is supported for scraping */
  isSupported: boolean;
  /** Display name of the site */
  displayName: string;
  /** Instructions for extracting from this site */
  instructions: string;
}

/**
 * Result from scraping operation
 */
export interface ScraperResult {
  /** Whether the scraping was successful */
  success: boolean;
  /** Extracted symbol string in format "NSE:SYM1, BSE:SYM2, ..." */
  symbolString?: string;
  /** Number of symbols found */
  count: number;
  /** Error message if failed */
  error?: string;
  /** Additional metadata */
  metadata?: {
    /** URL that was scraped */
    sourceUrl: string;
    /** Timestamp of scraping */
    scrapedAt: Date;
    /** Site that was scraped */
    site: SupportedSite;
  };
}

/**
 * Message types for background communication
 */
export interface ScrapeWebsiteMessage {
  type: 'SCRAPE_WEBSITE';
  site: SupportedSite;
  tabId?: number;
}

export interface ScrapeWebsiteResponse {
  success: boolean;
  result?: ScraperResult;
  error?: string;
}

/**
 * Base scraper interface that all site scrapers must implement
 */
export interface SiteScraper {
  /** Detect if the current URL is this site */
  detect(url: string): boolean;

  /** Get site detection information */
  getSiteInfo(): SiteDetection;

  /** Process scraped data (convert tokens, clean up, etc.) */
  processData(rawData: any): Promise<string>;
}
