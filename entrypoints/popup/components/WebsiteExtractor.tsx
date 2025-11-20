import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { WebsiteExtractorProps, StockSymbol } from '../types/index';
import { parseTextInput } from '../utils/parser';
import { detectSite } from '../scrapers/screener';
import { SiteDetection, SupportedSite } from '../scrapers/types';

export function WebsiteExtractor({
  onParsedSymbols,
  isLoading: parentLoading,
  error: parentError,
  lists,
  currentList
}: WebsiteExtractorProps) {
  const [siteInfo, setSiteInfo] = useState<SiteDetection | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedSymbols, setExtractedSymbols] = useState<StockSymbol[]>([]);
  const [symbolString, setSymbolString] = useState('');
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Detect current site on mount
  useEffect(() => {
    detectCurrentSite();
  }, []);

  // Set default selected list
  useEffect(() => {
    if (currentList && !selectedListId) {
      setSelectedListId(currentList.id);
    } else if (lists.length > 0 && !selectedListId) {
      setSelectedListId(lists[0].id);
    }
  }, [currentList, lists, selectedListId]);

  const detectCurrentSite = async () => {
    try {
      const tabs = await (globalThis as any).chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs.length > 0 && tabs[0].url) {
        const detection = detectSite(tabs[0].url);
        setSiteInfo(detection);
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

  const handleAddToList = () => {
    if (extractedSymbols.length === 0) {
      setError('No symbols to add');
      return;
    }

    if (!selectedListId) {
      setError('Please select a list');
      return;
    }

    const selectedList = lists.find(list => list.id === selectedListId);
    if (!selectedList) {
      setError('Selected list not found');
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
    onParsedSymbols(parseResult, selectedList.name);

    // Clear the extracted symbols
    setExtractedSymbols([]);
    setSymbolString('');
    setSuccess(`Added ${extractedSymbols.length} symbols to ${selectedList.name}`);
  };

  const getSiteIcon = (site: SupportedSite) => {
    switch (site) {
      case SupportedSite.SCREENER:
        return '📊';
      case SupportedSite.CHARTINK:
        return '📈';
      case SupportedSite.TRADINGEDGE:
        return '📉';
      default:
        return '🌐';
    }
  };

  if (!siteInfo) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">Detecting website...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Site Detection Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <span className="text-2xl">{getSiteIcon(siteInfo.site)}</span>
            {siteInfo.displayName}
            {siteInfo.isSupported ? (
              <Badge variant="default" className="ml-2">Supported</Badge>
            ) : (
              <Badge variant="destructive" className="ml-2">Not Supported</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Website extraction for stock symbols
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Instructions */}
            <div className="text-sm text-foreground-muted whitespace-pre-line">
              {siteInfo.instructions}
            </div>

            {/* Extract Button */}
            {siteInfo.isSupported && (
              <Button
                onClick={handleExtractSymbols}
                disabled={isExtracting || parentLoading}
                className="w-full"
              >
                {isExtracting ? (
                  <>
                    <span className="inline-block animate-spin mr-2">⏳</span>
                    Extracting...
                  </>
                ) : (
                  <>
                    <span className="mr-2">🔍</span>
                    Extract Symbols from Current Page
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
              <span className="mr-2">🔄</span>
              Re-detect Website
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <div className="p-3 rounded-md text-sm bg-error/20 text-error border border-error/30">
          {error}
        </div>
      )}

      {/* Success Display */}
      {success && !extractedSymbols.length && (
        <div className="p-3 rounded-md text-sm bg-success/20 text-success border border-success/30">
          {success}
        </div>
      )}

      {/* Parent Error Display */}
      {parentError && (
        <div className="p-3 rounded-md text-sm bg-error/20 text-error border border-error/30">
          {parentError}
        </div>
      )}

      {/* Extracted Symbols Preview */}
      {extractedSymbols.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              📋 Extracted Symbols ({extractedSymbols.length})
            </CardTitle>
            <CardDescription>
              Review and add to your list
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Symbol Preview */}
              <div className="max-h-64 overflow-y-auto space-y-2 p-2 bg-background-muted rounded-md">
                {extractedSymbols.map((symbol, index) => (
                  <div
                    key={`${symbol.fullSymbol}-${index}`}
                    className="flex items-center gap-2 p-2 rounded-md bg-background hover:bg-background-card transition-colors"
                  >
                    <Badge
                      variant={symbol.exchange === 'NSE' ? 'nse' : 'bse'}
                      className="text-xs flex-shrink-0"
                    >
                      {symbol.exchange}
                    </Badge>
                    <span className="text-sm font-medium text-foreground">
                      {symbol.symbol}
                    </span>
                    {symbol.stockName && (
                      <span className="text-xs text-muted-foreground truncate">
                        {symbol.stockName}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* List Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Add to List:
                </label>
                <select
                  value={selectedListId}
                  onChange={(e) => setSelectedListId(e.target.value)}
                  className="w-full p-2 rounded-md bg-background-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {lists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.name} ({list.symbols.length} symbols)
                    </option>
                  ))}
                </select>
              </div>

              {/* Add to List Button */}
              <Button
                onClick={handleAddToList}
                disabled={!selectedListId || parentLoading}
                className="w-full"
              >
                <span className="mr-2">➕</span>
                Add {extractedSymbols.length} symbols to {lists.find(l => l.id === selectedListId)?.name || 'list'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Raw Symbol String (for debugging/manual use) */}
      {symbolString && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">📝 Raw Symbol String</CardTitle>
            <CardDescription className="text-xs">
              Copy this if you want to use it manually
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-2 bg-background-muted rounded-md overflow-x-auto">
              <code className="text-xs text-foreground-muted break-all">
                {symbolString}
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
              className="mt-2 w-full"
            >
              📋 Copy to Clipboard
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
