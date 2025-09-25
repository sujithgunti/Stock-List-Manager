# Stock Symbol List Manager

A modern browser extension for managing TradingView stock symbol lists with CSV upload and text input support, built with WXT framework, React, and TypeScript.

![Extension Preview](https://img.shields.io/badge/Version-1.0.0-blue) ![License](https://img.shields.io/badge/License-MIT-green) ![Built with](https://img.shields.io/badge/Built%20with-WXT%20%7C%20React%20%7C%20TypeScript-orange)

## 🚀 Features

- **📊 CSV File Upload**: Parse CSV files with "Sr., Stock Name, Symbol" format
- **📝 Text Input**: Support "NSE:SYMBOL, BSE:SYMBOL" comma-separated format
- **📋 Symbol Lists**: Create, name, and manage multiple symbol lists
- **🔗 TradingView Integration**: Click symbols to open Indian TradingView charts
- **💾 Local Storage**: Persist lists across browser sessions
- **🌙 Dark Theme**: TradingView-inspired UI design with shadcn/ui
- **🎨 Modern UI**: Professional interface with card-based layouts
- **🔄 Custom Naming**: Full control over list names for both input methods

## 🛠️ Built With

- **Framework**: [WXT](https://wxt.dev/) - Web Extension Framework
- **Frontend**: React 19+ with TypeScript
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Styling**: Tailwind CSS with custom TradingView color palette
- **Package Manager**: Bun
- **Browser**: Chrome (Manifest V3)

## 🎯 How It Works

### CSV Upload Workflow
1. **Upload CSV** → Drag & drop or select CSV file
2. **Auto-Parse** → Intelligent parsing with BOM support
3. **Preview Symbols** → See extracted symbols with badges
4. **Custom Name** → Enter your preferred list name
5. **Create List** → Save with custom name

### Text Input Workflow
1. **Paste Symbols** → Enter comma-separated symbols
2. **Parse & Validate** → Real-time symbol validation
3. **Preview Results** → See parsed symbols with exchange badges
4. **Name & Create** → Custom naming and list creation

### TradingView Integration
- **URL Format**: `https://in.tradingview.com/chart/?symbol={exchange}%3A{symbol}`
- **Supported Exchanges**: NSE, BSE
- **One-Click Access**: Click any symbol to open chart in new tab

## 🔧 Development

### Prerequisites
- [Bun](https://bun.sh/) (recommended) or Node.js 18+
- Chrome browser for testing

### Setup
```bash
# Clone the repository
git clone https://github.com/sujithgunti/Stock-List-Manager.git
cd Stock-List-Manager

# Install dependencies
bun install

# Start development server
bun run dev
```

### Available Scripts
```bash
# Development
bun run dev              # Start development server (Chrome)
bun run dev:firefox      # Start development server (Firefox)

# Production
bun run build            # Build extension for production
bun run zip              # Create distribution package

# Type checking
bun run compile          # TypeScript compilation check
```

## 📦 Installation

### Development Installation
1. Run `bun run build` to create production build
2. Open Chrome → Extensions → Enable Developer Mode
3. Click "Load unpacked" → Select `.output/chrome-mv3` folder
4. The extension icon will appear in your toolbar

### Production Installation
1. Download the `.zip` file from releases
2. Extract and follow development installation steps
3. Or install from Chrome Web Store (coming soon)

## 📋 Supported Formats

### CSV Format
```csv
Sr.,Stock Name,Symbol
1,Bharat Gears Limited,BHARATGEAR
2,Beardsell Limited,BEARDSELL
3,Zuari Industries Ltd,ZUARIIND
```

### Text Format
```
NSE:INNOVANA, NSE:DYCL, NSE:SHANTIGOLD, BSE:CIANAGRO, BSE:IIL
```

## 🏗️ Architecture

### Project Structure
```
entrypoints/popup/
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── FileUpload.tsx      # CSV upload interface
│   ├── TextInput.tsx       # Text input interface
│   ├── SymbolList.tsx      # Symbol display component
│   └── ListManager.tsx     # List management interface
├── types/
│   └── index.ts           # TypeScript interfaces
├── utils/
│   ├── parser.ts          # CSV/text parsing utilities
│   └── storage.ts         # Chrome storage management
└── lib/
    └── utils.ts           # Utility functions
```

### Data Schema
```typescript
interface StockSymbol {
  symbol: string;        // "BHARATGEAR"
  exchange: string;      // "NSE" | "BSE"
  fullSymbol: string;    // "NSE:BHARATGEAR"
  stockName?: string;    // "Bharat Gears Limited"
}

interface SymbolList {
  id: string;            // Unique identifier
  name: string;          // User-defined name
  symbols: StockSymbol[]; // Array of symbols
  createdAt: Date;       // Creation timestamp
  updatedAt: Date;       // Last modification
}
```

## 🎨 Design System

### Color Palette (TradingView Inspired)
- **Background**: `#1E222D` (Dark charcoal)
- **Cards**: `#2A2E39` (Lighter charcoal)
- **Text**: `#D1D4DC` (Light gray)
- **Accent**: `#2962FF` (TradingView blue)
- **Success**: `#4CAF50` (Green)
- **Error**: `#F44336` (Red)

### Component Library
Built with [shadcn/ui](https://ui.shadcn.com/) components:
- Cards, Buttons, Inputs, Badges
- Tabs, Textareas, and more
- Consistent dark theme throughout

## 📈 Features In Detail

### Intelligent CSV Parsing
- **BOM Support**: Handles Byte Order Mark characters
- **Column Auto-Detection**: Flexible column structure recognition
- **Error Handling**: Comprehensive validation and error reporting
- **Stock Name Extraction**: Preserves company names from CSV

### Advanced List Management
- **Multiple Lists**: Create unlimited symbol lists
- **Custom Naming**: Full control over list names
- **Persistent Storage**: Chrome Extension Storage API
- **Import Tracking**: Automatic timestamping and metadata

### Modern User Experience
- **Responsive Design**: Optimized for 400x600px popup
- **Real-time Feedback**: Instant validation and preview
- **Auto-dismiss Messages**: Success messages fade after 5 seconds
- **Keyboard Shortcuts**: Ctrl+Enter for quick parsing

## 🔒 Privacy & Security

- **Local Storage Only**: No data sent to external servers
- **Chrome Storage API**: Secure, encrypted local storage
- **No Network Requests**: All processing happens locally
- **Open Source**: Full transparency of code and functionality

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Guidelines
1. Follow TypeScript best practices
2. Maintain shadcn/ui design consistency
3. Add proper error handling
4. Update documentation for new features

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [WXT Framework](https://wxt.dev/) - Modern web extension development
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful and accessible UI components
- [TradingView](https://tradingview.com/) - Inspiration for the design theme
- [React](https://react.dev/) - Frontend framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

## 📞 Support

If you encounter any issues or have questions:
- Open an issue on [GitHub](https://github.com/sujithgunti/Stock-List-Manager/issues)
- Check the [Documentation](plan.md) for detailed implementation details

---

**Made with ❤️ for traders and investors**

*Click any symbol to open on TradingView India* 🚀
