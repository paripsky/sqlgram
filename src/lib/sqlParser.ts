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

export interface SQLError {
  message: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  severity: 'error' | 'warning';
}

export interface SQLParseResult {
  diagram: SQLDiagram;
  errors: SQLError[];
  isValid: boolean;
}

export interface SQLDiagram {
  tables: Table[];
  relationships: Relationship[];
}

export function parseSQLToDiagram(sqlCode: string): SQLParseResult {
  const tables: Table[] = [];
  const relationships: Relationship[] = [];
  const errors: SQLError[] = [];

  if (!sqlCode.trim()) {
    return {
      diagram: { tables, relationships },
      errors: [],
      isValid: true
    };
  }

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
          const referencedTable = tables.find(t => t.name === column.foreignKey!.table);
          if (referencedTable) {
            const relationshipType = determineRelationshipType(
              table,
              column.name,
              referencedTable,
              column.foreignKey.column
            );

            relationships.push({
              from: { table: table.name, column: column.name },
              to: { table: column.foreignKey.table, column: column.foreignKey.column },
              type: relationshipType
            });
          }
        }
      });
    });

    // Update relationship types based on actual table structure
    relationships.forEach(relationship => {
      const fromTable = tables.find(table => table.name === relationship.from.table);
      const toTable = tables.find(table => table.name === relationship.to.table);

      if (fromTable && toTable) {
        relationship.type = determineRelationshipType(
          fromTable,
          relationship.from.column,
          toTable,
          relationship.to.column
        );
      }
    });

  } catch (error) {
    console.warn('SQL parsing error:', error);

    // Extract error information from sql-parser-cst errors
    const sqlError = error as {
      message?: string;
    };

    const message = sqlError.message || 'SQL parsing failed';
    const { line, column, cleanMessage } = parseErrorLocation(message);

    errors.push({
      message: cleanMessage,
      line,
      column,
      severity: 'error'
    });
  }

  return {
    diagram: { tables, relationships },
    errors,
    isValid: errors.length === 0
  };
}

