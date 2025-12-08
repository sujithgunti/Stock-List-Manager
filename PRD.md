# Product Requirements Document (PRD)
## TradeFlow - TradingView Symbol Manager

**Version:** 1.1.0
**Last Updated:** November 2025
**Status:** MVP Complete (100%)

---

## 🎯 **Executive Summary**

### **Product Vision**
**TradeFlow** is a browser extension that streamlines stock symbol list management for TradingView users, providing seamless CSV upload, text input parsing, and intelligent symbol extraction from popular stock screener websites, all integrated with real-time cross-tab synchronization.

### **Value Proposition**
- **Time Savings**: Upload hundreds of symbols instantly vs manual entry
- **Smart Extraction**: One-click symbol scraping from Screener.in and ChartInk.com
- **Data Flexibility**: Support both CSV files, text input, and direct web extraction
- **Seamless Integration**: Native TradingView experience with floating widget
- **Zero Setup**: Works immediately with local storage, no account required

### **Target Market**
Active stock traders and investors who use TradingView for technical analysis and rely on external screeners (Screener.in, ChartInk) for stock selection.

---

## 📱 **Product Overview**

### **Core Functionality**
**TradeFlow** is a browser extension that enables users to:
1. Upload stock symbol lists via CSV files
2. Input symbols through text interface
3. **[NEW] Extract symbols directly from Screener.in and ChartInk.com**
4. Organize symbols into named, color-coded lists
5. Access symbols directly on TradingView pages via a floating widget
6. Navigate between symbols with one-click TradingView integration

### **Technical Architecture**
- **Framework**: WXT (Web Extension Framework) with Vite bundling
- **Frontend**: React 19 with TypeScript
- **State Management**: Jotai atomic state management
- **Storage**: Chrome Extension Storage API with real-time sync
- **Styling**: Tailwind CSS + shadcn/ui components
- **Browser Support**: Chrome, Firefox (Manifest V3)

---

## 👥 **Target Users & User Personas**

### **Primary User: Active Day Trader**
- **Profile**: Trades 50-200 stocks daily, uses ChartInk for intraday signals
- **Pain Points**: Manually copying symbols from ChartInk to TradingView is slow and error-prone
- **Goals**: Instantly transfer scanner results to TradingView for chart analysis
- **Usage Pattern**: Runs ChartInk scan -> Extracts symbols -> Opens TradingView -> Rapidly cycles through charts

### **Secondary User: Fundamental Investor**
- **Profile**: Uses Screener.in for deep fundamental analysis
- **Pain Points**: Screener.in uses internal numeric IDs, making it hard to find the correct NSE/BSE symbol
- **Goals**: Convert Screener.in watchlists to tradeable TradingView symbols
- **Usage Pattern**: Browses Screener.in -> Extracts list -> Analyzes charts on TradingView

---

## ⚡ **Feature Set**

### **1. CSV File Upload & Processing**

#### **File Upload Interface**
- **Drag & Drop Support**: Visual drag-drop area with hover feedback
- **File Browser**: Traditional file picker as fallback option
- **File Validation**: CSV format verification and size limits
- **Progress Indicators**: Upload and processing status feedback

#### **CSV Parsing Capabilities**
- **Format Support**: "Sr., Stock Name, Symbol" structure
- **BOM Handling**: Automatic Byte Order Mark character removal
- **Flexible Columns**: Auto-detection of column structure
- **Default Exchange**: NSE exchange applied to symbols without prefix

### **2. Text Input & Symbol Processing**

#### **Text Input Interface**
- **Large Text Area**: Multi-line input with placeholder examples
- **Real-time Validation**: Instant feedback on symbol format
- **Parse Preview**: Real-time symbol extraction preview

#### **Text Parsing Capabilities**
- **Multi-Exchange Support**: NSE and BSE exchange prefixes
- **Comma Separation**: Handles comma-separated symbol lists
- **Format Validation**: Exchange:Symbol pattern enforcement

### **3. [NEW] Website Symbol Extraction**

#### **Supported Platforms**
- **Screener.in**: Extracts symbols from screens and watchlists
- **ChartInk.com**: Extracts symbols from technical scanners

#### **Extraction Features**
- **Auto-Detection**: Automatically identifies supported websites
- **Pagination Handling**:
  - **Screener.in**: URL-based pagination scraping
  - **ChartInk**: Click-based pagination navigation
- **Smart Conversion (Screener.in)**:
  - Detects internal numeric IDs (e.g., "6543")
  - **Background Tab Processing**: Opens company page in a hidden background tab to extract the true NSE/BSE symbol
  - **Rate Limit Handling**: Pauses execution if rate limits are detected
- **Metadata Extraction**: Captures price, change %, and volume data where available

