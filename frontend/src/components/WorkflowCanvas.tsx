'use client';

import ReactFlow, {
  Node, Edge, Controls, Background,
  MiniMap, addEdge, useNodesState,
  useEdgesState, BackgroundVariant,
  Panel, NodeTypes, Connection,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useCallback } from 'react';

// TriggerNode — green border
const TriggerNode = ({ data }: { data: any }) => (
  <div className="px-4 py-3 rounded-xl border-2 border-green-400 bg-white shadow-lg min-w-[180px] cursor-pointer hover:shadow-xl transition-shadow">
    <div className="flex items-center gap-2 mb-1">
      <span className="text-lg">{data.icon || '🎯'}</span>
      <span className="text-xs font-black text-green-600 uppercase tracking-wide">Trigger</span>
    </div>
    <p className="font-bold text-slate-900 text-sm">
      {data.label}
    </p>
    <p className="text-xs text-slate-500 mt-0.5">
      {data.description}
    </p>
  </div>
);

// ActionNode — blue border
const ActionNode = ({ data }: { data: any }) => (
  <div className="px-4 py-3 rounded-xl border-2 border-blue-400 bg-white shadow-lg min-w-[180px] cursor-pointer hover:shadow-xl transition-shadow">
    <div className="flex items-center gap-2 mb-1">
      <span className="text-lg">{data.icon || '⚡'}</span>
      <span className="text-xs font-black text-blue-600 uppercase tracking-wide">Action</span>
    </div>
    <p className="font-bold text-slate-900 text-sm">
      {data.label}
    </p>
    <p className="text-xs text-slate-500 mt-0.5">
      {data.description}
    </p>
  </div>
);

// ConditionNode — yellow/amber border
const ConditionNode = ({ data }: { data: any }) => (
  <div className="px-4 py-3 rounded-xl border-2 border-amber-400 bg-white shadow-lg min-w-[180px] cursor-pointer hover:shadow-xl transition-shadow">
    <div className="flex items-center gap-2 mb-1">
      <span className="text-lg">{data.icon || '🔀'}</span>
      <span className="text-xs font-black text-amber-600 uppercase tracking-wide">Condition</span>
    </div>
    <p className="font-bold text-slate-900 text-sm">
      {data.label}
    </p>
    <p className="text-xs text-slate-500 mt-0.5">
      {data.description}
    </p>
  </div>
);

// EndNode — red border
const EndNode = ({ data }: { data: any }) => (
  <div className="px-4 py-3 rounded-xl border-2 border-red-400 bg-white shadow-lg min-w-[180px] cursor-pointer hover:shadow-xl transition-shadow">
    <div className="flex items-center gap-2 mb-1">
      <span className="text-lg">{data.icon || '🏁'}</span>
      <span className="text-xs font-black text-red-600 uppercase tracking-wide">End</span>
    </div>
    <p className="font-bold text-slate-900 text-sm">
      {data.label}
    </p>
    <p className="text-xs text-slate-500 mt-0.5">
      {data.description}
    </p>
  </div>
);

const nodeTypes: NodeTypes = {
  triggerNode:   TriggerNode,
  actionNode:    ActionNode,
  conditionNode: ConditionNode,
  endNode:       EndNode,
};

interface WorkflowCanvasProps {
  initialNodes: Node[];
  initialEdges: Edge[];
  onSave: (nodes: Node[], edges: Edge[]) => void;
  readOnly?: boolean;
}

export default function WorkflowCanvas({
  initialNodes,
  initialEdges,
  onSave,
  readOnly = false,
}: WorkflowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => 
      setEdges(eds => addEdge({
        ...params,
        animated: true,
        style: { stroke: '#6366f1', strokeWidth: 2 }
      }, eds)),
    [setEdges]
  );

  return (
    <div style={{ width: '100%', height: '600px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={readOnly ? undefined : onNodesChange}
        onEdgesChange={readOnly ? undefined : onEdgesChange}
        onConnect={readOnly ? undefined : onConnect}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: '#6366f1', strokeWidth: 2 }
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          color="#e2e8f0"
        />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            switch(node.type) {
              case 'triggerNode':   return '#4ade80';
              case 'actionNode':    return '#60a5fa';
              case 'conditionNode': return '#fbbf24';
              case 'endNode':       return '#f87171';
              default:              return '#6366f1';
            }
          }}
          style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
          }}
        />
        {!readOnly && (
          <Panel position="top-right">
            <button
              onClick={() => onSave(nodes, edges)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-indigo-700 transition-all"
            >
              💾 Save Workflow
            </button>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}
