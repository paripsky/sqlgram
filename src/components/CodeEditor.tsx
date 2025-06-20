import React from 'react';
import Editor from '@monaco-editor/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Download, Upload } from 'lucide-react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  onExecute?: () => void;
}

const defaultSQL = `-- PostgreSQL Database Schema Example
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE post_categories (
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, category_id)
);

CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    parent_id INTEGER REFERENCES comments(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  onExecute
}) => {
  const handleEditorChange = (newValue: string | undefined) => {
    onChange(newValue || '');
  };

  const handleLoadExample = () => {
    onChange(defaultSQL);
  };

  const handleExport = () => {
    const blob = new Blob([value], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schema.sql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.sql,.txt';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          onChange(content);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="text-base sm:text-lg">SQL Editor</CardTitle>
          <div className="flex flex-wrap gap-1 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadExample}
              className="text-xs flex-1 sm:flex-none min-w-0"
            >
              <span className="hidden sm:inline">Load Example</span>
              <span className="sm:hidden">Example</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleImport}
              className="text-xs flex-1 sm:flex-none min-w-0"
            >
              <Upload className="w-3 h-3 sm:mr-1" />
              <span className="hidden sm:inline">Import</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="text-xs flex-1 sm:flex-none min-w-0"
            >
              <Download className="w-3 h-3 sm:mr-1" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            {onExecute && (
              <Button
                size="sm"
                onClick={onExecute}
                className="text-xs flex-1 sm:flex-none min-w-0"
              >
                <Play className="w-3 h-3 sm:mr-1" />
                <span className="hidden sm:inline">Update Diagram</span>
                <span className="sm:hidden">Update</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <div className="h-full rounded-lg overflow-hidden border">
          <Editor
            height="100%"
            defaultLanguage="sql"
            value={value}
            onChange={handleEditorChange}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: window.innerWidth < 768 ? 12 : 14,
              lineNumbers: window.innerWidth < 768 ? 'off' : 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              readOnly: false,
              automaticLayout: true,
              wordWrap: 'on',
              wrappingIndent: 'indent',
              tabSize: 2,
              insertSpaces: true,
              folding: window.innerWidth >= 768,
              foldingHighlight: true,
              foldingImportsByDefault: true,
              showFoldingControls: window.innerWidth >= 768 ? 'always' : 'never',
              bracketPairColorization: {
                enabled: true,
              },
              guides: {
                bracketPairs: window.innerWidth >= 768,
                indentation: true
              },
              quickSuggestions: {
                other: true,
                comments: false,
                strings: false
              },
              overviewRulerLanes: window.innerWidth >= 768 ? 3 : 0,
              scrollbar: {
                vertical: window.innerWidth >= 768 ? 'auto' : 'hidden',
                horizontal: 'auto',
              }
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};
