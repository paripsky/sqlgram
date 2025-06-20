import { useState, useMemo, useEffect } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { CodeEditor } from '@/components/CodeEditor';
import { DiagramViewWithProvider } from '@/components/DiagramView';
import { parseSQLToDiagram, parseSimpleSQL } from '@/lib/sqlParser';
import type { SQLDiagram } from '@/lib/sqlParser';

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

  // Parse SQL and update diagram
  const updateDiagram = useMemo(() => {
    return () => {
      if (!sqlCode.trim()) {
        setDiagram({ tables: [], relationships: [] });
        return;
      }

      try {
        // Try advanced parser first
        const parsedDiagram = parseSQLToDiagram(sqlCode);
        
        // If no tables found, try simple regex parser
        if (parsedDiagram.tables.length === 0) {
          const simpleParsedDiagram = parseSimpleSQL(sqlCode);
          setDiagram(simpleParsedDiagram);
        } else {
          setDiagram(parsedDiagram);
        }
      } catch (error) {
        console.error('Error parsing SQL:', error);
        // Fallback to simple parser
        try {
          const simpleParsedDiagram = parseSimpleSQL(sqlCode);
          setDiagram(simpleParsedDiagram);
        } catch (simpleError) {
          console.error('Error with simple parser:', simpleError);
          setDiagram({ tables: [], relationships: [] });
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
      <header className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">SQLGram</h1>
            <p className="text-sm text-muted-foreground">
              PostgreSQL Schema Visualizer
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            {diagram.tables.length} table{diagram.tables.length !== 1 ? 's' : ''} • {diagram.relationships.length} relationship{diagram.relationships.length !== 1 ? 's' : ''}
          </div>
        </div>
      </header>
      
      <main className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full p-4">
              <CodeEditor
                value={sqlCode}
                onChange={setSqlCode}
                onExecute={updateDiagram}
              />
            </div>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full p-4">
              <div className="h-full border rounded-lg bg-card">
                <div className="h-full">
                  <DiagramViewWithProvider diagram={diagram} />
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  );
}

export default App;
