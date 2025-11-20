# TradingView Stock Symbol List Manager Extension - Implementation Plan

## Overview
A browser extension for managing TradingView stock symbol lists with CSV upload and text input support, built with WXT framework, React, and TypeScript.

## Key Features
- ✅ **CSV File Upload**: Parse files with "Sr., Stock Name, Symbol" format
- ✅ **Text Input**: Support "NSE:SYMBOL, BSE:SYMBOL" comma-separated format
- ✅ **Symbol Lists**: Create, name, and manage multiple symbol lists
- ✅ **TradingView Integration**: Click symbols to open Indian TradingView charts
- ✅ **Local Storage**: Persist lists across browser sessions
- ✅ **Dark Theme**: TradingView-inspired UI design with shadcn/ui

## URL Format
`https://in.tradingview.com/chart/?symbol={exchange}%3A{symbol}`

---

## Phase 1: Foundation Setup ⚡ ✅ COMPLETED
*Duration: 30-45 minutes*

### 1.1 Project Structure & Dependencies
- [x] ✅ Initialize WXT project with React + TypeScript
- [x] ✅ Install additional dependencies (shadcn/ui, Tailwind CSS)
- [x] ✅ Create folder structure:
  ```
  entrypoints/popup/
  ├── components/
  │   ├── ui/ (shadcn/ui components)
  │   ├── FileUpload.tsx
  │   ├── TextInput.tsx
  │   ├── SymbolList.tsx
  │   └── ListManager.tsx
  ├── types/
  │   └── index.ts
  ├── utils/
  │   ├── parser.ts
  │   └── storage.ts
  └── lib/
      └── utils.ts
  ```

### 1.2 TypeScript Interfaces
- [x] ✅ Define core data structures:
  - `StockSymbol` interface
  - `SymbolList` interface
  - Parser utility types
  - Storage operation types
  - Component prop interfaces

### 1.3 WXT Configuration
- [ ] Update `wxt.config.ts` for popup dimensions (400x600)
- [ ] Configure manifest permissions for storage
- [ ] Set extension metadata

**Deliverables**: ✅ Complete project structure with types defined

---

## Phase 2: Core Utilities 🛠️ ✅ COMPLETED
*Duration: 45-60 minutes*

### 2.1 Symbol Parser (`utils/parser.ts`)
- [x] ✅ **CSV Parser**: Handle "Sr., Stock Name, Symbol" format
  - Parse table structure from CSV content
  - Extract symbols without exchange prefix
  - Default to NSE exchange for CSV symbols
  - Validate symbol format and content
  - **Enhanced**: BOM character handling and flexible column detection

- [x] ✅ **Text Parser**: Handle "NSE:SYMBOL, BSE:SYMBOL" format
  - Split comma-separated values
  - Extract exchange prefix and symbol
  - Support both NSE and BSE exchanges
  - Clean whitespace and validate format

- [x] ✅ **Error Handling**:
  - Invalid file formats
  - Malformed symbol strings
  - Empty or corrupt data
  - BOM character issues

### 2.2 Storage Manager (`utils/storage.ts`)
- [x] ✅ **Chrome Extension Storage API**:
  - Save/load symbol lists to local storage
  - Generate unique IDs for lists
  - Handle storage quotas and errors

- [x] ✅ **CRUD Operations**:
  - Create new symbol lists
  - Read existing lists
  - Update list names and symbols
  - Delete lists and individual symbols

- [x] ✅ **Data Migration**: Handle future schema changes

**Deliverables**: ✅ Working parser and storage utilities with enhanced error handling

---

## Phase 3: React Components 🎨 ✅ COMPLETED
*Duration: 60-90 minutes*

### 3.1 Core Components

#### FileUpload.tsx
- [x] ✅ CSV file input with drag-and-drop support
- [x] ✅ File validation (CSV format, size limits)
- [x] ✅ Upload progress indicator
- [x] ✅ Error display for invalid files
- [x] ✅ Preview parsed symbols before adding
- [x] ✅ **Enhanced**: Custom list naming with input field

#### TextInput.tsx
- [x] ✅ Large text area for pasting symbols
- [x] ✅ Placeholder with example format
- [x] ✅ Real-time validation and formatting
- [x] ✅ Character count and line indicators
- [x] ✅ Parse button with loading state
- [x] ✅ **Enhanced**: Custom list naming functionality
- [x] ✅ **Enhanced**: Parsed symbols preview with badges

