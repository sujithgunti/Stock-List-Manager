// Navigation-based scraping state
let allSymbols: string[] = [];
let currentPage = 1;
let totalPages = 1;
let scrapingInProgress = false;
let baseUrl = '';
let activeTabId: number | null = null;
let scrapeCallback: ((response: any) => void) | null = null;
let currentSiteType: 'screener' | 'chartink' | null = null;

export default defineBackground(() => {
  console.log('TradingView Symbol Manager Background Script loaded', { id: browser.runtime.id });

  // Optional: Handle extension-specific events
  globalThis.chrome.runtime.onInstalled.addListener((details: any) => {
    if (details.reason === 'install') {
      console.log('Extension installed for the first time');
    } else if (details.reason === 'update') {
      console.log('Extension updated');
    }
  });

  // Optional: Log storage changes for debugging
  globalThis.chrome.storage.onChanged.addListener((changes: any, namespace: string) => {
    if (namespace === 'local') {
      console.log('Storage changed:', Object.keys(changes));
    }
  });

  // Keep minimal message handling for future extensibility
  globalThis.chrome.runtime.onMessage.addListener((message: any, sender: any, sendResponse: any) => {
    console.log('Background received message:', message.type || 'unknown', 'from:', sender.tab?.url || 'popup');

    // Handle any future background-only operations here
    switch (message.type) {
      case 'PING':
        sendResponse({ success: true, message: 'Background script is running' });
        break;

      case 'SCRAPE_WEBSITE':
        // Handle website scraping requests with navigation-based approach
        handleNavigationBasedScraping(message, sender, sendResponse);
        return true; // Async response

      default:
        // Most operations now handled directly by Jotai atoms
        sendResponse({ success: false, error: 'Operation handled by atoms' });
        break;
    }

    return true; // Indicates we will send a response asynchronously
  });

  // Tab update listener - continues scraping when page loads
  globalThis.chrome.tabs.onUpdated.addListener((tabId: number, changeInfo: any, tab: any) => {
    if (scrapingInProgress && activeTabId === tabId && changeInfo.status === 'complete') {
      navigateAndScrape(tabId);
    }
  });

  // Navigation-based scraping handler
  async function handleNavigationBasedScraping(message: any, sender: any, sendResponse: any) {
    try {
      // Check if already scraping
      if (scrapingInProgress) {
        sendResponse({
          success: false,
          error: 'Scraping already in progress'
        });
        return;
      }

      // Get the active tab or use the provided tabId
      let tabId = message.tabId;

      if (!tabId) {
        const tabs = await globalThis.chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs.length === 0) {
          sendResponse({
            success: false,
            error: 'No active tab found'
          });
          return;
        }
        tabId = tabs[0].id;
      }

      // Get the tab URL for detection
      const tab = await globalThis.chrome.tabs.get(tabId);

      if (!tab.url) {
        sendResponse({
          success: false,
          error: 'Could not access tab URL'
        });
        return;
      }

      // Import scrapers dynamically
      const { screenerScraper } = await import('./popup/scrapers/screener.js');
      const { chartinkScraper } = await import('./popup/scrapers/chartink.js');

      // Detect which site we're on
      const isScreener = screenerScraper.detect(tab.url);
      const isChartink = chartinkScraper.detect(tab.url);

      if (!isScreener && !isChartink) {
        sendResponse({
          success: false,
          error: 'Unsupported website. Please navigate to Screener.in or ChartInk.com'
        });
        return;
      }

      // Select the appropriate scraper
      const activeScraper = isScreener ? screenerScraper : chartinkScraper;
      currentSiteType = isScreener ? 'screener' : 'chartink';

      console.log(`Detected site type: ${currentSiteType}`);

      // Initialize scraping state
      scrapingInProgress = true;
      allSymbols = [];
      currentPage = 1;
      activeTabId = tabId;
      scrapeCallback = sendResponse;

      // Get base URL without page parameter
      const url = new URL(tab.url);
      baseUrl = url.href.replace(/\/$/, '').split('?page=')[0];

      // Get total pages from current page - use site-specific function
      const getTotalPagesFunc = currentSiteType === 'screener' ? getTotalPages : getChartinkTotalPages;

      const results = await globalThis.chrome.scripting.executeScript({
        target: { tabId },
        func: getTotalPagesFunc
      });

      if (results && results[0] && results[0].result) {
        totalPages = results[0].result;
        console.log('Total pages detected:', totalPages);

        // Show start message
        await globalThis.chrome.scripting.executeScript({
          target: { tabId },
          func: insertMessagePopup,
          args: [`Starting extraction: ${totalPages} page(s) to scrape...`, 'blue']
        });

        // Start scraping
        navigateAndScrape(tabId);
      } else {
        // Fallback to 1 page
        totalPages = 1;
        navigateAndScrape(tabId);
      }

    } catch (error: any) {
      console.error('Website scraping error:', error);
      resetScrapingState();
      sendResponse({
        success: false,
        error: error.message || 'Unknown error during scraping'
      });
    }
  }

  // Navigate to pages and scrape symbols
  async function navigateAndScrape(tabId: number) {
    if (!scrapingInProgress) return;

    try {
      // Store the current list page URL to return to after conversions
      const currentListPageUrl = `${baseUrl}?page=${currentPage}&limit=50`;

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📄 Processing page ${currentPage} of ${totalPages}`);
      console.log(`🔗 Current list page URL: ${currentListPageUrl}`);

      // Show progress message
      if (totalPages > 1) {
        await globalThis.chrome.scripting.executeScript({
          target: { tabId },
          func: insertMessagePopup,
          args: [`Scraping page ${currentPage} of ${totalPages}...`, 'orange']
        });
      }

      // Scrape symbols from current page - use site-specific function
      const scrapeFuncToUse = currentSiteType === 'screener' ? scrapeSymbols : scrapeChartinkSymbols;

      const results = await globalThis.chrome.scripting.executeScript({
        target: { tabId },
        func: scrapeFuncToUse
      });

      if (results && results[0] && results[0].result) {
        // Handle different return formats for each site
        if (currentSiteType === 'screener') {
          // Screener.in returns string[] of symbols
          const rawSymbols: string[] = results[0].result;
          console.log(`🔍 Found ${rawSymbols.length} symbols on page:`, rawSymbols);

          // Process each symbol immediately: convert numeric ones, keep alphanumeric ones
          for (let i = 0; i < rawSymbols.length; i++) {
            const symbol = rawSymbols[i];

            console.log(`\n[${i + 1}/${rawSymbols.length}] Processing: ${symbol}`);

            if (/^\d+$/.test(symbol)) {
              // Numeric symbol - needs conversion
              console.log(`  ⚙️  Type: NUMERIC - needs conversion`);

              await globalThis.chrome.scripting.executeScript({
                target: { tabId },
                func: insertMessagePopup,
                args: [`Converting ${symbol}... (${i + 1}/${rawSymbols.length})`, 'blue']
              });

              const converted = await convertNumericSymbol(symbol, tabId);

              if (converted) {
                allSymbols.push(`${converted.exchange}:${converted.symbol}`);
                console.log(`  ✅ Converted ${symbol} → ${converted.exchange}:${converted.symbol}`);

                // Show success message
                await globalThis.chrome.scripting.executeScript({
                  target: { tabId },
                  func: insertMessagePopup,
                  args: [`✅ ${symbol} → ${converted.symbol}`, 'green']
                });
              } else {
                // BSE link not found - mark clearly as UNKNOWN
                console.error(`  ❌ Failed to extract BSE symbol for numeric ID: ${symbol}`);
                allSymbols.push(`UNKNOWN:${symbol}`);

                // Show error message
                await globalThis.chrome.scripting.executeScript({
                  target: { tabId },
                  func: insertMessagePopup,
                  args: [`❌ No BSE link for ${symbol}`, 'red']
                });
              }

              // NO NEED to navigate back - we used a background tab!
              // User stayed on the list page the entire time ✨

            } else {
              // Alphanumeric symbol - use as-is with NSE
              console.log(`  ⚙️  Type: ALPHANUMERIC - using as NSE:${symbol}`);
              allSymbols.push(`NSE:${symbol}`);
            }
          }
        } else if (currentSiteType === 'chartink') {
          // ChartInk returns { success: boolean, symbols: Array<{ symbol, exchange, metadata }> }
          const chartinkData = results[0].result;

          if (!chartinkData.success) {
            throw new Error(chartinkData.error || 'Failed to scrape ChartInk symbols');
          }

          const stocks = chartinkData.symbols;
          console.log(`🔍 Found ${stocks.length} symbols on page:`, stocks.map((s: any) => s.symbol));

          // Process ChartInk symbols - they're already formatted
          for (const stock of stocks) {
            const formattedSymbol = `${stock.exchange}:${stock.symbol}`;
            allSymbols.push(formattedSymbol);
            console.log(`  ✅ Added: ${formattedSymbol}`);
          }
        }

        console.log(`✅ Page ${currentPage} complete. Total symbols collected: ${allSymbols.length}`);
      }

      // Check if more pages to scrape
      if (currentPage < totalPages) {
        currentPage++;

        if (currentSiteType === 'chartink') {
          // ChartInk uses click-based pagination, not URL-based
          console.log(`🖱️ Clicking to navigate to page ${currentPage}...`);

          // Click the specific page number button on ChartInk
          const targetPage = currentPage;
          const clickResult = await globalThis.chrome.scripting.executeScript({
            target: { tabId },
            func: (pageNum: number) => {
              // Strategy 1: Click the specific page number button
              const buttons = document.querySelectorAll('button');
              for (const btn of buttons) {
                const text = btn.textContent?.trim();
                // Check if button text is exactly the page number
                if (text === String(pageNum)) {
                  console.log(`[ChartInk] Found page ${pageNum} button, clicking...`);
                  (btn as HTMLElement).click();
                  return { success: true, method: 'page-number' };
                }
              }

              // Strategy 2: Click "Next" button (contains fa-angles-right icon or "Next" text)
              for (const btn of buttons) {
                const hasNextIcon = btn.querySelector('.fa-angles-right');
                const hasNextText = btn.textContent?.includes('Next');
                if (hasNextIcon || hasNextText) {
                  console.log('[ChartInk] Found Next button, clicking...');
                  (btn as HTMLElement).click();
                  return { success: true, method: 'next-button' };
                }
              }

              console.warn('[ChartInk] No pagination button found');
              return { success: false, method: 'none' };
            },
            args: [targetPage]
          });

          const result = clickResult?.[0]?.result;
          if (result?.success) {
            console.log(`✅ Clicked ${result.method} to go to page ${currentPage}`);

            // Wait for table to update after click
            console.log(`⏳ Waiting for page ${currentPage} data to load...`);
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Continue scraping
            navigateAndScrape(tabId);
          } else {
            console.error('Failed to find pagination button on ChartInk');
            await finalizeScraping(tabId);
          }
        } else {
          // Screener.in uses URL-based pagination
          setTimeout(() => {
            globalThis.chrome.tabs.update(tabId, {
              url: `${baseUrl}?page=${currentPage}&limit=50`
            });
          }, 800);
        }
      } else {
        // All pages scraped - process results
        await finalizeScraping(tabId);
      }

    } catch (error: any) {
      console.error('Error during scraping:', error);
      resetScrapingState();
      if (scrapeCallback) {
        scrapeCallback({
          success: false,
          error: error.message || 'Scraping failed'
        });
      }
    }
  }

  // Convert numeric symbol ID to trading symbol by opening company page in BACKGROUND TAB
  async function convertNumericSymbol(numericId: string, _originalTabId: number): Promise<{ symbol: string; exchange: string } | null> {
    let backgroundTab: any = null;

    try {
      const companyUrl = `https://www.screener.in/company/${numericId}/`;

      console.log(`  🌐 Opening company page in BACKGROUND tab: ${companyUrl}`);

      // Create a new background tab (user won't see this!)
      backgroundTab = await globalThis.chrome.tabs.create({
        url: companyUrl,
        active: false  // KEY: Opens in background, user stays on list page!
      });

      console.log(`  🆔 Background tab created: ${backgroundTab.id}`);

      // Wait for page to load
      console.log(`  ⏳ Waiting 2.5 seconds for background page to load...`);
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Extract BSE/NSE links from the background tab
      console.log(`  🔎 Extracting BSE/NSE links from background tab ${backgroundTab.id}...`);
      const results = await globalThis.chrome.scripting.executeScript({
        target: { tabId: backgroundTab.id },
        func: extractExchangeLinks
      });

      if (results && results[0] && results[0].result) {
        const extracted = results[0].result;
        console.log(`  ✅ Successfully extracted: ${extracted.exchange}:${extracted.symbol}`);

        // Close the background tab
        console.log(`  🗑️  Closing background tab ${backgroundTab.id}`);
        await globalThis.chrome.tabs.remove(backgroundTab.id);
        backgroundTab = null;

        return extracted;
      }

      console.log(`  ❌ No BSE link found on company page`);

      // Close the background tab even on failure
      if (backgroundTab) {
        console.log(`  🗑️  Closing background tab ${backgroundTab.id}`);
        await globalThis.chrome.tabs.remove(backgroundTab.id);
        backgroundTab = null;
      }

      return null;
    } catch (error: any) {
      console.error(`  ❌ Error converting numeric symbol ${numericId}:`, error);

      // Clean up background tab if it was created
      if (backgroundTab) {
        try {
          console.log(`  🗑️  Cleaning up background tab ${backgroundTab.id}`);
          await globalThis.chrome.tabs.remove(backgroundTab.id);
        } catch (cleanupError) {
          console.error(`  ⚠️  Failed to close background tab:`, cleanupError);
        }
      }

      // Check if it's a rate limiting error
      if (error.message && (error.message.includes('429') || error.message.includes('Too Many Requests'))) {
        console.log(`  ⏸️  Rate limited detected! Waiting 5 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      return null;
    }
  }

  // Finalize scraping - return results
  async function finalizeScraping(tabId: number) {
    try {
      // allSymbols already contains formatted strings like "BSE:ACSTECH", "NSE:RELIANCE"
      // Just join them into a comma-separated string
      const symbolString = allSymbols.join(', ');

      // Show success message
      await globalThis.chrome.scripting.executeScript({
        target: { tabId },
        func: insertMessagePopup,
        args: [`Successfully extracted ${allSymbols.length} symbols from ${totalPages} page(s)!`, 'green']
      });

      // Return result to popup
      if (scrapeCallback) {
        scrapeCallback({
          success: true,
          result: {
            success: true,
            symbolString,
            count: allSymbols.length,
            metadata: {
              sourceUrl: baseUrl,
              scrapedAt: new Date(),
              site: currentSiteType || 'unknown',
              totalPages: totalPages
            }
          }
        });
      }

      // Reset state
      resetScrapingState();

    } catch (error: any) {
      console.error('Error finalizing scraping:', error);
      resetScrapingState();
      if (scrapeCallback) {
        scrapeCallback({
          success: false,
          error: error.message || 'Failed to process symbols'
        });
      }
    }
  }

  // Reset scraping state
  function resetScrapingState() {
    scrapingInProgress = false;
    allSymbols = [];
    currentPage = 1;
    totalPages = 1;
    baseUrl = '';
    activeTabId = null;
    scrapeCallback = null;
    currentSiteType = null;
  }
});

// ======================
// INJECTED FUNCTIONS
// ======================

// Function to scrape symbols from current page (injected into page)
function scrapeSymbols() {
  const anchors = document.querySelectorAll('a[href^="/company/"]');
  const symbols = Array.from(anchors)
    .map((anchor) => {
      const parts = anchor.getAttribute('href')!.split('/');
      return parts.length > 2 ? parts[2] : '';
    })
    .filter((symbol) => symbol); // Remove empty symbols
  return symbols;
}

// Function to get total pages (injected into page)
function getTotalPages() {
  // Method 1: Try data-page-info div
  const pageInfoDiv = document.querySelector('div[data-page-info]');
  if (pageInfoDiv) {
    const pageInfoText = pageInfoDiv.textContent || '';
    const totalPagesMatch = pageInfoText.match(/of (\d+)/);
    if (totalPagesMatch) {
      return parseInt(totalPagesMatch[1], 10);
    }
  }

  // Method 2: Try pagination links
  const paginationLinks = document.querySelectorAll('a[href*="page="]');
  let maxPage = 1;

  paginationLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href) {
      const match = href.match(/[?&]page=(\d+)/);
      if (match) {
        const pageNum = parseInt(match[1], 10);
        if (pageNum > maxPage) {
          maxPage = pageNum;
        }
      }
    }
  });

  return maxPage;
}

// Function to show popup message (injected into page)
function insertMessagePopup(message: string, color: string) {
  const messageDiv = document.createElement('div');
  messageDiv.innerText = message;
  messageDiv.style.position = 'fixed';
  messageDiv.style.bottom = '10px';
  messageDiv.style.right = '10px';
  messageDiv.style.backgroundColor = color;
  messageDiv.style.color = 'white';
  messageDiv.style.padding = '10px';
  messageDiv.style.borderRadius = '5px';
  messageDiv.style.zIndex = '10000';
  messageDiv.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
  document.body.appendChild(messageDiv);
  setTimeout(() => {
    if (document.body.contains(messageDiv)) {
      document.body.removeChild(messageDiv);
    }
  }, 3000);
}

// Function to extract trading symbol from BSE link ONLY (injected into page)
function extractExchangeLinks(): { symbol: string; exchange: string } | null {
  console.log('[extractExchangeLinks] Starting BSE link extraction...');

  // ONLY extract from BSE link - NO fallbacks to NSE or page title
  const bseLinks = document.querySelectorAll('a[href*="bseindia.com/stock-share-price/"]');
  console.log(`[extractExchangeLinks] Found ${bseLinks.length} BSE link(s) on page`);

  for (const link of Array.from(bseLinks)) {
    const href = link.getAttribute('href');
    if (!href) {
      console.log('[extractExchangeLinks] Skipping link with no href');
      continue;
    }

    console.log(`[extractExchangeLinks] Checking URL: ${href}`);

    // BSE URL Pattern: /stock-share-price/{company-name}/{SYMBOL}/{numeric-id}/
    // Example: https://www.bseindia.com/stock-share-price/acs-technologies-ltd/ACSTECH/530745/
    // We want to extract "ACSTECH" from the URL

    // Regex explanation:
    // /stock-share-price/ - literal match
    // [^\/]+ - company name (any chars except /)
    // / - separator
    // ([A-Z0-9-]+) - CAPTURED GROUP = Trading symbol (uppercase, numbers, dashes)
    // / - separator
    // \d+ - numeric ID
    // \/? - optional trailing slash
    // $ - end of string
    const match = href.match(/\/stock-share-price\/[^\/]+\/([A-Z0-9-]+)\/\d+\/?$/);

    if (match && match[1]) {
      console.log(`[extractExchangeLinks] ✅ MATCH! Extracted symbol: ${match[1]}`);
      console.log(`[extractExchangeLinks] Full URL: ${href}`);
      return {
        symbol: match[1],  // The trading symbol (e.g., "ACSTECH")
        exchange: 'BSE'
      };
    } else {
      console.log(`[extractExchangeLinks] ❌ No match for this URL (regex failed)`);
    }
  }

  // No BSE link found - return null (don't fallback to anything else)
  console.warn('[extractExchangeLinks] ❌ No BSE link found on this page');
  return null;
}

// ======================
// CHARTINK FUNCTIONS
// ======================

// Function to scrape symbols from ChartInk screener (injected into page)
function scrapeChartinkSymbols() {
  console.log('[scrapeChartinkSymbols] Starting ChartInk extraction...');

  const results: Array<{
    symbol: string;
    exchange: string;
    metadata?: any;
  }> = [];

  // ChartInk uses a generic table structure with data-column attributes
  // Table structure: <table><tbody><tr><td data-column="2">Symbol</td></tr></tbody></table>
  const rows = document.querySelectorAll('table tbody tr');

  if (rows.length === 0) {
    console.warn('[scrapeChartinkSymbols] No table rows found');
    return { success: false, error: 'No stock data found on this ChartInk page.' };
  }

  console.log(`[scrapeChartinkSymbols] Found ${rows.length} rows`);

  rows.forEach((row, index) => {
    try {
      // Get all td elements in the row
      const allTds = row.querySelectorAll('td');

      // ChartInk table structure (0-indexed):
      // 0: Sr. (serial number)
      // 1: Stock Name
      // 2: Symbol ← THIS IS WHAT WE NEED
      // 3: Links (P&F | F.A)
      // 4: % Change
      // 5: Price
      // 6: Volume

      if (allTds.length < 3) {
        console.warn(`[scrapeChartinkSymbols] Row ${index + 1}: Not enough columns (${allTds.length})`);
        return;
      }

      // Symbol is in the 3rd column (index 2)
      const symbolCell = allTds[2];
      const symbolElement = symbolCell.querySelector('a');

      if (symbolElement) {
        const symbol = symbolElement.textContent?.trim().toUpperCase();

        if (symbol && symbol.length > 0) {
          // Extract metadata from other columns
          const stockNameElement = allTds[1]?.querySelector('a');
          const changeElement = allTds[4];
          const priceElement = allTds[5];
          const volumeElement = allTds[6];

          // ChartInk uses NSE symbols by default
          results.push({
            symbol: symbol,
            exchange: 'NSE',
            metadata: {
              stockName: stockNameElement?.textContent?.trim() || '',
              price: priceElement?.textContent?.trim() || '',
              change: changeElement?.textContent?.trim() || '',
              volume: volumeElement?.textContent?.trim() || ''
            }
          });

          console.log(`[scrapeChartinkSymbols] Row ${index + 1}: ${symbol}`);
        } else {
          console.warn(`[scrapeChartinkSymbols] Row ${index + 1}: Empty symbol text`);
        }
      } else {
        console.warn(`[scrapeChartinkSymbols] Row ${index + 1}: No <a> tag found in symbol cell`);
      }
    } catch (error) {
      console.error(`[scrapeChartinkSymbols] Error processing row ${index}:`, error);
    }
  });

  console.log(`[scrapeChartinkSymbols] Successfully extracted ${results.length} symbols`);

  return {
    success: true,
    symbols: results
  };
}

// Function to get total pages from ChartInk (injected into page)
function getChartinkTotalPages() {
  console.log('[getChartinkTotalPages] Detecting pagination...');

  // ChartInk shows pagination as numbered buttons
  // The pagination has buttons like: « 1 2 3 ... 18 »
  // Also shows "Page # X" dropdown and "349 stocks" text

  let maxPage = 1;

  // Pattern 1: Calculate from "X stocks" text
  // Look for text like "349 stocks" and calculate pages (20 per page)
  const bodyText = document.body.textContent || '';
  const stocksMatch = bodyText.match(/(\d+)\s+stocks?/i);
  if (stocksMatch) {
    const totalStocks = parseInt(stocksMatch[1], 10);
    const stocksPerPage = 20; // ChartInk shows 20 stocks per page
    const calculatedPages = Math.ceil(totalStocks / stocksPerPage);
    console.log(`[getChartinkTotalPages] Found "${stocksMatch[0]}" - calculating ${calculatedPages} pages (${totalStocks} stocks / ${stocksPerPage} per page)`);
    if (calculatedPages > 1) {
      console.log(`[getChartinkTotalPages] ✅ Calculated ${calculatedPages} pages from stock count`);
      return calculatedPages;
    }
  }

  // Pattern 2: Look for page number buttons/links
  // Scan all button and link elements for numbers
  const allElements = document.querySelectorAll('button, a');
  console.log(`[getChartinkTotalPages] Scanning ${allElements.length} buttons/links for page numbers...`);

  allElements.forEach(element => {
    const text = element.textContent?.trim();
    // Check if it's a pure number (page number)
    if (text && /^\d+$/.test(text)) {
      const pageNum = parseInt(text, 10);
      if (pageNum > maxPage && pageNum < 100) { // Sanity check: page numbers should be reasonable
        maxPage = pageNum;
        console.log(`[getChartinkTotalPages] Found page button: ${pageNum}`);
      }
    }
  });

  if (maxPage > 1) {
    console.log(`[getChartinkTotalPages] ✅ Found ${maxPage} pages from pagination buttons`);
    return maxPage;
  }

  // Pattern 3: Check for "Page # X" dropdown
  const pageDropdown = document.querySelector('select');
  if (pageDropdown) {
    console.log('[getChartinkTotalPages] Found page dropdown, checking options...');
    const options = pageDropdown.querySelectorAll('option');
    options.forEach(option => {
      const text = option.textContent?.trim();
      const value = option.value;

      // Check both text content and value
      const numText = text && /^\d+$/.test(text) ? parseInt(text, 10) : null;
      const numValue = value && /^\d+$/.test(value) ? parseInt(value, 10) : null;

      const pageNum = numText || numValue;
      if (pageNum && pageNum > maxPage && pageNum < 100) {
        maxPage = pageNum;
        console.log(`[getChartinkTotalPages] Found dropdown option: ${pageNum}`);
      }
    });

    if (maxPage > 1) {
      console.log(`[getChartinkTotalPages] ✅ Found ${maxPage} pages from dropdown`);
      return maxPage;
    }
  }

  // Pattern 4: Check for "Next" or "»" button (fallback)
  let hasNextButton = false;
  allElements.forEach(element => {
    const text = element.textContent?.trim();
    if (text === '»' || text === 'Next' || text === '›' || text === '→') {
      hasNextButton = true;
    }
  });

  if (hasNextButton) {
    console.log('[getChartinkTotalPages] ⚠️ Found Next button but no page numbers, defaulting to 1 page');
  } else {
    console.log('[getChartinkTotalPages] No pagination detected, assuming single page');
  }

  return 1;
}

