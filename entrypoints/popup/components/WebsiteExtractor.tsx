import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { WebsiteExtractorProps, StockSymbol } from '../types/index';
import { parseTextInput } from '../utils/parser';
import { detectSite } from '../scrapers/screener';
import { SiteDetection, SupportedSite } from '../scrapers/types';
import { TrendingUp, Globe, Search, RefreshCw, XCircle, CheckCircle2, Plus, Code, Copy } from 'lucide-react';

export function WebsiteExtractor({
  onParsedSymbols,
  isLoading: parentLoading,
  error: parentError,
}: WebsiteExtractorProps) {
  const [siteInfo, setSiteInfo] = useState<SiteDetection | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedSymbols, setExtractedSymbols] = useState<StockSymbol[]>([]);
  const [symbolString, setSymbolString] = useState('');
  const [listName, setListName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Detect current site on mount
  useEffect(() => {
    detectCurrentSite();
  }, []);

  const detectCurrentSite = async () => {
    try {
      const tabs = await (globalThis as any).chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs.length > 0 && tabs[0].url) {
        const detection = detectSite(tabs[0].url);
        setSiteInfo(detection);

        // Auto-suggest list name based on site
        if (detection.isSupported) {
          const dateStr = new Date().toLocaleDateString();
          if (detection.site === SupportedSite.SCREENER) {
            setListName(`Screener.in - ${dateStr}`);
          } else if (detection.site === SupportedSite.CHARTINK) {
            setListName(`ChartInk - ${dateStr}`);
          }
        }

      } else {
        setSiteInfo({
          site: SupportedSite.UNKNOWN,
          isSupported: false,
          displayName: 'Unknown',
          instructions: 'Could not detect current website'
        });
      }
    } catch (err) {
      console.error('Error detecting site:', err);
      setSiteInfo({
        site: SupportedSite.UNKNOWN,
        isSupported: false,
        displayName: 'Error',
        instructions: 'Failed to detect website'
      });
    }
  };

  const handleExtractSymbols = async () => {
    setIsExtracting(true);
    setError('');
    setSuccess('');
    setExtractedSymbols([]);
    setSymbolString('');

    try {
      // Send message to background script to scrape
      const response = await new Promise<any>((resolve, reject) => {
        (globalThis as any).chrome.runtime.sendMessage(
          { type: 'SCRAPE_WEBSITE' },
          (response: any) => {
            if ((globalThis as any).chrome.runtime.lastError) {
              reject(new Error((globalThis as any).chrome.runtime.lastError.message));
            } else {
              resolve(response);
            }
          }
        );
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to extract symbols');
      }

      const symbolStr = response.result.symbolString;
      const totalPages = response.result.metadata?.totalPages || 1;
      setSymbolString(symbolStr);

      // Parse the symbol string using existing parser
      const parseResult = parseTextInput(symbolStr);

      if (parseResult.errorCount > 0) {
        setError(`Extracted ${parseResult.successCount} symbols from ${totalPages} page(s) with ${parseResult.errorCount} errors`);
      } else {
        const pageInfo = totalPages > 1 ? ` from ${totalPages} pages` : '';
        setSuccess(`Successfully extracted ${parseResult.successCount} symbols${pageInfo}`);
      }

      setExtractedSymbols(parseResult.symbols);

    } catch (err: any) {
      console.error('Extraction error:', err);
      setError(err.message || 'Failed to extract symbols');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleCreateList = () => {
    if (extractedSymbols.length === 0) {
      setError('No symbols to add');
      return;
    }

    if (!listName.trim()) {
      setError('Please enter a list name');
      return;
    }

    // Use the existing parser result format
    const parseResult = {
      symbols: extractedSymbols,
      errors: [],
      successCount: extractedSymbols.length,
      errorCount: 0
    };

    // Call the parent handler with the list name
    onParsedSymbols(parseResult, listName.trim());

    // Clear the extracted symbols
    setExtractedSymbols([]);
    setSymbolString('');
    setSuccess(`Created list "${listName}" with ${extractedSymbols.length} symbols`);
  };

  const getSiteIcon = (site: SupportedSite) => {
    switch (site) {
      case SupportedSite.SCREENER:
      case SupportedSite.CHARTINK:
      case SupportedSite.TRADINGEDGE:
        return <TrendingUp size={20} className="text-success" />;
      default:
        return <Globe size={20} className="text-foreground-muted" />;
    }
  };

  if (!siteInfo) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="spinner mx-auto mb-2"></div>
          <div className="text-sm text-foreground-muted">Detecting website...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Site Detection Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${siteInfo.isSupported ? 'bg-success/15' : 'bg-background-muted'
                }`}>
                {getSiteIcon(siteInfo.site)}
              </div>
              <div>
                <CardTitle className="text-sm">{siteInfo.displayName}</CardTitle>
                <CardDescription>Web symbol extraction</CardDescription>
              </div>
            </div>
            {siteInfo.isSupported ? (
              <Badge variant="success" className="text-[10px]">Supported</Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px]">Not Supported</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Instructions */}
            <div className="text-xs text-foreground-muted whitespace-pre-line bg-background-muted/50 p-3 rounded-lg border border-border/30">
              {siteInfo.instructions}
            </div>

            {/* Extract Button */}
            {siteInfo.isSupported && (
              <Button
                onClick={handleExtractSymbols}
                disabled={isExtracting || parentLoading}
                className="w-full btn-glow"
                size="default"
              >
                {isExtracting ? (
                  <>
                    <div className="spinner mr-2"></div>
                    Extracting...
                  </>
                ) : (
                  <>
                    <Search size={14} />
                    Extract Symbols
                  </>
                )}
              </Button>
            )}

            {/* Refresh Detection Button */}
            <Button
              onClick={detectCurrentSite}
              variant="outline"
              className="w-full"
              size="sm"
            >
              <RefreshCw size={12} />
              Re-detect Website
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <div className="alert-error flex items-center gap-2">
          <XCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Success Display */}
      {success && !extractedSymbols.length && (
        <div className="alert-success flex items-center gap-2">
          <CheckCircle2 size={14} />
          <span>{success}</span>
        </div>
      )}

      {/* Parent Error Display */}
      {parentError && (
        <div className="alert-error flex items-center gap-2">
          <XCircle size={14} />
          <span>{parentError}</span>
        </div>
      )}

      {/* Extracted Symbols Preview */}
      {extractedSymbols.length > 0 && (
        <Card className="border-primary-500/30 bg-primary-500/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-success/15 flex items-center justify-center">
                <CheckCircle2 size={16} className="text-success" />
              </div>
              <div>
                <CardTitle className="text-sm">Extracted Symbols</CardTitle>
                <CardDescription>
                  {extractedSymbols.length} symbols found
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Symbol Preview */}
              <div className="max-h-48 overflow-y-auto space-y-1 p-2 bg-background-muted/50 rounded-lg border border-border/30">
                {extractedSymbols.map((symbol, index) => (
                  <div
                    key={`${symbol.fullSymbol}-${index}`}
                    className="flex items-center gap-2 p-2 rounded-lg bg-background/50 hover:bg-background transition-colors"
                  >
                    <Badge
                      variant={symbol.exchange === 'NSE' ? 'nse' : 'bse'}
                      className="text-[10px] flex-shrink-0"
                    >
                      {symbol.exchange}
                    </Badge>
                    <span className="text-sm font-medium text-foreground">
                      {symbol.symbol}
                    </span>
                    {symbol.stockName && (
                      <span className="text-[11px] text-foreground-muted truncate">
                        {symbol.stockName}
                      </span>
                    )}
                  </div>
                ))}
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
                disabled={!listName.trim() || parentLoading}
                className="w-full btn-glow"
                size="lg"
              >
                <Plus size={14} />
                Create List with {extractedSymbols.length} symbols
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Raw Symbol String */}
      {symbolString && (
        <Card className="bg-background-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-foreground-muted flex items-center gap-2">
              <Code size={12} />
              Raw Output
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="p-2.5 bg-background-muted/70 rounded-lg overflow-x-auto border border-border/30">
              <code className="text-[11px] text-foreground-muted break-all font-mono">
                {symbolString.length > 200 ? symbolString.slice(0, 200) + '...' : symbolString}
              </code>
            </div>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(symbolString);
                setSuccess('Copied to clipboard!');
                setTimeout(() => setSuccess(''), 2000);
              }}
              variant="outline"
              size="sm"
              className="mt-2 w-full text-xs"
            >
              <Copy size={12} />
              Copy to Clipboard
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
