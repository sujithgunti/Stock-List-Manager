import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'TradingView Symbol Manager',
    description: 'Manage stock symbol lists with CSV upload and text input support for TradingView',
    version: '1.0.0',
    action: {
      default_title: 'TradingView Symbol Manager'
    },
    // Permissions:
    // - storage: For saving symbol lists
    // - scripting: For chrome.scripting.executeScript (website extraction)
    // - activeTab: Grants access to current tab when user clicks extension (privacy-friendly)
    permissions: ['storage', 'scripting', 'activeTab'],
    // Host permissions:
    // - TradingView: For auto-injecting floating widget
    // - Screener.in: Required for background tab creation and script injection during symbol extraction
    host_permissions: [
      '*://*.tradingview.com/*',
      '*://in.tradingview.com/*',
      '*://*.screener.in/*'  // Required for background tab access!
    ]
  }
});
