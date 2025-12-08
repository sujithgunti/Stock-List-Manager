import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'TradeFlow',
    description: 'TradeFlow - The ultimate stock symbol manager for TradingView with CSV upload and smart web extraction',
    version: '1.0.0',
    action: {
      default_title: 'TradeFlow'
    },
    // Permissions:
    // - storage: For saving symbol lists
    // - scripting: For chrome.scripting.executeScript (website extraction)
    // - activeTab: Grants access to current tab when user clicks extension (privacy-friendly)
    permissions: ['storage', 'scripting', 'activeTab'],
    // Host permissions:
    // - TradingView: For auto-injecting floating widget
    // - Screener.in: Required for background tab creation and script injection during symbol extraction
    // - ChartInk.com: For ChartInk screener extraction
    host_permissions: [
      '*://*.tradingview.com/*',
      '*://in.tradingview.com/*',
      '*://*.screener.in/*',  // Required for background tab access!
      '*://*.chartink.com/*'  // ChartInk screener extraction
    ],
    icons: {
      '16': '/icon/16.png',
      '32': '/icon/32.png',
      '48': '/icon/48.png',
      '96': '/icon/96.png',
      '128': '/icon/128.png'
    }
  }
});
