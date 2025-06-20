import { useState, useMemo, useEffect } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CodeEditor } from '@/components/CodeEditor';
import { DiagramViewWithProvider } from '@/components/DiagramView';
import { parseSQLToDiagram, parseSimpleSQL } from '@/lib/sqlParser';
import { useIsMobile } from '@/hooks/use-mobile';
import type { SQLDiagram, SQLError } from '@/lib/sqlParser';

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

function App() {
  const [sqlCode, setSqlCode] = useState(defaultSQL);
  const [diagram, setDiagram] = useState<SQLDiagram>({ tables: [], relationships: [] });
  const [sqlErrors, setSqlErrors] = useState<SQLError[]>([]);
  const [isValidSQL, setIsValidSQL] = useState(true);
  const isMobile = useIsMobile();

  // Parse SQL and update diagram
  const updateDiagram = useMemo(() => {
    return () => {
      if (!sqlCode.trim()) {
        setDiagram({ tables: [], relationships: [] });
        setSqlErrors([]);
        setIsValidSQL(true);
        return;
      }

      try {
        // Try advanced parser first
        const parseResult = parseSQLToDiagram(sqlCode);

        // If no tables found and SQL is valid, try simple regex parser
        if (parseResult.diagram.tables.length === 0 && parseResult.isValid) {
          const simpleParseResult = parseSimpleSQL(sqlCode);
          // Only use simple parser result if it found tables or if main parser had no errors
          if (simpleParseResult.diagram.tables.length > 0) {
            setDiagram(simpleParseResult.diagram);
            setSqlErrors(simpleParseResult.errors);
            setIsValidSQL(simpleParseResult.isValid);
          } else {
            // Use main parser result even if no tables found, as long as SQL is valid
            setDiagram(parseResult.diagram);
            setSqlErrors(parseResult.errors);
            setIsValidSQL(parseResult.isValid);
          }
        } else {
          setDiagram(parseResult.diagram);
          setSqlErrors(parseResult.errors);
          setIsValidSQL(parseResult.isValid);
        }
      } catch (error) {
        console.error('Error parsing SQL:', error);
        // Fallback to simple parser
        try {
          const simpleParseResult = parseSimpleSQL(sqlCode);
          setDiagram(simpleParseResult.diagram);
          setSqlErrors(simpleParseResult.errors);
          setIsValidSQL(simpleParseResult.isValid);
        } catch (simpleError) {
          console.error('Error with simple parser:', simpleError);
          setDiagram({ tables: [], relationships: [] });
          setSqlErrors([{
            message: 'Critical parsing error',
            line: 1,
            column: 1,
            severity: 'error'
          }]);
          setIsValidSQL(false);
        }
      }
    };
  }, [sqlCode]);

  // Auto-update diagram when SQL changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateDiagram();
    }, 500); // Debounce updates

    return () => clearTimeout(timeoutId);
  }, [updateDiagram]);

  // Initial diagram update
  useEffect(() => {
    updateDiagram();
  }, [updateDiagram]);

  return (
    <div className="h-screen w-screen flex flex-col bg-background">
      <header className="border-b bg-card px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">SQLGram</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              PostgreSQL Schema Visualizer
            </p>
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground text-right">
            <div className="hidden sm:block">
              {diagram.tables.length} table{diagram.tables.length !== 1 ? 's' : ''} • {diagram.relationships.length} relationship{diagram.relationships.length !== 1 ? 's' : ''}
            </div>
            <div className="sm:hidden">
              {diagram.tables.length}T • {diagram.relationships.length}R
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        {isMobile ? (
          <Tabs defaultValue="editor" className="h-full flex flex-col gap-2 px-4">
            <TabsList className="w-full h-fit mt-2">
              <TabsTrigger value="editor">SQL Editor</TabsTrigger>
              <TabsTrigger value="diagram">Diagram</TabsTrigger>
            </TabsList>
            <TabsContent value="editor" className="flex-1">
              <div className="h-full">
                <CodeEditor
                  value={sqlCode}
                  onChange={setSqlCode}
                  onExecute={updateDiagram}
                  errors={sqlErrors}
                  isValid={isValidSQL}
                />
              </div>
            </TabsContent>
            <TabsContent value="diagram" className="flex-1">
              <div className="h-full border rounded-lg bg-card">
                <div className="h-full">
                  <DiagramViewWithProvider diagram={diagram} isValidSQL={isValidSQL} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="h-full p-4">
                <CodeEditor
                  value={sqlCode}
                  onChange={setSqlCode}
                  onExecute={updateDiagram}
                  errors={sqlErrors}
                  isValid={isValidSQL}
                />
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="h-full p-4">
                <div className="h-full border rounded-lg bg-card">
                  <div className="h-full">
                    <DiagramViewWithProvider diagram={diagram} isValidSQL={isValidSQL} />
                  </div>
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </main>
    </div>
  );
}

export default App;
