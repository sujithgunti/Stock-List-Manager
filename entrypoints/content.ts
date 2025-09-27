import React from 'react';
import { createRoot } from 'react-dom/client';
import { defineContentScript } from '#imports';
import FloatingWidget from './content/FloatingWidget';

export default defineContentScript({
  matches: ['*://*.tradingview.com/*', '*://in.tradingview.com/*'],
  main(ctx) {
    console.log('TradingView Symbol Manager - Content script loaded');

    // Initialize the floating widget when the page is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeWidget);
    } else {
      initializeWidget();
    }
  },
});

let widget: HTMLElement | null = null;
let widgetRoot: any = null;
let isWidgetVisible = false;

// State persistence keys
const WIDGET_STATE = {
  visible: 'tv-widget-visible',
  selectedListId: 'tv-widget-selected-list',
  searchTerm: 'tv-widget-search'
};

// Save widget state to sessionStorage
function saveWidgetState() {
  try {
    sessionStorage.setItem(WIDGET_STATE.visible, isWidgetVisible.toString());
    console.log('Widget state saved:', isWidgetVisible);
  } catch (e) {
    console.warn('Failed to save widget state:', e);
  }
}

// Restore widget state from sessionStorage
function restoreWidgetState(): boolean {
  try {
    const savedState = sessionStorage.getItem(WIDGET_STATE.visible);
    const shouldShow = savedState === 'true';
    console.log('Restoring widget state:', shouldShow);
    return shouldShow;
  } catch (e) {
    console.warn('Failed to restore widget state:', e);
    return false;
  }
}

// Save detailed widget state (list selection, search term)
function saveDetailedWidgetState(selectedListId?: string, searchTerm?: string) {
  try {
    if (selectedListId !== undefined) {
      sessionStorage.setItem(WIDGET_STATE.selectedListId, selectedListId);
    }
    if (searchTerm !== undefined) {
      sessionStorage.setItem(WIDGET_STATE.searchTerm, searchTerm);
    }
  } catch (e) {
    console.warn('Failed to save detailed widget state:', e);
  }
}

// Get detailed widget state
function getDetailedWidgetState() {
  try {
    return {
      selectedListId: sessionStorage.getItem(WIDGET_STATE.selectedListId) || '',
      searchTerm: sessionStorage.getItem(WIDGET_STATE.searchTerm) || ''
    };
  } catch (e) {
    console.warn('Failed to get detailed widget state:', e);
    return { selectedListId: '', searchTerm: '' };
  }
}


function initializeWidget() {
  // Check if we're on a TradingView chart page
  if (window.location.pathname.includes('/chart/') ||
      window.location.pathname.includes('/symbols/') ||
      document.querySelector('[data-name="legend-source-item"]')) {

    console.log('TradingView chart page detected, initializing widget...');

    // Create shadow root container for React widget
    const shadowHost = document.createElement('div');
    shadowHost.id = 'tradingview-symbol-manager-shadow-host';
    shadowHost.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 9999;
      display: none;
      opacity: 0;
      transform: translateY(-10px);
      transition: opacity 0.2s ease-out, transform 0.2s ease-out;
    `;

    // Create shadow root to isolate styles
    const shadowRoot = shadowHost.attachShadow({ mode: 'open' });

    // Create container inside shadow root
    const container = document.createElement('div');
    container.className = 'dark'; // Enable dark mode
    shadowRoot.appendChild(container);

    // Add styles to shadow root
    const styleSheet = document.createElement('style');
    styleSheet.textContent = getWidgetStyles();
    shadowRoot.appendChild(styleSheet);

    document.body.appendChild(shadowHost);
    widget = shadowHost;

    // Create React root and render component
    widgetRoot = createRoot(container);
    renderWidget();

    // Add toggle button
    createToggleButton();

    // Add keyboard shortcuts
    addKeyboardShortcuts();

    // Listen for storage updates
    addStorageUpdateListener();

    // Restore widget state if it was previously visible
    const shouldShowWidget = restoreWidgetState();
    if (shouldShowWidget) {
      console.log('Restoring widget visibility...');
      setTimeout(() => {
        showWidget();
      }, 50); // Ultra-fast restoration for seamless experience
    }
  }
}

function renderWidget() {
  if (!widgetRoot) return;

  const savedState = getDetailedWidgetState();

  widgetRoot.render(
    React.createElement(FloatingWidget, {
      onClose: hideWidget,
      onMinimize: hideWidget,
      onStateChange: saveDetailedWidgetState,
      initialState: savedState,
    })
  );
}

function createToggleButton() {
  const toggleButton = document.createElement('button');
  toggleButton.id = 'tradingview-symbol-manager-toggle';
  toggleButton.innerHTML = '📊';
  toggleButton.title = 'Toggle Symbol Manager (Ctrl+Shift+S)';
  toggleButton.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    width: 40px;
    height: 40px;
    background: #2962FF;
    border: none;
    border-radius: 8px;
    color: white;
    font-size: 18px;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(41, 98, 255, 0.3);
    transition: all 0.2s ease;
  `;

  toggleButton.addEventListener('mouseenter', () => {
    toggleButton.style.background = '#1E53E5';
    toggleButton.style.transform = 'scale(1.05)';
  });

  toggleButton.addEventListener('mouseleave', () => {
    toggleButton.style.background = '#2962FF';
    toggleButton.style.transform = 'scale(1)';
  });

  toggleButton.addEventListener('click', toggleWidget);
  document.body.appendChild(toggleButton);
}

function addKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'S') {
      e.preventDefault();
      toggleWidget();
    } else if (e.key === 'Escape' && isWidgetVisible) {
      e.preventDefault();
      hideWidget();
    }
  });
}