function parseCreateTable(statement: Record<string, unknown>): Table | null {
  try {
    const nameObj = statement.name as Record<string, unknown>;
    const tableName = nameObj?.name || nameObj?.text;
    if (!tableName) return null;

    const columns: TableColumn[] = [];

    // Handle the new AST structure where columns are in columns.expr.items
    const columnsObj = statement.columns as Record<string, unknown>;
    const expr = columnsObj?.expr as Record<string, unknown>;
    const items = expr?.items as unknown[];

    if (items) {
      items.forEach((col: unknown) => {
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
    const nameObj = col.name as Record<string, unknown>;
    const name = nameObj?.name || nameObj?.text;
    if (!name) return null;

    // Handle dataType which can be a complex object
    const dataTypeObj = col.dataType as Record<string, unknown>;
    let dataType = 'unknown';

    if (dataTypeObj) {
      const typeNameObj = dataTypeObj.name as Record<string, unknown>;
      dataType = (typeNameObj?.name || typeNameObj?.text || dataTypeObj.type) as string || 'unknown';
    }

    let nullable = true;
    let primaryKey = false;
    let foreignKey: { table: string; column: string } | undefined;

    // Check constraints
    if (col.constraints) {
      (col.constraints as unknown[]).forEach((constraint: unknown) => {
        const constraintObj = constraint as Record<string, unknown>;
        const constraintType = constraintObj.type;

        if (constraintType === 'constraint_not_null') {
          nullable = false;
        }
        if (constraintType === 'constraint_primary_key') {
          primaryKey = true;
          nullable = false;
        }
        if (constraintType === 'references_specification') {
          // Handle REFERENCES table(column) syntax
          const tableObj = constraintObj.table as Record<string, unknown>;
          const table = tableObj?.name || tableObj?.text;

          const columnsObj = constraintObj.columns as Record<string, unknown>;
          const expr = columnsObj?.expr as Record<string, unknown>;
          const items = expr?.items as unknown[];
          const firstItem = items?.[0] as Record<string, unknown>;
          const column = firstItem?.name || firstItem?.text || 'id';

          if (table) {
            foreignKey = {
              table: table as string,
              column: column as string
            };
          }
        }
        if (constraintType === 'constraint_foreign_key') {
          // Handle separate FOREIGN KEY constraint syntax
          const references = constraintObj.references as Record<string, unknown>;
          if (references) {
            const tableObj = references.table as Record<string, unknown>;
            const table = tableObj?.name || tableObj?.text;
            const columnsArray = references.columns as unknown[];
            const columnObj = columnsArray?.[0] as Record<string, unknown>;
            const column = columnObj?.name || columnObj?.text || 'id';

            if (table) {
              foreignKey = {
                table: table as string,
                column: column as string
              };
            }
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
export function parseSimpleSQL(sqlCode: string): SQLParseResult {
  const tables: Table[] = [];
  const relationships: Relationship[] = [];
  const errors: SQLError[] = [];

  if (!sqlCode.trim()) {
    return {
      diagram: { tables, relationships },
      errors: [],
      isValid: true
    };
  }

  try {
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
            type: 'many-to-one' // Will be updated later
          });
        }
      });
    }

    // Basic validation - check for unmatched parentheses
    const openParens = (sqlCode.match(/\(/g) || []).length;
    const closeParens = (sqlCode.match(/\)/g) || []).length;

    if (openParens !== closeParens) {
      errors.push({
        message: 'Unmatched parentheses in SQL',
        line: 1,
        column: 1,
        severity: 'error'
      });
    }

    // Check for common typos with better position detection
    const commonTypos = [
      { pattern: /CREATE\s+TABEL/gi, message: 'Did you mean CREATE TABLE?' },
      { pattern: /PRIMRY\s+KEY/gi, message: 'Did you mean PRIMARY KEY?' },
      { pattern: /REFRENCES/gi, message: 'Did you mean REFERENCES?' },
      { pattern: /FORIGN\s+KEY/gi, message: 'Did you mean FOREIGN KEY?' }
    ];

    commonTypos.forEach(({ pattern, message }) => {
      const match = pattern.exec(sqlCode);
      if (match) {
        // Find line and column of the match
        const beforeMatch = sqlCode.substring(0, match.index);
        const lines = beforeMatch.split('\n');
        const line = lines.length;
        const column = lines[lines.length - 1].length + 1;

        errors.push({
          message,
          line,
          column,
          severity: 'warning'
        });
      }
    });

    // Update relationship types based on actual table structure
    relationships.forEach(relationship => {
      const fromTable = tables.find(table => table.name === relationship.from.table);
      const toTable = tables.find(table => table.name === relationship.to.table);

      if (fromTable && toTable) {
        relationship.type = determineRelationshipType(
          fromTable,
          relationship.from.column,
          toTable,
          relationship.to.column
        );
      }
    });

  } catch (error) {
    console.warn('Simple SQL parsing error:', error);
    const sqlError = error as { message?: string };
    errors.push({
      message: sqlError.message || 'SQL parsing failed',
      line: 1,
      column: 1,
      severity: 'error'
    });
  }

  return {
    diagram: { tables, relationships },
    errors,
    isValid: errors.length === 0
  };
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

// Utility function to parse error location from sql-parser-cst error messages
function parseErrorLocation(errorMessage: string): { line: number; column: number; cleanMessage: string } {
  let line = 1;
  let column = 1;
  let cleanMessage = errorMessage;

  // Parse line and column from FormattedSyntaxError message
  // Format: "--> undefined:1:43" or similar
  const locationMatch = errorMessage.match(/-->\s*(?:\w*:)?(\d+):(\d+)/);
  if (locationMatch) {
    line = parseInt(locationMatch[1], 10);
    column = parseInt(locationMatch[2], 10);
  }

  // Extract the main error message (before the location info)
  const mainErrorMatch = errorMessage.match(/^([^-\n]+?)(?:\s*-->|\s*Was expecting|\s*$)/);
  if (mainErrorMatch) {
    cleanMessage = mainErrorMatch[1].trim();
  }

  return { line, column, cleanMessage };
}

// Determine relationship type based on foreign key constraints
function determineRelationshipType(
  fromTable: Table,
  fromColumn: string,
  toTable: Table,
  toColumn: string
): 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many' {
  // Find the foreign key column in the source table
  const fkColumn = fromTable.columns.find(col => col.name === fromColumn);

  // Find the referenced column in the target table
  const referencedColumn = toTable.columns.find(col => col.name === toColumn);

  // If the foreign key column is a primary key or unique, it's likely one-to-one
  if (fkColumn?.primaryKey) {
    return 'one-to-one';
  }

  // If the referenced column is a primary key (which is typical), it's many-to-one
  if (referencedColumn?.primaryKey) {
    // Check if this is a junction table (many-to-many scenario)
    // A junction table typically has only foreign keys as columns and a composite primary key
    const isJunctionTable = fromTable.columns.every(col => col.foreignKey || col.primaryKey) &&
      fromTable.columns.filter(col => col.foreignKey).length >= 2;

    if (isJunctionTable) {
      return 'many-to-many';
    }

    return 'many-to-one';
  }

  // Default to many-to-one if we can't determine otherwise
  return 'many-to-one';
}