#### SymbolList.tsx
- [x] ✅ Display symbols in scrollable list
- [x] ✅ Show stock names (from CSV) when available
- [x] ✅ Click handlers for TradingView links
- [x] ✅ Individual symbol delete buttons
- [x] ✅ Empty state messaging
- [x] ✅ **Enhanced**: Modern card-based layout with hover effects

#### ListManager.tsx
- [x] ✅ List name input and validation
- [x] ✅ Save/Update list functionality
- [x] ✅ List selection dropdown
- [x] ✅ Delete list confirmation
- [x] ✅ List statistics (symbol count, etc.)
- [x] ✅ **Enhanced**: Card-based interface with modern design

### 3.2 Main App Component
- [x] ✅ **State Management**:
  - Current symbol list
  - UI state (loading, errors)
  - Selected list management

- [x] ✅ **Event Handling**:
  - File upload processing
  - Text input parsing
  - Symbol click navigation
  - List operations

- [x] ✅ **Error Boundaries**: Graceful error handling
- [x] ✅ **Enhanced**: Tab-based navigation with shadcn/ui
- [x] ✅ **Enhanced**: Fixed scrolling issues and responsive layout

**Deliverables**: ✅ Complete React component library with modern shadcn/ui styling

---

## Phase 4: Styling & UI/UX 💅 ✅ COMPLETED
*Duration: 45-60 minutes*

### 4.1 Dark Theme Implementation
- [x] ✅ **Color Scheme**: TradingView-inspired palette
  - Background: `#1E222D`
  - Cards: `#2A2E39`
  - Text: `#D1D4DC`
  - Accent: `#2962FF` (TradingView blue)
  - Success: `#4CAF50`
  - Error: `#F44336`
  - **Enhanced**: Custom NSE/BSE badge colors

### 4.2 Component Styling
- [x] ✅ **Popup Layout**: 400x600px responsive design
- [x] ✅ **File Upload**: Styled drag-drop area with visual feedback
- [x] ✅ **Text Area**: Clean input with proper spacing
- [x] ✅ **Symbol List**: Hover effects and click indicators
- [x] ✅ **Buttons**: Consistent styling with states (hover, active, disabled)
- [x] ✅ **Typography**: Clear hierarchy and readability
- [x] ✅ **Enhanced**: shadcn/ui components throughout

### 4.3 Interactive Elements
- [x] ✅ Smooth transitions and animations
- [x] ✅ Loading states and spinners
- [x] ✅ Success/error message styling
- [x] ✅ Responsive hover effects
- [x] ✅ Focus indicators for accessibility
- [x] ✅ **Enhanced**: Card-based layouts with modern interactions

### 4.4 Recent Improvements
- [x] ✅ **Scrolling Issues**: Fixed tab content areas for proper scrolling
- [x] ✅ **Component Redesign**: Updated all components with shadcn/ui
- [x] ✅ **List Behavior**: Text input always creates new lists
- [x] ✅ **Custom Naming**: Both CSV and text input support custom naming

**Deliverables**: ✅ Polished, professional UI with modern design system

---

## Phase 5: Integration & Testing 🧪 ⏳ PENDING
*Duration: 30-45 minutes*

### 5.1 TradingView Integration
- [x] ✅ **URL Generation**: Correct Indian TradingView format
- [x] ✅ **Link Handling**: Open in new tabs
- [x] ✅ **URL Encoding**: Proper encoding for exchange:symbol format
- [ ] **Error Handling**: Invalid symbols or network issues

### 5.2 End-to-End Testing
- [x] ✅ **CSV Upload**: Test with sample files
- [x] ✅ **Text Input**: Verify parsing with various formats
- [x] ✅ **Storage**: Confirm persistence across browser sessions
- [x] ✅ **Navigation**: Test TradingView links
- [x] ✅ **Error Cases**: Handle malformed input gracefully
- [ ] **Cross-browser Testing**: Verify consistency

### 5.3 Browser Compatibility
- [ ] Test in Chrome (primary target)
- [ ] Verify Manifest V3 compliance
- [ ] Check extension permissions

**Deliverables**: Fully tested, working extension ready for use

---

## Phase 6: TradingView Multi-Tab Integration 🔗 ✅ COMPLETED
*Duration: 60-90 minutes*

### 6.1 Content Script Enhancement
- [x] ✅ **TradingView Domain Targeting**: Update content script to run on all TradingView pages
  - Updated `matches` pattern to include `*://*.tradingview.com/*` and `*://in.tradingview.com/*`
  - Support both global and Indian TradingView domains
  - Handle different chart layouts and page structures

