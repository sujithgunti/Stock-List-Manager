import React, { useState, useRef, useCallback } from 'react';
import { FileUploadProps, StockSymbol, ParseResult } from '../types/index.js';
import { parseCSV, validateFileContent } from '../utils/parser.js';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { FilePlus, XCircle, CheckCircle2, Plus, HelpCircle } from 'lucide-react';

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  onParsedSymbols,
  isLoading,
  error
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [parsedSymbols, setParsedSymbols] = useState<StockSymbol[]>([]);
  const [listName, setListName] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    onFileSelect(file);
    setUploadStatus('');
    setFileName(file.name);
    setParsedSymbols([]);

    try {
      // Basic file validation (just filename)
      if (!file.name.toLowerCase().endsWith('.csv')) {
        setUploadStatus('Error: File must be a CSV file (.csv extension)');
        return;
      }

      if (file.size > 1024 * 1024) {
        setUploadStatus('Error: File is too large. Maximum size is 1MB');
        return;
      }

      // Read file content
      const content = await readFileContent(file);

      // Validate content after reading
      const contentErrors = validateFileContent(content, file.name);
      if (contentErrors.length > 0) {
        setUploadStatus(`Error: ${contentErrors.join(', ')}`);
        return;
      }

      // Parse CSV
      setUploadStatus('Parsing CSV file...');
      const result = parseCSV(content);

      if (result.symbols.length === 0) {
        setUploadStatus('No valid symbols found in the file');
        setParsedSymbols([]);
      } else {
        setUploadStatus(`Found ${result.symbols.length} symbols`);
        setParsedSymbols(result.symbols);
        // Auto-generate list name from filename
        const baseName = file.name.replace('.csv', '');
        setListName(`${baseName} - ${new Date().toLocaleDateString()}`);
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process file';
      setUploadStatus(`Error: ${message}`);
      setParsedSymbols([]);
    }
  }, [onFileSelect]);

  const handleCreateList = useCallback(() => {
    if (parsedSymbols.length > 0 && listName.trim()) {
      const result: ParseResult = {
        symbols: parsedSymbols,
        errors: [],
        successCount: parsedSymbols.length,
        errorCount: 0
      };
      onParsedSymbols(result, listName.trim());

      // Reset state after successful creation
      setParsedSymbols([]);
      setListName('');
      setFileName('');
      setUploadStatus('List created successfully!');
    }
  }, [parsedSymbols, listName, onParsedSymbols]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(file => file.name.toLowerCase().endsWith('.csv'));

    if (csvFile) {
      handleFileSelect(csvFile);
    } else {
      setUploadStatus('Please drop a CSV file');
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card>
        <CardContent className="p-4">
          <div
            className={`
              border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer
              ${isDragOver ? 'border-primary-500 bg-primary-500/10 scale-[1.01]' : 'border-border/50 hover:border-primary-500/50 hover:bg-primary-500/5'}
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={handleButtonClick}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileInputChange}
              className="hidden"
              disabled={isLoading}
            />

            {isLoading ? (
              <div className="space-y-3 py-2">
                <div className="spinner mx-auto"></div>
                <p className="text-sm text-foreground-muted">Processing file...</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-primary-500/10 flex items-center justify-center">
                  <FilePlus size={28} className="text-primary-400" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Upload CSV File</h3>
                  <p className="text-xs text-foreground-muted mt-0.5">Drop your file here or click to browse</p>
                </div>
                <Button variant="outline" size="sm" className="mt-2">
                  Choose File
                </Button>
              </div>
            )}
          </div>

          {/* Status Messages */}
          {uploadStatus && (
            <div className={`mt-3 p-3 rounded-lg text-sm flex items-center gap-2 ${
              uploadStatus.startsWith('Error')
                ? 'bg-error/15 text-error border border-error/25'
                : uploadStatus.includes('success')
                ? 'bg-success/15 text-success border border-success/25'
                : 'bg-primary-500/15 text-primary-400 border border-primary-500/25'
            }`}>
              {uploadStatus.startsWith('Error') ? (
                <XCircle size={16} />
              ) : (
                <CheckCircle2 size={16} />
              )}
              <span>{uploadStatus}</span>
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
                <CardTitle className="text-sm">Symbols Extracted</CardTitle>
                <CardDescription>
                  {parsedSymbols.length} symbols from {fileName}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Symbols Preview */}
            <div className="max-h-16 overflow-y-auto">
              <div className="flex flex-wrap gap-1.5">
                {parsedSymbols.slice(0, 8).map((symbol, index) => (
                  <Badge key={index} variant="nse" className="text-xs">
                    {symbol.symbol}
                  </Badge>
                ))}
                {parsedSymbols.length > 8 && (
                  <Badge variant="count" className="text-xs">
                    +{parsedSymbols.length - 8} more
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
              disabled={!listName.trim() || parsedSymbols.length === 0}
              className="w-full btn-glow"
              size="lg"
            >
              <Plus size={16} />
              Create List with {parsedSymbols.length} symbols
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card className="bg-background-card/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs text-foreground-muted flex items-center gap-2">
            <HelpCircle size={14} />
            CSV Format
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="bg-background-muted/70 p-2.5 rounded-lg text-xs font-mono border border-border/30">
            <div className="text-foreground-muted">Sr.,Stock Name,Symbol</div>
            <div className="text-foreground">1,Bharat Gears,BHARATGEAR</div>
            <div className="text-foreground">2,Beardsell Ltd,BEARDSELL</div>
          </div>
          <div className="mt-2.5 text-xs text-foreground-muted space-y-0.5">
            <p>First row = headers | NSE exchange default | Max 1MB</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper function to read file content
function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        resolve(content);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}