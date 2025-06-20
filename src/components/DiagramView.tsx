import React, { useMemo, useCallback } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  ConnectionMode,
  ReactFlowProvider,
  Position,
} from 'reactflow';
import type { Node, Edge, Connection } from 'reactflow';
import dagre from 'dagre';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { SQLDiagram, Table } from '@/lib/sqlParser';

import 'reactflow/dist/style.css';

interface TableNodeData {
  table: Table;
}

interface TableNodeProps {
  data: TableNodeData;
}

const TableNode: React.FC<TableNodeProps> = ({ data }) => {
  const { table } = data;

  return (
    <Card className="min-w-[250px] shadow-lg border-2">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-center">
          {table.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {table.columns.map((column, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 rounded bg-muted/30"
            >
              <div className="flex items-center space-x-2">
                <span className="font-medium">{column.name}</span>
                {column.primaryKey && (
                  <Badge variant="default" className="text-xs">
                    PK
                  </Badge>
                )}
                {column.foreignKey && (
                  <Badge variant="secondary" className="text-xs">
                    FK
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-sm text-muted-foreground">
                  {column.type}
                </span>
                {!column.nullable && (
                  <span className="text-xs text-red-500">*</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const nodeTypes = {
  table: TableNode,
};

interface DiagramViewProps {
  diagram: SQLDiagram;
}

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 250, height: 300 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = Position.Top;
    node.sourcePosition = Position.Bottom;

    // We are shifting the dagre node position (anchor=center center) to the top left
    // so it matches the React Flow node anchor point (top left).
    node.position = {
      x: nodeWithPosition.x - 125,
      y: nodeWithPosition.y - 150,
    };

    return node;
  });

  return { nodes, edges };
};

export const DiagramView: React.FC<DiagramViewProps> = ({ diagram }) => {
  const initialNodes: Node[] = useMemo(() => {
    return diagram.tables.map((table, index) => ({
      id: table.name,
      type: 'table',
      position: { x: index * 300, y: 0 },
      data: { table },
    }));
  }, [diagram.tables]);

  const initialEdges: Edge[] = useMemo(() => {
    return diagram.relationships.map((rel, index) => ({
      id: `e${index}`,
      source: rel.from.table,
      target: rel.to.table,
      type: 'smoothstep',
      animated: true,
      label: rel.type,
      style: { stroke: '#64748b' },
      labelStyle: { fontSize: 12, fontWeight: 'bold' },
      labelBgStyle: { fill: 'white', fillOpacity: 0.8 },
    }));
  }, [diagram.relationships]);

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => getLayoutedElements(initialNodes, initialEdges),
    [initialNodes, initialEdges]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Update nodes and edges when diagram changes
  React.useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = getLayoutedElements(
      initialNodes,
      initialEdges
    );
    setNodes(newNodes);
    setEdges(newEdges);
  }, [diagram, initialNodes, initialEdges, setNodes, setEdges]);

  if (diagram.tables.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">No Tables Found</h3>
          <p className="text-muted-foreground">
            Enter SQL CREATE TABLE statements in the editor to visualize your database schema.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        className="bg-background"
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
};

export const DiagramViewWithProvider: React.FC<DiagramViewProps> = (props) => (
  <ReactFlowProvider>
    <DiagramView {...props} />
  </ReactFlowProvider>
);
