# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **WXT-based browser extension** using React and TypeScript. WXT is a framework for building Web Extensions (Chrome, Firefox, etc.) with modern tooling.

## Architecture

- **Framework**: WXT (Web Extension Framework)
- **UI**: React 19 with TypeScript
- **Package Manager**: Bun (uses bun.lockb)
- **Build Tool**: WXT's built-in Vite-based bundler

### Directory Structure

- `entrypoints/` - Extension entry points (WXT convention)
  - `background.ts` - Service Worker/background script
  - `content.ts` - Content script (runs on google.com pages)
  - `popup/` - Extension popup UI (React app)
- `assets/` - Static assets (images, etc.)
- `public/` - Public assets including extension icons
- `.output/` - Build output directory
- `.wxt/` - WXT generated types and configuration

### Extension Architecture

The extension follows WXT's file-based routing:
- **Background Script**: `entrypoints/background.ts` - runs as service worker
- **Content Script**: `entrypoints/content.ts` - injected into matching web pages
- **Popup**: `entrypoints/popup/` - React-based popup interface

## Development Commands

```bash
# Development (Chrome)
npm run dev

# Development (Firefox)
npm run dev:firefox

# Build for production
npm run build
npm run build:firefox

# Create distribution package
npm run zip
npm run zip:firefox

# Type checking
npm run compile

# Setup/prepare WXT
npm run postinstall
```

## Key Development Notes

- **Entry Points**: Use WXT's `defineBackground()`, `defineContentScript()`, and similar functions
- **Content Script Matching**: Currently targets `*://*.google.com/*`
- **React Integration**: Uses `@wxt-dev/module-react` for React support
- **TypeScript**: Extends `.wxt/tsconfig.json` with custom configurations
- **Asset Imports**: Use `@/assets/` for assets, `/` for public files

## Browser Extension Specific

- Icons are provided in multiple sizes in `public/icon/`
- WXT automatically generates manifest files
- Content scripts run in isolated contexts with page access
- Background scripts are service workers (Manifest V3)