#### **User Workflow**
1. User navigates to a Screener.in or ChartInk result page
2. Opens extension and switches to "Web" tab
3. Extension detects the site and shows "Supported" badge
4. User clicks "Extract Symbols"
5. Extension scrapes current page (and subsequent pages if configured)
6. Results are displayed for review and addition to a list

### **4. Symbol List Management**

#### **List CRUD Operations**
- **Create/Edit/Delete**: Full management of symbol lists
- **Color Coding**: Assign custom colors to lists for visual organization
- **Multi-List Support**: Manage unlimited distinct lists
- **Symbol Operations**: Copy/Move symbols between lists

#### **List Organization**
- **Unique Naming**: Duplicate name prevention
- **Timestamp Tracking**: Creation and modification dates
- **List Statistics**: Total lists and symbols overview

### **5. TradingView Integration**

#### **URL Generation & Navigation**
- **Indian TradingView**: Targets `https://in.tradingview.com/`
- **Chart URL Format**: `https://in.tradingview.com/chart/?symbol=NSE%3ASYMBOL`
- **New Tab Opening**: Opens charts in new browser tabs

### **6. Floating Widget (TradingView Pages)**

#### **Widget Appearance**
- **Floating Design**: Non-intrusive overlay on TradingView pages
- **Top-Right Positioning**: Strategic placement avoiding chart interference
- **Minimize/Maximize**: Collapsible interface
- **Dark Theme**: Consistent with TradingView's dark interface

#### **Widget Functionality**
- **Symbol List Access**: Direct access to all saved symbol lists
- **Navigation Options**:
  - 📊 **Same Tab**: Updates current chart (fastest)
  - 🔗 **New Tab**: Opens symbol in new background tab
- **Real-time Sync**: Changes in popup instantly reflect in widget

### **7. Data Storage & Persistence**

#### **Chrome Extension Storage**
- **Local Storage**: All data stored locally in user's browser
- **Cross-Session Persistence**: Data survives browser restarts
- **Real-time Synchronization**: Instant updates across extension contexts (Popup <-> Content Script)

---

## 📊 **Technical Specifications**

### **Architecture Overview**
```
Extension Architecture:
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Popup (React) │    │  Content Script  │    │ Background      │
│   - Main UI     │    │  - Floating      │    │ - Scraping      │
│   - Web Tab     │    │    Widget        │    │   Logic         │
│   - Jotai State │◄──►│  - TradingView   │◄──►│ - Tab Mgmt      │
└─────────────────┘    │    Integration   │    └─────────────────┘
         ▲              └──────────────────┘              ▲
         │                        ▲                       │
         ▼                        ▼                       ▼
┌──────────────────────────────────────────────────────────────┐
│               Chrome Extension Storage API                    │
│           Real-time Cross-Context Synchronization            │
└──────────────────────────────────────────────────────────────┘
```

### **Scraping Architecture**
- **Message Passing**: Popup sends `SCRAPE_WEBSITE` message to Background
- **Background Script**:
  - Executes scripts in the active tab to scrape DOM
  - Manages pagination logic (URL vs Click)
  - Handles "Background Tab" creation for Screener.in ID conversion
- **Permissions**: Requires `scripting` and `host_permissions` for target sites

### **Browser Compatibility**
- **Chrome**: Full support (Manifest V3)
- **Firefox**: Compatible with WXT framework
- **Edge**: Chrome extension compatibility

---

## 🚀 **Development Status**

### **Completed Features (100%)**
- ✅ **Core MVP**: CSV upload, text input, list management
- ✅ **Web Scraping**: Screener.in and ChartInk integration
- ✅ **TradingView Integration**: Floating widget with dual navigation
- ✅ **State Management**: Jotai atomic state with Chrome Storage
- ✅ **UI/UX**: Modern dark theme with shadcn/ui components

### **Future Roadmap**
- 🔹 **Cloud Sync**: Optional Google Drive backup
- 🔹 **More Scrapers**: Support for Investing.com and MoneyControl
- 🔹 **Advanced Filtering**: Filter extracted symbols by price/volume before adding

---

## 🔒 **Security & Privacy**

### **Data Privacy**
- **Local Storage Only**: No data sent to external servers
- **User Control**: Complete user ownership of symbol lists
- **Transparent Permissions**:
  - `storage`: For saving lists
  - `scripting`: For extraction features
  - `host_permissions`: Strictly limited to TradingView, Screener.in, and ChartInk

### **Security Features**
- **Input Validation**: Comprehensive symbol and file validation
- **XSS Prevention**: Sanitized inputs and secure DOM manipulation
- **Content Security Policy**: Strict CSP for extension security

---

## 📚 **Documentation & Support**

### **User Documentation**
- **Getting Started**: Quick setup and first-use guide
- **Feature Tutorials**: Step-by-step usage instructions
- **Troubleshooting**: Common issues and solutions

### **Support Channels**
- **GitHub Issues**: Bug reports and feature requests
- **Community**: User discussion and feedback