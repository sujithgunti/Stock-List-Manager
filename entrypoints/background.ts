export default defineBackground(() => {
  console.log('TradingView Symbol Manager Background Script loaded', { id: browser.runtime.id });

  // Simplified background script for Jotai-based state management
  // Most state operations now happen directly through Jotai atoms

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

      default:
        // Most operations now handled directly by Jotai atoms
        sendResponse({ success: false, error: 'Operation handled by atoms' });
        break;
    }

    return true; // Indicates we will send a response asynchronously
  });
});
