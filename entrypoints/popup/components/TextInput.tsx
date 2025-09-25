import React, { useState, useCallback, useEffect } from 'react';
import { TextInputProps, StockSymbol } from '../types/index.js';
import { parseTextInput } from '../utils/parser.js';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

export const TextInput: React.FC<TextInputProps> = ({
  value,
  onChange,
  onParsedSymbols,
  isLoading,
  error
}) => {
  const [parseResult, setParseResult] = useState<string>('');
  const [symbolCount, setSymbolCount] = useState(0);
  const [parsedSymbols, setParsedSymbols] = useState<StockSymbol[]>([]);
  const [listName, setListName] = useState<string>('');

  // Example text for placeholder
  const placeholderText = 'NSE:INNOVANA, NSE:DYCL, NSE:SHANTIGOLD, BSE:CIANAGRO, BSE:IIL, BSE:TIGERLOGS';

  // Count symbols as user types
  useEffect(() => {
    if (value.trim()) {
      const symbols = value.split(',').filter(s => s.trim().length > 0);
      setSymbolCount(symbols.length);
    } else {
      setSymbolCount(0);
    }
  }, [value]);

  const handleParse = useCallback(async () => {
    if (!value.trim()) {
      setParseResult('Please enter some symbols to parse');
      return;
    }

    setParseResult('');

    try {
      const result = parseTextInput(value);

      if (result.symbols.length === 0) {
        setParseResult('No valid symbols found. Please check the format.');
        setParsedSymbols([]);
      } else {
        const message = `Found ${result.symbols.length} valid symbol${result.symbols.length !== 1 ? 's' : ''}`;
        const errorMessage = result.errors.length > 0 ? ` with ${result.errors.length} error${result.errors.length !== 1 ? 's' : ''}` : '';
        setParseResult(message + errorMessage);
        setParsedSymbols(result.symbols);

        // Auto-generate list name
        const timestamp = new Date().toLocaleDateString();
        setListName(`Text Input - ${timestamp}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to parse symbols';
      setParseResult(`Error: ${message}`);
      setParsedSymbols([]);
    }
  }, [value]);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    setParseResult(''); // Clear previous results when text changes
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Allow Ctrl+Enter to parse
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      handleParse();
    }
  }, [handleParse]);

  const handleCreateList = useCallback(() => {
    if (parsedSymbols.length > 0 && listName.trim()) {
      const result = {
        symbols: parsedSymbols,
        errors: [],
        successCount: parsedSymbols.length,
        errorCount: 0
      };
      onParsedSymbols(result, listName.trim());

      // Reset state after successful creation
      setParsedSymbols([]);
      setListName('');
      setParseResult('');
      onChange('');
    }
  }, [parsedSymbols, listName, onParsedSymbols, onChange]);

  const handleClear = useCallback(() => {
    onChange('');
    setParseResult('');
    setParsedSymbols([]);
    setListName('');
  }, [onChange]);

  const handlePasteExample = useCallback(() => {
    onChange(placeholderText);
    setParseResult('');
    setParsedSymbols([]);
    setListName('');
  }, [onChange, placeholderText]);

  return (
    <div className="space-y-4">
      {/* Text Input Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">📝 Paste Symbols</CardTitle>
              <CardDescription>Enter comma-separated symbols in EXCHANGE:SYMBOL format</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handlePasteExample}
                variant="outline"
                size="sm"
                disabled={isLoading}
              >
                📋 Example
              </Button>
              <Button
                onClick={handleClear}
                variant="outline"
                size="sm"
                disabled={isLoading || !value.trim()}
              >
                🗑️ Clear
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              value={value}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder={`Paste symbols here...\n\nExample format:\n${placeholderText}`}
              disabled={isLoading}
              rows={6}
              className="font-mono text-sm"
            />

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {symbolCount} symbol{symbolCount !== 1 ? 's' : ''} detected
                </Badge>
                {symbolCount > 0 && (
                  <span className="text-foreground-muted">• Ready to parse</span>
                )}
              </div>
              <span className="text-xs text-foreground-muted">Ctrl+Enter to parse</span>
            </div>
          </div>

          <Button
            onClick={handleParse}
            disabled={isLoading || !value.trim()}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <div className="spinner mr-2"></div>
                Parsing Symbols...
              </>
            ) : (
              '🚀 Parse Symbols'
            )}
          </Button>

          {/* Parse Result */}
          {parseResult && (
            <div className={`p-3 rounded-md text-sm ${
              parseResult.startsWith('Error')
                ? 'bg-error/20 text-error border border-error/30'
                : 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
            }`}>
              {parseResult}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-3 rounded-md text-sm bg-error/20 text-error border border-error/30">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Parsed Symbols Preview */}
      {parsedSymbols.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">✅ Extracted Symbols</CardTitle>
            <CardDescription>
              Found {parsedSymbols.length} symbols • Ready to create list
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Symbols Preview */}
            <div className="max-h-20 overflow-y-auto">
              <div className="flex flex-wrap gap-1">
                {parsedSymbols.slice(0, 8).map((symbol, index) => (
                  <Badge key={index} variant={symbol.exchange === 'NSE' ? 'nse' : 'bse'} className="text-xs">
                    {symbol.symbol}
                  </Badge>
                ))}
                {parsedSymbols.length > 8 && (
                  <Badge variant="outline" className="text-xs">
                    +{parsedSymbols.length - 8} more
                  </Badge>
                )}
              </div>
            </div>

            {/* List Name Input */}
            <div className="space-y-2 bg-background-muted p-3 rounded-md">
              <label className="text-sm font-semibold text-foreground">📝 List Name</label>
              <Input
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="Enter list name..."
                className="w-full bg-background"
              />
              <p className="text-xs text-foreground-muted">Give your list a memorable name</p>
            </div>

            {/* Create List Button */}
            <Button
              onClick={handleCreateList}
              disabled={!listName.trim() || parsedSymbols.length === 0 || isLoading}
              className="w-full h-12 text-base font-semibold"
              size="lg"
            >
              🚀 Create List with {parsedSymbols.length} symbols
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Format Guide Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">📚 Format Guide</CardTitle>
          <CardDescription>Supported symbol formats and examples</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Examples */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-foreground">Examples:</div>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="nse" className="text-xs">NSE</Badge>
                <code className="bg-background-muted px-2 py-1 rounded text-xs">NSE:INNOVANA, NSE:DYCL</code>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="bse" className="text-xs">BSE</Badge>
                <code className="bg-background-muted px-2 py-1 rounded text-xs">BSE:CIANAGRO, BSE:IIL</code>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">Mixed</Badge>
                <code className="bg-background-muted px-2 py-1 rounded text-xs">NSE:SYMBOL1, BSE:SYMBOL2</code>
              </div>
            </div>
          </div>

          {/* Rules */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-foreground">Rules:</div>
            <div className="text-sm text-foreground-muted space-y-1">
              <div className="flex items-start gap-2">
                <span className="text-primary-400">•</span>
                <span>Separate symbols with commas</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary-400">•</span>
                <span>Format: <code className="bg-background-muted px-1 rounded text-xs">EXCHANGE:SYMBOL</code></span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary-400">•</span>
                <span>Supported exchanges: <Badge variant="nse" className="text-xs mx-1">NSE</Badge>, <Badge variant="bse" className="text-xs">BSE</Badge></span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary-400">•</span>
                <span>Symbol names should contain only letters and numbers</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};