function addStorageUpdateListener() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'STORAGE_UPDATED') {
      console.log('Content script received storage update:', message.changes);
      // Re-render the widget to refresh data
      renderWidget();
      sendResponse({ success: true });
    }
    return true;
  });
}

function toggleWidget() {
  if (isWidgetVisible) {
    hideWidget();
  } else {
    showWidget();
  }
}

function showWidget() {
  if (widget) {
    widget.style.display = 'block';
    // Trigger smooth appearance animation
    requestAnimationFrame(() => {
      widget.style.opacity = '1';
      widget.style.transform = 'translateY(0)';
    });
    isWidgetVisible = true;
    saveWidgetState(); // Save state when showing
  }
}

function hideWidget() {
  if (widget) {
    // Trigger smooth disappearance animation
    widget.style.opacity = '0';
    widget.style.transform = 'translateY(-10px)';
    // Hide after animation completes
    setTimeout(() => {
      widget.style.display = 'none';
    }, 200);
    isWidgetVisible = false;
    saveWidgetState(); // Save state when hiding
  }
}

function getWidgetStyles(): string {
  // Complete CSS-in-JS styling to match main popup design
  return `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    :host {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    /* Reset */
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    /* Color variables (matching tailwind.config.js) */
    .dark {
      /* TradingView inspired colors */
      --primary-50: #eff6ff;
      --primary-100: #dbeafe;
      --primary-200: #bfdbfe;
      --primary-300: #93c5fd;
      --primary-400: #60a5fa;
      --primary-500: #2962FF;
      --primary-600: #2563eb;

      --background: #1E222D;
      --background-card: #2A2E39;
      --background-muted: #131722;

      --foreground: #D1D4DC;
      --foreground-muted: #9598A1;
      --foreground-subtle: #6B7280;

      --success: #4CAF50;
      --error: #F44336;
      --warning: #FF9800;

      --border: #363A45;
      --border-light: #434651;
    }

    /* Layout utilities */
    .w-80 { width: 20rem; }
    .max-h-96 { max-height: 24rem; }
    .max-h-80 { max-height: 20rem; }
    .h-6 { height: 1.5rem; }
    .w-6 { width: 1.5rem; }
    .h-5 { height: 1.25rem; }
    .w-5 { width: 1.25rem; }
    .h-3 { height: 0.75rem; }
    .w-3 { width: 0.75rem; }
    .min-w-0 { min-width: 0; }

    /* Padding/Margin */
    .p-0 { padding: 0; }
    .p-2 { padding: 0.5rem; }
    .p-3 { padding: 0.75rem; }
    .p-4 { padding: 1rem; }
    .px-4 { padding-left: 1rem; padding-right: 1rem; }
    .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
    .py-8 { padding-top: 2rem; padding-bottom: 2rem; }
    .pb-4 { padding-bottom: 1rem; }
    .pt-0 { padding-top: 0; }
    .pt-1 { padding-top: 0.25rem; }
    .pr-8 { padding-right: 2rem; }
    .mt-1 { margin-top: 0.25rem; }
    .mt-2 { margin-top: 0.5rem; }
    .mb-1 { margin-bottom: 0.25rem; }

    /* Flexbox */
    .flex { display: flex; }
    .flex-1 { flex: 1 1 0%; }
    .flex-col { flex-direction: column; }
    .flex-row { flex-direction: row; }
    .flex-wrap { flex-wrap: wrap; }
    .flex-shrink-0 { flex-shrink: 0; }
    .items-center { align-items: center; }
    .justify-between { justify-content: space-between; }
    .gap-1 { gap: 0.25rem; }
    .gap-2 { gap: 0.5rem; }
    .gap-3 { gap: 0.75rem; }

    /* Spacing */
    .space-y-1 > * + * { margin-top: 0.25rem; }
    .space-y-2 > * + * { margin-top: 0.5rem; }
    .space-y-3 > * + * { margin-top: 0.75rem; }

    /* Text styles */
    .text-xs { font-size: 0.75rem; line-height: 1rem; }
    .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
    .font-medium { font-weight: 500; }
    .font-semibold { font-weight: 600; }
    .text-center { text-align: center; }
    .truncate {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Colors */
    .bg-background { background-color: var(--background); }
    .bg-background-card { background-color: var(--background-card); }
    .bg-background-muted { background-color: var(--background-muted); }
    .hover\\:bg-background-muted\\/80:hover { background-color: var(--background-muted); opacity: 0.8; }
    .text-foreground { color: var(--foreground); }
    .text-muted-foreground { color: var(--foreground-muted); }
    .text-destructive { color: var(--error); }
    .text-error { color: var(--error); }
    .border { border: 1px solid var(--border); }
    .border-muted { border-color: var(--background-muted); }

    /* Border and shadow */
    .rounded-md { border-radius: 0.375rem; }
    .rounded-lg { border-radius: 0.5rem; }
    .shadow-lg {
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3);
    }

    /* Overflow */
    .overflow-y-auto { overflow-y: auto; }

    /* Display & Position */
    .relative { position: relative; }
    .absolute { position: absolute; }
    .cursor-pointer { cursor: pointer; }
    .right-1 { right: 0.25rem; }
    .top-1\\/2 { top: 50%; }
    .-translate-y-1\\/2 { transform: translateY(-50%); }

    /* Transitions & Opacity */
    .transition-colors {
      transition-property: color, background-color, border-color;
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      transition-duration: 150ms;
    }
    .transition-opacity {
      transition-property: opacity;
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      transition-duration: 150ms;
    }
    .opacity-0 { opacity: 0; }
    .group:hover .group-hover\\:opacity-100 { opacity: 1; }

    /* Card styles */
    .card {
      border-radius: 0.5rem;
      border: 1px solid var(--border);
      background: var(--background-card);
      color: var(--foreground);
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2);
    }

    /* Button styles */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.15s ease-in-out;
      border: 1px solid transparent;
      cursor: pointer;
      padding: 0.5rem 1rem;
      white-space: nowrap;
    }

    .btn-default {
      background: var(--primary-500);
      color: white;
    }

    .btn-ghost {
      background: transparent;
      color: var(--foreground);
      border: none;
    }

    .btn-ghost:hover {
      background: var(--background-card);
    }

    .btn-outline {
      background: transparent;
      border: 1px solid var(--border);
      color: var(--foreground);
    }

    .btn-outline:hover {
      background: var(--background-card);
    }

    .btn-sm {
      font-size: 0.75rem;
      padding: 0.25rem 0.75rem;
      height: 2rem;
    }

    /* Badge styles */
    .badge {
      display: inline-flex;
      align-items: center;
      border-radius: 0.375rem;
      padding: 0.125rem 0.625rem;
      font-size: 0.75rem;
      font-weight: 600;
      line-height: 1rem;
      border: 1px solid transparent;
    }

    .badge-default {
      background: var(--primary-500);
      color: white;
    }

    .badge-secondary {
      background: var(--background-card);
      color: var(--foreground);
    }

    /* NSE/BSE Badge Colors (matching main popup) */
    .badge-nse {
      background: rgba(41, 98, 255, 0.2);
      color: #60a5fa;
      border: 1px solid rgba(41, 98, 255, 0.3);
    }

    .badge-bse {
      background: rgba(255, 152, 0, 0.2);
      color: #FF9800;
      border: 1px solid rgba(255, 152, 0, 0.3);
    }

    /* Input styles */
    .input {
      display: flex;
      height: 2.25rem;
      width: 100%;
      border-radius: 0.375rem;
      border: 1px solid var(--border);
      background: var(--background);
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
      color: var(--foreground);
      transition: all 0.15s ease-in-out;
    }

    .input::placeholder {
      color: var(--foreground-muted);
    }

    .input:focus {
      outline: none;
      ring: 1px solid var(--primary-500);
      border-color: var(--primary-500);
    }

    /* Hover effects for symbol rows */
    .hover\\:bg-accent:hover {
      background: var(--background-card);
    }

    /* Group hover effects */
    .group:hover .group-hover\\:opacity-100 {
      opacity: 1;
    }

    /* Custom Dark Theme Scrollbar */
    ::-webkit-scrollbar {
      width: 8px;
    }

    ::-webkit-scrollbar-track {
      background: var(--background-muted);
      border-radius: 4px;
    }

    ::-webkit-scrollbar-thumb {
      background: var(--border);
      border-radius: 4px;
      border: 1px solid var(--background-muted);
    }

    ::-webkit-scrollbar-thumb:hover {
      background: var(--border-light);
    }

    ::-webkit-scrollbar-corner {
      background: var(--background-muted);
    }

    /* Firefox scrollbar support */
    * {
      scrollbar-width: thin;
      scrollbar-color: var(--border) var(--background-muted);
    }
  `;
}
