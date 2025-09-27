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
    permissions: ['storage'],
    host_permissions: ['*://*.tradingview.com/*', '*://in.tradingview.com/*'],
    content_scripts: [
      {
        matches: ['*://*.tradingview.com/*', '*://in.tradingview.com/*'],
        js: ['content-scripts/content.js'],
        run_at: 'document_end'
      }
    ]
  }
});
