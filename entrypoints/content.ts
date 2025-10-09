import React from 'react';
import ReactDOM from 'react-dom/client';
import { defineContentScript } from '#imports';
import FloatingWidget from './content/FloatingWidget';

export default defineContentScript({
  matches: ['*://*.tradingview.com/*', '*://in.tradingview.com/*'],

  main(ctx) {
    console.log('🚀 TradingView Symbol Manager - Content script loaded on:', window.location.href);

    // Enhanced TradingView page detection
    const isTradingViewPage =
      window.location.hostname.includes('tradingview.com') ||
      window.location.pathname.includes('/chart/') ||
      window.location.pathname.includes('/symbols/') ||
      document.querySelector('[data-name="legend-source-item"]') ||
      document.querySelector('[data-name="header"]') ||
      document.title.includes('TradingView');

    if (!isTradingViewPage) {
      console.log('❌ Not a TradingView page, skipping widget initialization');
      return;
    }

    console.log('✅ TradingView page detected, initializing widget...');

    let isWidgetVisible = false;
    let widget: HTMLElement | null = null;
    let widgetRoot: any = null;

    // State persistence using sessionStorage
    const WIDGET_STATE = {
      visible: 'tv-widget-visible',
      selectedListId: 'tv-widget-selected-list',
      searchTerm: 'tv-widget-search'
    };

    function saveWidgetState() {
      try {
        sessionStorage.setItem(WIDGET_STATE.visible, isWidgetVisible.toString());
        console.log('Widget state saved:', isWidgetVisible);
      } catch (e) {
        console.warn('Failed to save widget state:', e);
      }
    }

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

    function toggleWidget() {
      console.log('🔄 toggleWidget called, isWidgetVisible:', isWidgetVisible);

      if (isWidgetVisible) {
        console.log('🔽 Hiding widget...');
        hideWidget();
      } else {
        console.log('🔼 Showing widget...');
        showWidget();
      }
    }

    function showWidget() {
      console.log('🔼 showWidget called, widget exists:', !!widget);

      if (widget) {
        widget.style.display = 'block';
        // Trigger smooth appearance animation
        requestAnimationFrame(() => {
          if (widget) {
            widget.style.opacity = '1';
            widget.style.transform = 'translateY(0)';
            console.log('✅ Widget animation applied');
          }
        });
        isWidgetVisible = true;
        saveWidgetState();
        console.log('✅ Widget is now visible');
      } else {
        console.error('❌ Cannot show widget - widget element not found');
      }
    }

    function hideWidget() {
      console.log('🔽 hideWidget called');
      if (widget) {
        // Trigger smooth disappearance animation
        widget.style.opacity = '0';
        widget.style.transform = 'translateY(-10px)';
        // Hide after animation completes
        setTimeout(() => {
          if (widget) {
            widget.style.display = 'none';
          }
        }, 200);
        isWidgetVisible = false;
        saveWidgetState();
        console.log('✅ Widget is now hidden');
      }
    }

    function renderWidget() {
      console.log('🎨 renderWidget called, widgetRoot exists:', !!widgetRoot);

      if (!widgetRoot) {
        console.error('❌ renderWidget: No widgetRoot found');
        return;
      }

      try {
        const savedState = getDetailedWidgetState();
        console.log('🔄 renderWidget: Saved state:', savedState);

        const element = React.createElement(FloatingWidget, {
          onClose: () => {
            console.log('🔽 Widget close requested');
            hideWidget();
          },
          onMinimize: () => {
            console.log('🔽 Widget minimize requested');
            hideWidget();
          },
          onStateChange: saveDetailedWidgetState,
          initialState: savedState,
        });

        console.log('🔄 renderWidget: React element created');

        widgetRoot.render(element);
        console.log('✅ renderWidget: React component rendered successfully');

      } catch (error) {
        console.error('❌ renderWidget: Error rendering React component:', error);
        console.error('❌ Stack trace:', error.stack);

        // Fallback: render a simple error message
        try {
          const errorElement = React.createElement('div', {
            style: {
              padding: '20px',
              background: '#F44336',
              color: 'white',
              borderRadius: '8px',
              fontFamily: 'Inter, sans-serif',
              textAlign: 'center'
            }
          },
            React.createElement('div', { style: { fontSize: '16px', marginBottom: '10px' } }, '⚠️ Component Error'),
            React.createElement('div', { style: { fontSize: '12px', opacity: 0.9 } }, error.message),
            React.createElement('div', { style: { fontSize: '10px', marginTop: '10px', opacity: 0.7 } }, 'Check console for details')
          );

          widgetRoot.render(errorElement);
          console.log('⚠️ renderWidget: Error message rendered');
        } catch (fallbackError) {
          console.error('❌ renderWidget: Even error rendering failed:', fallbackError);
        }
      }
    }

    function initializeWidget() {
      console.log('🎯 initializeWidget called');

      try {
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
        container.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        shadowRoot.appendChild(container);

        // Add complete styles to shadow root
        const styleSheet = document.createElement('style');
        styleSheet.textContent = getWidgetStyles();
        shadowRoot.appendChild(styleSheet);

        document.body.appendChild(shadowHost);
        widget = shadowHost;

        // Create React root and render component
        widgetRoot = ReactDOM.createRoot(container);
        renderWidget();

        console.log('✅ Widget initialized successfully');

      } catch (error) {
        console.error('❌ Failed to initialize widget:', error);
        console.error('❌ Stack trace:', error.stack);
      }
    }

    function createToggleButton() {
      console.log('🔘 Creating toggle button...');

      // Remove existing button if it exists
      const existingButton = document.getElementById('tradingview-symbol-manager-toggle');
      if (existingButton) {
        existingButton.remove();
        console.log('🗑️ Removed existing toggle button');
      }

      const toggleButton = document.createElement('button');
      toggleButton.id = 'tradingview-symbol-manager-toggle';
      toggleButton.innerHTML = '📊';
      toggleButton.title = 'Click to open Symbol Manager (Ctrl+Shift+S)';
      toggleButton.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        width: 48px;
        height: 48px;
        background: #2962FF;
        border: 2px solid #ffffff;
        border-radius: 12px;
        color: white;
        font-size: 20px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(41, 98, 255, 0.4);
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: system-ui, -apple-system, sans-serif;
      `;

      toggleButton.addEventListener('mouseenter', () => {
        toggleButton.style.background = '#1E53E5';
        toggleButton.style.transform = 'scale(1.05)';
      });

      toggleButton.addEventListener('mouseleave', () => {
        toggleButton.style.background = '#2962FF';
        toggleButton.style.transform = 'scale(1)';
      });

      toggleButton.addEventListener('click', (e) => {
        console.log('🔘 Toggle button clicked!');
        e.preventDefault();
        e.stopPropagation();
        toggleWidget();
      });

      document.body.appendChild(toggleButton);
      console.log('✅ Toggle button added to page');
    }

    function addKeyboardShortcuts() {
      ctx.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'S') {
          e.preventDefault();
          toggleWidget();
        } else if (e.key === 'Escape' && isWidgetVisible) {
          e.preventDefault();
          toggleWidget();
        }
      });
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
          --warning: #ffd700;
          --warning-orange: #FF9800;

          --border: #363A45;
          --border-light: #434651;

          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: var(--foreground);
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
        .text-warning { color: var(--warning); }
        .border { border: 1px solid var(--border); }
        .border-muted { border-color: var(--background-muted); }

        /* Star button styles */
        .star-button {
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .star-button:hover {
          transform: scale(1.1);
        }

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

        /* Dialog styles */
        .dialog-backdrop {
          position: fixed;
          inset: 0;
          z-index: 50;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fade-in 0.2s ease-out;
        }

        .dialog-content-wrapper {
          animation: slide-in 0.3s ease-out;
        }

        .dialog-content {
          position: relative;
          background: var(--background-card);
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3);
          max-width: 28rem;
          width: 90%;
          max-height: 80vh;
          overflow: hidden;
          margin: 1rem;
        }

        .dialog-header {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--border);
        }

        .dialog-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--foreground);
          margin: 0;
        }

        .dialog-description {
          font-size: 0.875rem;
          color: var(--foreground-muted);
          margin-top: 0.25rem;
        }

        .dialog-description strong {
          color: var(--foreground);
          font-weight: 500;
        }

        .dialog-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid var(--border);
        }

        .w-full {
          width: 100%;
        }

        /* MultiListSelector styles */
        .multi-list-selector-body {
          padding: 1rem 1.5rem;
          max-height: 50vh;
          overflow-y: auto;
        }

        .list-group {
          margin-bottom: 1rem;
        }

        .list-group:last-child {
          margin-bottom: 0;
        }

        .list-group-title {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--foreground-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
        }

        .list-group-items {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .list-checkbox-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          border-radius: 0.375rem;
          background: var(--background-muted);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .list-checkbox-item:hover:not(.disabled) {
          background: var(--background);
        }

        .list-checkbox-item.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .checkbox-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .checkbox-input {
          width: 1rem;
          height: 1rem;
          cursor: pointer;
          accent-color: var(--primary-500);
        }

        .checkbox-input:disabled {
          cursor: not-allowed;
        }

        .list-info {
          flex: 1;
          min-width: 0;
        }

        .list-name-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .list-color-dot {
          width: 0.75rem;
          height: 0.75rem;
          border-radius: 9999px;
          flex-shrink: 0;
        }

        .list-name {
          font-size: 0.875rem;
          color: var(--foreground);
          font-weight: 500;
        }

        .current-list-badge {
          display: inline-block;
          font-size: 0.625rem;
          color: var(--primary-500);
          background: rgba(41, 98, 255, 0.1);
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          margin-top: 0.25rem;
        }

        /* Animations */
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* Utility animations */
        .transition-transform {
          transition-property: transform;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 150ms;
        }

        .hover\\:scale-110:hover {
          transform: scale(1.1);
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

    // Initialize components
    initializeWidget();
    createToggleButton();
    addKeyboardShortcuts();

    // Restore widget state if it was previously visible
    const shouldShowWidget = restoreWidgetState();
    if (shouldShowWidget) {
      console.log('🔄 Restoring widget visibility...');
      setTimeout(() => {
        showWidget();
      }, 100);
    }

    console.log('✅ Widget initialization complete');
  },
});