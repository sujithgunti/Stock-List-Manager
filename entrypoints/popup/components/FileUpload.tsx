import React, { useState, useRef, useCallback } from 'react';
import { FileUploadProps, StockSymbol, ParseResult } from '../types/index.js';
import { parseCSV, validateFileContent } from '../utils/parser.js';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';

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
        <CardContent className="p-6">
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
              ${isDragOver ? 'border-primary-500 bg-primary-500/10' : 'border-border hover:border-border-light'}
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
              <div className="space-y-2">
                <div className="spinner mx-auto"></div>
                <p className="text-foreground-muted">Processing file...</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-4xl">📊</div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Upload CSV File</h3>
                  <p className="text-foreground-muted">Drop your CSV file here or click to browse</p>
                </div>
                <Button variant="outline" size="lg">
                  Choose CSV File
                </Button>
              </div>
            )}
          </div>

          {/* Status Messages */}
          {uploadStatus && (
            <div className={`mt-4 p-3 rounded-md text-sm ${
              uploadStatus.startsWith('Error')
                ? 'bg-error/20 text-error border border-error/30'
                : uploadStatus.includes('success')
                ? 'bg-success/20 text-success border border-success/30'
                : 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
            }`}>
              {uploadStatus}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Parsed Symbols Preview */}
      {parsedSymbols.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Extracted Symbols</CardTitle>
            <CardDescription>
              Found {parsedSymbols.length} symbols from {fileName}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Symbols Preview */}
            <div className="max-h-20 overflow-y-auto">
              <div className="flex flex-wrap gap-1">
                {parsedSymbols.slice(0, 6).map((symbol, index) => (
                  <Badge key={index} variant="nse" className="text-xs">
                    {symbol.symbol}
                  </Badge>
                ))}
                {parsedSymbols.length > 6 && (
                  <Badge variant="outline" className="text-xs">
                    +{parsedSymbols.length - 6} more
                  </Badge>
                )}
              </div>
            </div>

            {/* List Name Input - More prominent */}
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

            {/* Create List Button - More prominent */}
            <Button
              onClick={handleCreateList}
              disabled={!listName.trim() || parsedSymbols.length === 0}
              className="w-full h-12 text-base font-semibold"
              size="lg"
            >
              🚀 Create List with {parsedSymbols.length} symbols
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">CSV Format Example</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-background-muted p-3 rounded-md text-xs font-mono">
            <div className="text-foreground-muted">Sr.,Stock Name,Symbol</div>
            <div className="text-foreground">1,Bharat Gears Limited,BHARATGEAR</div>
            <div className="text-foreground">2,Beardsell Limited,BEARDSELL</div>
            <div className="text-foreground">3,Zuari Industries Ltd,ZUARIIND</div>
          </div>
          <div className="mt-3 text-xs text-foreground-muted space-y-1">
            <p>• First row should contain headers</p>
            <p>• Symbols will be imported with NSE exchange by default</p>
            <p>• Maximum file size: 1MB</p>
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