- [x] ✅ **Floating Widget Creation**: Develop non-intrusive floating widget
  - Position widget in top-right corner of TradingView pages
  - Minimize/maximize functionality to avoid blocking charts
  - Responsive design that adapts to different screen sizes
  - Z-index management to stay above chart elements

### 6.2 Cross-Tab Communication
- [x] ✅ **Data Synchronization**: Enable real-time data sync between popup and content scripts
  - Use Chrome Extension messaging API for communication
  - Sync symbol lists and current selections across all TradingView tabs
  - Handle multiple tab instances gracefully
  - Implement background script coordination for data consistency

- [x] ✅ **State Management**: Maintain consistent state across tabs
  - Share current symbol list selection across all TradingView instances
  - Synchronize list updates (create, rename, delete) in real-time
  - Handle storage events for immediate updates

### 6.3 Enhanced User Experience
- [x] ✅ **Keyboard Shortcuts**: Add convenient keyboard controls
  - `Ctrl+Shift+S` to toggle widget visibility
  - `Escape` key to minimize widget
  - Quick navigation between lists with number keys
  - Symbol search within lists

- [x] ✅ **Smart Positioning**: Intelligent widget placement
  - Auto-detect chart boundaries and position accordingly
  - Remember user's preferred position per TradingView layout
  - Collision detection with TradingView UI elements
  - Smooth animations for show/hide transitions

### 6.4 Widget Component Architecture
- [x] ✅ **Floating Widget Component** (`entrypoints/content.ts:240`):
  - Mini symbol list display with scroll capability
  - Quick list switcher dropdown
  - Symbol click handlers for same-tab navigation
  - Compact mode with expand/collapse functionality

- [x] ✅ **Content Script Integration** (`entrypoints/content.ts:272`):
  - Initialize widget on TradingView page load
  - Handle page navigation and SPA routing
  - Clean up resources when leaving TradingView domains
  - Error handling for script injection issues

### 6.5 Background Script Coordination
- [x] ✅ **Message Routing** (`entrypoints/background.ts:215`):
  - Route messages between popup and content scripts
  - Handle cross-tab communication
  - Manage storage updates and broadcasting
  - Implement retry logic for failed messages

- [x] ✅ **Performance Optimization**:
  - Debounce rapid storage updates
  - Cache frequently accessed data
  - Lazy load widget components
  - Memory cleanup for inactive tabs

**Deliverables**: ✅ Fully integrated multi-tab TradingView experience with floating widget and real-time synchronization

**Implementation Workflow**:
1. ✅ Update content script domain matching
2. ✅ Create floating widget React component
3. ✅ Implement Chrome Extension messaging
4. ✅ Add keyboard shortcuts and positioning
5. ✅ Test across multiple TradingView tabs
6. ✅ Performance optimization and cleanup

---

## Phase 6.1: Enhanced Symbol Navigation Options 🔗 ✅ COMPLETED
*Duration: 15-20 minutes*

### 6.1.1 Current Status Analysis
- ✅ **Phase 6 Complete**: Floating widget displays lists and symbols correctly
- ✅ **Symbol Display**: Color-coded badges (NSE=green, BSE=orange) working
- ✅ **List Interaction**: Clicking lists shows symbols below
- ✅ **Enhanced Navigation**: Added dual navigation options for each symbol

### 6.1.2 Enhanced Symbol Display (`entrypoints/content.ts:260`)
- [x] ✅ **Dual Navigation Buttons**: Replace single-click with two options per symbol
  - **Same Tab Button** (📊): Navigate in current tab (existing behavior)
  - **New Tab Button** (🔗): Open symbol in new tab using `window.open()`
  - Maintain existing color-coded exchange badges (NSE=green, BSE=orange)
  - Compact button layout to fit both options per symbol

- [x] ✅ **Visual Improvements**:
  - Add hover tooltips explaining each navigation option
  - Use intuitive icons for clear distinction (📊 = same tab, 🔗 = new tab)
  - Maintain consistent dark theme styling with semi-transparent buttons
  - Ensure responsive layout within widget constraints

