import { parse } from 'sql-parser-cst';

export interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
  foreignKey?: {
    table: string;
    column: string;
  };
}

export interface Table {
  name: string;
  columns: TableColumn[];
}

export interface Relationship {
  from: { table: string; column: string };
  to: { table: string; column: string };
  type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
}

export interface SQLDiagram {
  tables: Table[];
  relationships: Relationship[];
}

export function parseSQLToDiagram(sqlCode: string): SQLDiagram {
  const tables: Table[] = [];
  const relationships: Relationship[] = [];

  try {
    const ast = parse(sqlCode, {
      dialect: 'postgresql',
      includeRange: true,
      includeComments: true
    });

    // Extract CREATE TABLE statements
    const statements = Array.isArray(ast.statements) ? ast.statements : [ast.statements];

    statements.forEach((statement: unknown) => {
      if ((statement as Record<string, unknown>)?.type === 'create_table_stmt') {
        const table = parseCreateTable(statement as Record<string, unknown>);
        if (table) {
          tables.push(table);
        }
      }
    });

    // Extract relationships from foreign keys
    tables.forEach(table => {
      table.columns.forEach(column => {
        if (column.foreignKey) {
          relationships.push({
            from: { table: table.name, column: column.name },
            to: { table: column.foreignKey.table, column: column.foreignKey.column },
            type: 'many-to-one'
          });
        }
      });
    });

  } catch (error) {
    console.warn('SQL parsing error:', error);
    // Return empty diagram if parsing fails
  }

  return { tables, relationships };
}

function parseCreateTable(statement: Record<string, unknown>): Table | null {
  try {
    const name = statement.name as Record<string, unknown>;
    const tableName = name?.name || statement.name;
    if (!tableName) return null;

    const columns: TableColumn[] = [];

    if (statement.columns) {
      (statement.columns as unknown[]).forEach((col: unknown) => {
        const column = parseColumn(col as Record<string, unknown>);
        if (column) {
          columns.push(column);
        }
      });
    }

    return {
      name: tableName as string,
      columns
    };
  } catch (error) {
    console.warn('Error parsing table:', error);
    return null;
  }
}

function parseColumn(col: Record<string, unknown>): TableColumn | null {
  try {
    const name = (col.name as Record<string, unknown>)?.name || col.name;
    if (!name) return null;

    const dataType = (col.dataType as Record<string, unknown>)?.name || col.dataType || 'unknown';
    let nullable = true;
    let primaryKey = false;
    let foreignKey: { table: string; column: string } | undefined;

    // Check constraints
    if (col.constraints) {
      (col.constraints as unknown[]).forEach((constraint: unknown) => {
        const constraintObj = constraint as Record<string, unknown>;
        if (constraintObj.type === 'not_null' || constraintObj.constraintType === 'not_null') {
          nullable = false;
        }
        if (constraintObj.type === 'primary_key' || constraintObj.constraintType === 'primary_key') {
          primaryKey = true;
          nullable = false;
        }
        if (constraintObj.type === 'foreign_key' || constraintObj.constraintType === 'foreign_key') {
          const references = constraintObj.references as Record<string, unknown>;
          if (references) {
            const table = (references.table as Record<string, unknown>)?.name || references.table;
            const columns = references.columns as unknown[];
            const column = columns?.[0] ? (columns[0] as Record<string, unknown>)?.name || columns[0] : 'id';
            foreignKey = {
              table: table as string,
              column: column as string
            };
          }
        }
      });
    }

    return {
      name: name as string,
      type: dataType as string,
      nullable,
      primaryKey,
      foreignKey
    };
  } catch (error) {
    console.warn('Error parsing column:', error);
    return null;
  }
}

// Simple regex-based parser as fallback
export function parseSimpleSQL(sqlCode: string): SQLDiagram {
  const tables: Table[] = [];
  const relationships: Relationship[] = [];

  // Match CREATE TABLE statements
  const createTableRegex = /CREATE\s+TABLE\s+(\w+)\s*\(([\s\S]*?)\);/gi;
  let match;

  while ((match = createTableRegex.exec(sqlCode)) !== null) {
    const tableName = match[1];
    const columnsText = match[2];

    const columns = parseSimpleColumns(columnsText);

    tables.push({
      name: tableName,
      columns
    });

    // Extract foreign key relationships
    columns.forEach(column => {
      if (column.foreignKey) {
        relationships.push({
          from: { table: tableName, column: column.name },
          to: { table: column.foreignKey.table, column: column.foreignKey.column },
          type: 'many-to-one'
        });
      }
    });
  }

  return { tables, relationships };
}

function parseSimpleColumns(columnsText: string): TableColumn[] {
  const columns: TableColumn[] = [];

  // Split by comma but handle parentheses
  const columnStrings = columnsText.split(/,(?![^()]*\))/).map(s => s.trim());

  columnStrings.forEach(columnStr => {
    if (columnStr.trim() === '') return;

    // Skip table constraints
    if (columnStr.match(/^\s*(PRIMARY\s+KEY|FOREIGN\s+KEY|UNIQUE|CHECK|CONSTRAINT)/i)) {
      return;
    }

    const parts = columnStr.trim().split(/\s+/);
    if (parts.length < 2) return;

    const name = parts[0];
    const type = parts[1];

    let nullable = true;
    let primaryKey = false;
    let foreignKey: { table: string; column: string } | undefined;

    const columnText = columnStr.toUpperCase();

    if (columnText.includes('NOT NULL')) {
      nullable = false;
    }

    if (columnText.includes('PRIMARY KEY')) {
      primaryKey = true;
      nullable = false;
    }

    // Look for REFERENCES
    const referencesMatch = columnStr.match(/REFERENCES\s+(\w+)\s*\((\w+)\)/i);
    if (referencesMatch) {
      foreignKey = {
        table: referencesMatch[1],
        column: referencesMatch[2]
      };
    }

    columns.push({
      name,
      type,
      nullable,
      primaryKey,
      foreignKey
    });
  });

  return columns;
}
