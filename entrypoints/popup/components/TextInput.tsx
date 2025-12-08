import React, { useState, useCallback, useEffect } from 'react';
import { TextInputProps, StockSymbol } from '../types/index.js';
import { parseTextInput } from '../utils/parser.js';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { PenLine, Search, XCircle, CheckCircle2, Plus, HelpCircle } from 'lucide-react';

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
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center">
                <PenLine size={16} className="text-primary-400" />
              </div>
              <div>
                <CardTitle className="text-sm">Paste Symbols</CardTitle>
                <CardDescription>Enter symbols in EXCHANGE:SYMBOL format</CardDescription>
              </div>
            </div>
            <div className="flex gap-1.5">
              <Button
                onClick={handlePasteExample}
                variant="ghost"
                size="sm"
                disabled={isLoading}
                className="h-7 px-2 text-xs"
              >
                Example
              </Button>
              <Button
                onClick={handleClear}
                variant="ghost"
                size="sm"
                disabled={isLoading || !value.trim()}
                className="h-7 px-2 text-xs"
              >
                Clear
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
              placeholder={`Paste symbols here...\n\nExample: ${placeholderText}`}
              disabled={isLoading}
              rows={5}
              className="font-mono text-xs"
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={symbolCount > 0 ? "default" : "secondary"} className="text-[10px]">
                  {symbolCount} symbol{symbolCount !== 1 ? 's' : ''}
                </Badge>
                {symbolCount > 0 && (
                  <span className="text-[11px] text-foreground-muted">Ready to parse</span>
                )}
              </div>
              <span className="text-[10px] text-foreground-muted/70">Ctrl+Enter to parse</span>
            </div>
          </div>

          <Button
            onClick={handleParse}
            disabled={isLoading || !value.trim()}
            className="w-full btn-glow"
            size="default"
          >
            {isLoading ? (
              <>
                <div className="spinner mr-2"></div>
                Parsing...
              </>
            ) : (
              <>
                <Search size={14} />
                Parse Symbols
              </>
            )}
          </Button>

          {/* Parse Result */}
          {parseResult && (
            <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
              parseResult.startsWith('Error')
                ? 'bg-error/15 text-error border border-error/25'
                : 'bg-primary-500/15 text-primary-400 border border-primary-500/25'
            }`}>
              {parseResult.startsWith('Error') ? (
                <XCircle size={14} />
              ) : (
                <CheckCircle2 size={14} />
              )}
              <span>{parseResult}</span>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-3 rounded-lg text-sm bg-error/15 text-error border border-error/25 flex items-center gap-2">
              <XCircle size={14} />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Parsed Symbols Preview */}
      {parsedSymbols.length > 0 && (
        <Card className="border-primary-500/30 bg-primary-500/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-success/15 flex items-center justify-center">
                <CheckCircle2 size={16} className="text-success" />
              </div>
              <div>
                <CardTitle className="text-sm">Symbols Parsed</CardTitle>
                <CardDescription>
                  {parsedSymbols.length} symbols ready to create list
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Symbols Preview */}
            <div className="max-h-16 overflow-y-auto">
              <div className="flex flex-wrap gap-1.5">
                {parsedSymbols.slice(0, 10).map((symbol, index) => (
                  <Badge key={index} variant={symbol.exchange === 'NSE' ? 'nse' : 'bse'} className="text-xs">
                    {symbol.symbol}
                  </Badge>
                ))}
                {parsedSymbols.length > 10 && (
                  <Badge variant="count" className="text-xs">
                    +{parsedSymbols.length - 10} more
                  </Badge>
                )}
              </div>
            </div>

            {/* List Name Input */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">List Name</label>
              <Input
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="Enter list name..."
                className="bg-background"
              />
            </div>

            {/* Create List Button */}
            <Button
              onClick={handleCreateList}
              disabled={!listName.trim() || parsedSymbols.length === 0 || isLoading}
              className="w-full btn-glow"
              size="lg"
            >
              <Plus size={16} />
              Create List with {parsedSymbols.length} symbols
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Format Guide Card */}
      <Card className="bg-background-card/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs text-foreground-muted flex items-center gap-2">
            <HelpCircle size={14} />
            Format Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {/* Examples */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="nse" className="text-[10px]">NSE</Badge>
              <code className="bg-background-muted/70 px-2 py-0.5 rounded text-[11px] text-foreground-muted border border-border/30">NSE:RELIANCE, NSE:TCS</code>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="bse" className="text-[10px]">BSE</Badge>
              <code className="bg-background-muted/70 px-2 py-0.5 rounded text-[11px] text-foreground-muted border border-border/30">BSE:INFY, BSE:HDFC</code>
            </div>
          </div>

          {/* Rules - Compact */}
          <div className="text-[11px] text-foreground-muted leading-relaxed">
            Comma-separated | Format: EXCHANGE:SYMBOL | Alphanumeric symbols only
          </div>
        </CardContent>
      </Card>
    </div>
  );
};