# TradingView Symbol Manager - Testing Guide

## 🚀 How to Test the Floating Widget

The floating widget should now be working correctly with improved initialization and debugging. Follow these steps to test:

### 1. Load the Extension

```bash
# Build the extension
npm run build

# Load extension in Chrome
# 1. Open Chrome and go to chrome://extensions/
# 2. Enable "Developer mode" (top right toggle)
# 3. Click "Load unpacked"
# 4. Select the ".output/chrome-mv3" folder
```

### 2. Test on TradingView Pages

Navigate to any of these TradingView URLs:
- https://in.tradingview.com/chart/
- https://www.tradingview.com/chart/
- https://in.tradingview.com/symbols/
- Any TradingView chart page

### 3. Look for the Toggle Button

You should see a **blue circular button (📊)** in the top-right corner of the page:
- Position: Fixed at top: 20px, right: 20px
- Color: Blue (#2962FF) with white border
- Size: 48x48 pixels
- Hover effect: Darker blue and slight scale increase

### 4. Test Widget Functionality

**Method 1: Click the Toggle Button**
- Click the blue 📊 button
- The floating widget should appear below the button

**Method 2: Keyboard Shortcut**
- Press `Ctrl+Shift+S` to toggle the widget
- Press `Escape` to hide the widget

### 5. Widget Features to Test

**Symbol Lists Management:**
- Widget shows available symbol lists
- Select different lists from dropdown
- Search within lists (if >3 symbols)
- View NSE/BSE badge statistics

**Navigation Options:**
- 👆 button: Opens symbol in same tab
- 🔗 button: Opens symbol in new tab
- State persists across page navigation

### 6. Debugging Information

Open **Developer Tools** (F12) and check the **Console** for:

**Expected Log Messages:**
```
🚀 TradingView Symbol Manager - Content script loaded on: [URL]
Initializing widget on: [URL]
✅ TradingView page detected, initializing widget...
Creating toggle button...
✅ Toggle button added to page
✅ Toggle button confirmed in DOM
✅ Widget initialization complete. Toggle button added.
```

**When Clicking Toggle Button:**
```
Toggle button clicked!
toggleWidget called, isWidgetVisible: false, widget exists: true
showWidget called, widget exists: true
Showing widget...
✅ Widget animation applied
✅ Widget is now visible
```

### 7. Cross-Tab Synchronization Testing

1. Open multiple TradingView tabs
2. Use the extension popup to create/modify symbol lists
3. Changes should reflect immediately in all floating widgets
4. Widget state (open/closed) persists across page navigation

### 8. Troubleshooting

**If Toggle Button Doesn't Appear:**
- Check browser console for errors
- Verify extension is loaded and active
- Refresh the TradingView page
- Check if content script is blocked by other extensions

**If Widget Doesn't Open:**
- Click the toggle button or press Ctrl+Shift+S
- Check console for error messages
- Verify Chrome Extension Storage permissions

**If Lists Don't Show:**
- Use the extension popup to create symbol lists first
- Check browser console for Jotai/storage errors
- Verify Chrome storage permissions are granted

### 9. Extension Popup Testing

Test the main popup functionality:
1. Click the extension icon in Chrome toolbar
2. Upload CSV files or input text symbols
3. Create and manage symbol lists
4. Verify changes sync to floating widgets

### 10. Production Testing Checklist

- [ ] Toggle button appears on TradingView pages
- [ ] Widget opens/closes with button and keyboard shortcut
- [ ] Symbol lists display correctly
- [ ] Navigation buttons work (same-tab and new-tab)
- [ ] State persists across page navigation
- [ ] Cross-tab synchronization works
- [ ] No console errors in normal operation
- [ ] Extension popup works independently
- [ ] CSV upload and text input function properly

## Expected Behavior

**✅ Working Correctly:**
- Blue toggle button visible on all TradingView pages
- Widget appears/disappears smoothly when toggled
- Lists sync between popup and floating widget
- Navigation opens TradingView charts correctly
- State persists across page reloads

**❌ Known Limitations:**
- Widget only appears on TradingView domains
- Requires Chrome Extension Storage permissions
- Some TradingView page layouts may affect positioning

## Support

If issues persist:
1. Check browser console for specific error messages
2. Verify extension permissions in chrome://extensions/
3. Test with a fresh Chrome profile
4. Report specific console errors for debugging