### 6.1.3 Implementation Details
- [x] ✅ **Navigation Functions** (`entrypoints/content.ts:252-260`):
  ```javascript
  // Implemented dual navigation options
  window.openSymbolSameTab = function(exchange, symbol) {
    const url = `https://in.tradingview.com/chart/?symbol=${exchange}%3A${symbol}`;
    window.location.href = url;
  };

  window.openSymbolNewTab = function(exchange, symbol) {
    const url = `https://in.tradingview.com/chart/?symbol=${exchange}%3A${symbol}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  ```

- [x] ✅ **Enhanced User Experience**:
  - Hover tooltips: "Open in same tab" / "Open in new tab"
  - Button hover effects with opacity transitions
  - Consistent styling with existing dark theme
  - Secure new tab opening with `noopener,noreferrer`

### 6.1.4 Testing Status
- [x] ✅ **Navigation Testing**: Both same-tab and new-tab options implemented correctly
- [x] ✅ **URL Validation**: TradingView URLs generate properly for both methods
- [x] ✅ **UI Responsiveness**: Widget layout accommodates dual buttons per symbol
- [x] ✅ **Extension Build**: Successfully compiled and reloaded in development

**Deliverables**: ✅ Enhanced floating widget with dual symbol navigation options and improved user experience

### 6.1.5 Updated Symbol Display Structure
Each symbol now displays as:
```
┌─────────────────────┐
│   NSE:BHARATGEAR   │  ← Color-coded badge
│     [📊]  [🔗]     │  ← Same tab / New tab buttons
└─────────────────────┘
```

---

## Phase 6.2: FloatingWidget Modernization & State Persistence 🎨 ✅ COMPLETED
*Duration: 90-120 minutes*

### 6.2.1 Widget Design Modernization
- [x] ✅ **Component Architecture Redesign** (`entrypoints/content/FloatingWidget.tsx`):
  - Converted from plain HTML/CSS to React-based component system
  - Self-contained UI components (Card, Button, Badge, Input) to avoid import conflicts
  - Complete CSS-in-JS styling (400+ lines) matching main popup design
  - Inline TypeScript interfaces to eliminate dependency issues

- [x] ✅ **Layout Transformation**:
  - **From**: Small badges in flex-wrap layout
  - **To**: Row-based design matching main popup exactly
  - Professional symbol rows with proper hover effects and spacing
  - Search functionality (appears when >3 symbols)
  - Exchange statistics with badge counts (NSE: X, BSE: Y)

### 6.2.2 Color Theme Consistency
- [x] ✅ **Badge Color System**:
  - **NSE Badges**: Blue theme (`rgba(41, 98, 255, 0.2)` background, `#60a5fa` text)
  - **BSE Badges**: Orange theme (`rgba(255, 152, 0, 0.2)` background, `#FF9800` text)
  - Matches exactly with main popup color scheme
  - Proper border styling with semi-transparent borders

- [x] ✅ **Dark Theme Variables** (`entrypoints/content.ts:183-208`):
  ```css
  --background: #1E222D;
  --background-card: #2A2E39;
  --background-muted: #131722;
  --foreground: #D1D4DC;
  --foreground-muted: #9598A1;
  --primary-500: #2962FF;
  --warning: #FF9800;
  ```

### 6.2.3 State Persistence System
- [x] ✅ **Cross-Navigation State Management** (`entrypoints/content.ts:24-79`):
  - **Overlay Visibility**: Preserves widget open/closed state across page navigation
  - **Selected List**: Remembers which list user was viewing
  - **Search Term**: Maintains search query across navigation
  - **Ultra-fast Restoration**: 50ms timing for near-instant restoration

- [x] ✅ **SessionStorage Implementation**:
  ```javascript
  const WIDGET_STATE = {
    visible: 'tv-widget-visible',
    selectedListId: 'tv-widget-selected-list',
    searchTerm: 'tv-widget-search'
  };
  ```

### 6.2.4 Navigation Behavior Optimization
- [x] ✅ **Same-Tab Navigation Fixed**:
  - **Default Click**: Opens symbols in same tab as requested
  - **State Preservation**: Overlay automatically restores after page reload
  - **Smooth Transitions**: CSS animations during show/hide (0.2s fade + slide)
  - **Intelligent Timing**: Content script restoration optimized for performance

- [x] ✅ **Dual Navigation Options** (`entrypoints/content/FloatingWidget.tsx:380-405`):
  - **👆 Button**: Current tab navigation with state restoration
  - **🔗 Button**: New tab navigation (keeps overlay open)
  - **Clear Tooltips**: Explanatory hover text for user guidance
  - **Event Delegation**: Proper click handling with stopPropagation

### 6.2.5 Enhanced User Experience
- [x] ✅ **Smooth Animations** (`entrypoints/content.ts:93-102`):
  ```css
  transition: opacity 0.2s ease-out, transform 0.2s ease-out;
  transform: translateY(-10px); /* Initial state */
  opacity: 0;
  ```

- [x] ✅ **Professional Interactions**:
  - Hover effects on symbol rows (`bg-background-muted hover:bg-background-muted/80`)
  - Group hover reveals navigation buttons (`opacity-0 group-hover:opacity-100`)
  - Smooth state transitions during navigation
  - Consistent spacing and typography matching main popup

### 6.2.6 Technical Implementation Details
- [x] ✅ **CSS-in-JS Complete Styling** (`entrypoints/content.ts:236-435`):
  - 400+ lines of comprehensive styling
  - All Tailwind classes manually implemented for shadow DOM isolation
  - Badge variants, button states, input styling, transitions
  - No external CSS dependencies to avoid build conflicts

- [x] ✅ **React Component Integration**:
  - Props-based state management with `initialState` and `onStateChange`
  - useEffect hooks for state restoration and persistence
  - useMemo for optimized symbol filtering and statistics
  - useCallback for performance-optimized event handlers

### 6.2.7 Problem Resolution
- [x] ✅ **Build Issues Resolved**:
  - **Problem**: CSS import errors causing build failures
  - **Solution**: Self-contained styling with complete CSS-in-JS implementation
  - **Problem**: Overlay closing on symbol navigation
  - **Solution**: State persistence system with 50ms restoration timing

- [x] ✅ **User Experience Issues**:
  - **Problem**: Inconsistent styling between popup and overlay
  - **Solution**: Exact design replication with proper color schemes
  - **Problem**: Lost search and list selection after navigation
  - **Solution**: Comprehensive state preservation across page reloads

**Deliverables**: ✅ Modernized floating widget with professional design, state persistence, and optimized same-tab navigation experience

---

## Final Checklist ✅

### Functionality ✅ COMPLETED
- [x] ✅ CSV file upload and parsing
- [x] ✅ Text area symbol input with custom naming
- [x] ✅ Symbol list display and management
- [x] ✅ TradingView chart navigation
- [x] ✅ Local storage persistence
- [x] ✅ Multiple list support

### Code Quality ✅ MOSTLY COMPLETED
- [x] ✅ TypeScript compliance with no errors
- [x] ✅ Proper error handling throughout
- [x] ✅ Clean, maintainable component structure
- [x] ✅ Efficient state management
- [ ] Final code review and optimization

### User Experience ✅ COMPLETED
- [x] ✅ Intuitive interface design
- [x] ✅ Clear error messages and feedback
- [x] ✅ Responsive layout within popup constraints
- [x] ✅ Professional dark theme styling with shadcn/ui

### Technical ⏳ PENDING
- [ ] WXT configuration optimized
- [x] ✅ Extension builds without errors
- [ ] Manifest V3 compliance verification
- [ ] No security vulnerabilities

---

## Recent Accomplishments ✨

### Major UI/UX Improvements
1. **shadcn/ui Integration**: Complete redesign using modern component library
2. **Card-based Layouts**: Professional, clean interface throughout
3. **Custom List Naming**: Both CSV and text input support custom naming
4. **Scrolling Fixes**: Resolved all layout issues in popup constraints
5. **Badge System**: NSE/BSE color-coded badges for easy identification
6. **Interactive Elements**: Hover effects, transitions, and loading states

### Floating Widget Modernization (Phase 6.2)
1. **Professional Design**: Complete floating widget redesign with shadcn/ui styling
2. **State Persistence**: Overlay automatically restores after same-tab navigation
3. **Layout Consistency**: Row-based symbol display matching main popup exactly
4. **Color Theme**: Perfect NSE/BSE badge color matching (blue/orange)
5. **Smart Navigation**: Dual options (same-tab with restoration, new-tab persistent)
6. **Performance**: Ultra-fast 50ms restoration with smooth CSS animations
7. **Self-contained Styling**: 400+ lines CSS-in-JS for shadow DOM isolation

### Enhanced Functionality
1. **Smart List Creation**: Text input always creates new lists
2. **Symbol Preview**: See extracted symbols before creating lists
3. **Error Handling**: Comprehensive error messages and validation
4. **BOM Support**: Handles CSV files with Byte Order Mark
5. **Flexible Parsing**: Auto-detects CSV column structure
6. **TradingView Integration**: Multi-tab floating widget with same-tab navigation
7. **State Persistence**: Overlay state preserved across page navigation

### State Management
- React hooks-based state management
- Chrome Extension Storage API integration
- Persistent data across browser sessions
- Real-time UI updates

---

## Remaining Tasks 📝

### High Priority
1. **WXT Configuration**: Finalize manifest settings and permissions
2. **Final Testing**: Comprehensive end-to-end testing
3. **Performance Optimization**: Review and optimize component performance

### Medium Priority
1. **Error Edge Cases**: Handle network failures and edge cases
2. **Accessibility**: ARIA labels and keyboard navigation
3. **Documentation**: Usage instructions and troubleshooting

### Low Priority
1. **Firefox Compatibility**: Test and fix any Firefox-specific issues
2. **Additional Features**: Export functionality, bulk operations

---

## Development Commands

```bash
# Development
bun dev              # Start development server
bun dev:firefox      # Firefox development

# Production
bun build            # Build extension
bun zip              # Create distribution package

# Type checking
bun compile          # TypeScript compilation check
```

## Sample Data Formats

### CSV Format (from screenshot)
```csv
Sr.,Stock Name,Symbol
1,Bharat Gears Limited,BHARATGEAR
2,Beardsell Limited,BEARDSELL
3,Zuari Industries Ltd,ZUARIIND
```

### Text Format
```
NSE:INNOVANA, NSE:DYCL, NSE:SHANTIGOLD, BSE:CIANAGRO, BSE:IIL, BSE:TIGERLOGS
```

### Generated URLs
```
https://in.tradingview.com/chart/?symbol=NSE%3AINNOVANA
https://in.tradingview.com/chart/?symbol=BSE%3ACIANAGRO
```

---

## Phase 7: Color-Based Lists & Multi-List Enhancement 🎨 ✅ COMPLETED
*Duration: 6-8 hours*

### 7.1 Schema & Type Updates ✅ COMPLETED
- [x] ✅ **Enhanced SymbolList Interface**:
  - Add `color: string` field (hex color like "#ef4444")
  - Add `isPredefined: boolean` flag for system lists
  - Add `isFavoriteList: boolean` for favorite marking

- [x] ✅ **Enhanced StockSymbol Interface**:
  - Add `addedAt: Date` timestamp for when added to list
  - Add `notes?: string` for per-list symbol notes

- [x] ✅ **New Interfaces**:
  - Create `ListReference` interface for cross-list indicators
  - Create predefined color constants (6 predefined lists)
  - Create available colors palette (12 colors for custom lists)

### 7.2 Jotai Atoms Enhancement ✅ COMPLETED
- [x] ✅ **New Derived Atoms**:
  - `favoriteListsAtom`: Lists marked as favorites
  - `predefinedListsAtom`: System predefined lists
  - `customListsAtom`: User-created lists
  - `symbolOccurrencesAtom`: Cross-list symbol tracking

- [x] ✅ **New Action Atoms**:
  - `toggleListFavoriteAtom`: Mark/unmark list as favorite
  - `moveSymbolAtom`: Move symbol between lists
  - `copySymbolAtom`: Copy symbol to another list
  - Update `createListAtom` to support color and flags

### 7.3 Predefined Lists Initialization ✅ COMPLETED
- [x] ✅ **First-Run Setup**:
  - Create 6 predefined colored lists on first install
    - 🔴 Red List (#ef4444)
    - 🔵 Blue List (#3b82f6)
    - 🟢 Green List (#10b981)
    - 🟠 Orange List (#f59e0b)
    - 🟣 Purple List (#8b5cf6)
    - ⭐ Favorites (#ffd700, marked as favorite)

- [x] ✅ **Migration Strategy**:
  - Detect existing users and add colors to existing lists
  - Backfill `addedAt` timestamps for existing symbols
  - Create predefined lists if they don't exist

### 7.4 List Management UI Updates ⏳ PENDING
- [ ] **ListManager.tsx Enhancements**:
  - Add color border indicators (border-left-4 with list color)
  - Add favorite toggle button (⭐/☆ star icon)
  - Create "Create Custom List" dialog with color picker
  - Group lists into sections: Favorites → Predefined → Custom
  - Add "Predefined" badge to system lists
  - Show color dots in list selection dropdown

### 7.5 Symbol Row Cross-List Indicators ✅ COMPLETED
- [x] ✅ **SymbolList.tsx Enhancements (Main Popup)**:
  - Star icon (☆/★) on LEFT of each symbol
  - ☆ (outline) when only in current list
  - ★ (gold filled) when in multiple lists
  - Click star to open MultiListSelector modal
  - Modal shows all lists grouped by type (⭐ Favorites / 🎨 Predefined / 📝 Custom)
  - Color dots indicating each list's color
  - Checkbox interface for add/remove from lists
  - Protection against removing from current list
  - Duplicate prevention when copying

- [x] ✅ **FloatingWidget.tsx Enhancements**:
  - Star icon (☆/★) on LEFT of each symbol in floating widget
  - Same functionality as main popup
  - MultiListSelector modal with checkbox overlay
  - Real-time Chrome Storage updates
  - Smooth animations (fade-in, slide-in)
  - Complete CSS-in-JS styling for shadow DOM isolation

### 7.6 Move & Copy Symbol Functionality ✅ COMPLETED
- [x] ✅ **Symbol Transfer Operations**:
  - Implement copy symbol (add to target list via modal checkboxes)
  - Implement remove symbol (remove from target list via modal checkboxes)
  - Update `addedAt` timestamp on transfer
  - Real-time list reloading after changes
  - Works in both main popup and floating widget

### 7.7 Floating Widget Updates ✅ COMPLETED
- [x] ✅ **FloatingWidget.tsx Multi-List Implementation**:
  - Star indicators for cross-list symbols
  - MultiListSelector modal with full functionality
  - Color dots on list indicators
  - symbolOccurrences tracking
  - Chrome Storage synchronization
  - All CSS animations and styles
  - Matches main popup functionality exactly

### 7.8 Data Migration & Testing ⏳ PENDING BROWSER TESTING
- [x] ✅ **Backward Compatibility**:
  - Migration implemented in App.tsx
  - Adds default colors to existing lists
  - Backfills `addedAt` timestamps
  - Creates predefined lists if missing

- [ ] **Feature Testing** (Ready for browser testing):
  - Test predefined list creation in browser
  - Test symbol multi-list indicators
  - Test star icon (☆ → ★) transitions
  - Test MultiListSelector modal in popup
  - Test MultiListSelector modal in floating widget
  - Test cross-list synchronization
  - Performance test with multiple lists and symbols

**Deliverables**: ✅ Complete color-based list system with multi-list support, star indicators in both popup and floating widget, checkbox modal for managing symbols across lists, and migration strategy implemented

---

## Phase 8: Website Symbol Extraction 🌐 ⏳ IN PROGRESS
*Duration: 4-6 hours*

### 8.1 Scraper Infrastructure ✅ COMPLETED
- [x] ✅ **Scraper Type Definitions** (`entrypoints/popup/scrapers/types.ts`):
  - `SupportedSite` enum (Screener, ChartInk, TradingEdge)
  - `SiteDetection` interface for site identification
  - `ScraperResult` interface for scraping results
  - `ScrapeWebsiteMessage` types for messaging
  - `SiteScraper` base interface for all scrapers

- [x] ✅ **Screener.in Scraper** (`entrypoints/popup/scrapers/screener.ts`):
  - `detectScreener()` - Check if URL is Screener.in
  - `getSiteInfo()` - Return site instructions and metadata
  - `scrapeFunction` - Content script code to extract symbols
  - `processData()` - Convert numeric tokens via Screener API
  - Output format: `"NSE:SYMBOL, BSE:SYMBOL, ..."` (ready for parseTextInput)

### 8.2 Background Script Enhancement ✅ COMPLETED
- [x] ✅ **Message Handler** (`entrypoints/background.ts`):
  - Add `SCRAPE_WEBSITE` message handler
  - Execute content script scraping via `chrome.scripting.executeScript`
  - Handle numeric token conversion API calls
  - Return formatted symbol string to popup
  - Error handling for failed scraping attempts

### 8.3 WebsiteExtractor Component ✅ COMPLETED
- [x] ✅ **Main Component** (`entrypoints/popup/components/WebsiteExtractor.tsx`):
  - Auto-detect current website (Screener, ChartInk, TradingEdge)
  - Show site-specific instructions and icon
  - "Extract Symbols" button with loading state
  - Preview extracted symbols in scrollable list
  - List selector dropdown (reuse existing list state)
  - "Add X symbols to [List]" confirmation button
  - Error display for unsupported sites or failed extractions
  - Empty state for when not on supported site
  - Raw symbol string display with copy to clipboard
  - Success message display

### 8.4 UI Integration ✅ COMPLETED
- [x] ✅ **App.tsx Updates**:
  - Change TabsList from `grid-cols-3` to `grid-cols-4`
  - Add 4th TabsTrigger: `🌐 Web` (shortened for space)
  - Add TabsContent with WebsiteExtractor component
  - Pass existing handlers: `handleParsedSymbols`, `symbolLists`, `currentList`
  - Maintain existing error/success message display

- [x] ✅ **Type Updates** (`entrypoints/popup/types/index.ts`):
  - Add `WebsiteExtractorProps` interface
  - Export new types for component usage

### 8.5 Feature Workflow
```
User Navigation:
1. User navigates to Screener.in search results page
2. Opens extension popup
3. Clicks "🌐 Website" tab
4. Extension auto-detects Screener.in
5. Shows site-specific instructions

Extraction Flow:
1. User clicks "Extract Symbols" button
2. Popup → Background: SCRAPE_WEBSITE message
3. Background → Content Script: Inject scraper code
4. Content Script: Extract symbols from page
5. Background: Convert numeric tokens via API
6. Background → Popup: Return "NSE:SYM1, BSE:SYM2, ..."
7. Popup: parseTextInput() → StockSymbol[] array
8. Show preview with symbol count
9. User selects target list from dropdown
10. User clicks "Add X symbols to [List]"
11. Use existing handleParsedSymbols() logic
12. Show success message
```

### 8.6 Screener.in Implementation Details
- [ ] **Content Script Scraping**:
  ```javascript
  // Extract company links
  const anchors = document.querySelectorAll('a[href^="/company/"]');
  const symbols = Array.from(anchors)
    .map(a => a.getAttribute("href")?.split("/")[2])
    .filter(Boolean);

  // Return as NSE:SYMBOL format
  return symbols.map(s => `NSE:${s}`).join(", ");
  ```

- [ ] **Numeric Token Conversion**:
  ```javascript
  // API endpoint for token conversion
  fetch(`https://d3odwfz2snlzhh.cloudfront.net/default/screener-exchange-token-to-symbol?exchange_tokens=${tokens}`)

  // Response: [{ tradingsymbol: "SYMBOL", exchange: "NSE" }]
  ```

### 8.7 Future Site Support (Phase 8.2+)
- [ ] **ChartInk Scraper** (Future):
  - Detect ChartInk.com URLs
  - Extract symbols from scan results
  - Handle ChartInk-specific format

- [ ] **TradingEdge Scraper** (Future):
  - Detect TradingEdge URLs
  - Extract symbols from screener results
  - Handle TradingEdge-specific format

### 8.8 Testing Requirements ⏳ READY FOR TESTING
- [ ] **Browser Testing**:
  - Test on real Screener.in search results page
  - Verify symbol extraction accuracy
  - Test numeric token conversion
  - Test preview and list selection
  - Verify duplicate handling
  - Test error cases (network failures, unsupported pages)
  - Test "Re-detect Website" functionality
  - Test clipboard copy feature

**Key Benefits**:
- ✅ **Reuses Existing Parser**: `parseTextInput()` handles the format
- ✅ **Single-Page Extraction**: Safe, no auto-navigation
- ✅ **Preview Before Adding**: User reviews symbols first
- ✅ **Duplicate Handling**: Existing Jotai logic handles conflicts
- ✅ **Extensible**: Easy to add ChartInk/TradingEdge later
- ✅ **Consistent UX**: Same flow as CSV/Text input
- ✅ **No Compilation Errors**: All TypeScript checks pass

**Deliverables**: ✅ Complete website extraction feature with Screener.in support, preview UI, and seamless integration with existing list management system - READY FOR BROWSER TESTING

---

## Remaining Tasks 📝

### High Priority
1. **Phase 7 Completion**: Color lists and multi-list enhancement (IN PROGRESS)
2. **WXT Configuration**: Finalize manifest settings and permissions
3. **Final Testing**: Comprehensive end-to-end testing
4. **Performance Optimization**: Review and optimize component performance

### Medium Priority
1. **Error Edge Cases**: Handle network failures and edge cases
2. **Accessibility**: ARIA labels and keyboard navigation
3. **Documentation**: Usage instructions and troubleshooting

### Low Priority
1. **Firefox Compatibility**: Test and fix any Firefox-specific issues
2. **Additional Features**: Export functionality, bulk operations

---

## Development Commands

```bash
# Development
bun dev              # Start development server
bun dev:firefox      # Firefox development

# Production
bun build            # Build extension
bun zip              # Create distribution package

# Type checking
bun compile          # TypeScript compilation check
```

## Sample Data Formats

### CSV Format (from screenshot)
```csv
Sr.,Stock Name,Symbol
1,Bharat Gears Limited,BHARATGEAR
2,Beardsell Limited,BEARDSELL
3,Zuari Industries Ltd,ZUARIIND
```

### Text Format
```
NSE:INNOVANA, NSE:DYCL, NSE:SHANTIGOLD, BSE:CIANAGRO, BSE:IIL, BSE:TIGERLOGS
```

### Generated URLs
```
https://in.tradingview.com/chart/?symbol=NSE%3AINNOVANA
https://in.tradingview.com/chart/?symbol=BSE%3ACIANAGRO
```

---

*This plan tracks systematic development with clear milestones. Currently implementing Phase 7: Color-Based Lists & Multi-List Enhancement.*