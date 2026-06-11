/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, MouseEvent, WheelEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Tag, 
  Clock, 
  X, 
  Search, 
  Maximize2, 
  Minimize2, 
  RefreshCw, 
  Link as LinkIcon 
} from 'lucide-react';
import type { GroundedNode } from '../types';

interface GraphVisualizerProps {
  nodes: GroundedNode[];
  onQueryNode?: (content: string) => void;
}

interface SimNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  data: GroundedNode;
}

interface SimLink {
  source: string;
  target: string;
  id: string;
}

export default function GraphVisualizer({ nodes, onQueryNode }: GraphVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Graph Data States
  const [simNodes, setSimNodes] = useState<SimNode[]>([]);
  const [simLinks, setSimLinks] = useState<SimLink[]>([]);
  const [selectedNode, setSelectedNode] = useState<GroundedNode | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Pan and Zoom States
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Drag Node State
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const nodeOffset = useRef({ x: 0, y: 0 });

  // Dimensions
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  // Handle Resize
  useEffect(() => {
    if (!containerRef.current) return;
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight || 500
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Compute Layout when nodes change
  useEffect(() => {
    if (nodes.length === 0) {
      setSimNodes([]);
      setSimLinks([]);
      return;
    }

    const { width, height } = dimensions;
    
    // 1. Identify Links
    const links: SimLink[] = [];
    const linkKeys = new Set<string>();

    // Link by neighborIds
    nodes.forEach(node => {
      if (node.neighborIds && Array.isArray(node.neighborIds)) {
        node.neighborIds.forEach(neighborId => {
          // Verify neighbor is in current search result set
          const exists = nodes.some(n => n.id === neighborId);
          if (exists) {
            const key1 = `${node.id}->${neighborId}`;
            const key2 = `${neighborId}->${node.id}`;
            if (!linkKeys.has(key1) && !linkKeys.has(key2)) {
              links.push({
                id: key1,
                source: node.id,
                target: neighborId
              });
              linkKeys.add(key1);
            }
          }
        });
      }
    });

    // Link by consecutive chunk_index from same file
    nodes.forEach(node => {
      const currentChunk = node.metadata.chunk_index;
      const currentFile = node.metadata.filename;
      if (currentChunk !== undefined && currentFile) {
        nodes.forEach(otherNode => {
          if (otherNode.id !== node.id && otherNode.metadata.filename === currentFile) {
            const otherChunk = otherNode.metadata.chunk_index;
            if (otherChunk !== undefined && Math.abs(currentChunk - otherChunk) === 1) {
              const key1 = `${node.id}->${otherNode.id}`;
              const key2 = `${otherNode.id}->${node.id}`;
              if (!linkKeys.has(key1) && !linkKeys.has(key2)) {
                links.push({
                  id: key1,
                  source: node.id,
                  target: otherNode.id
                });
                linkKeys.add(key1);
              }
            }
          }
        });
      }
    });

    // 2. Initialize simulation coordinates
    const initialNodes: SimNode[] = nodes.map((node, i) => {
      // Distribute in a neat circle
      const angle = (i / nodes.length) * 2 * Math.PI;
      const radius = Math.min(width, height) * 0.25 + Math.random() * 40;
      return {
        id: node.id,
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        data: node
      };
    });

    // 3. Run Force Simulation Ticks (Synchronously for instant stable layout)
    const k = Math.min(100, Math.sqrt((width * height) / (nodes.length || 1)) * 0.8);
    const repulsionConstant = k * k * 0.75;
    const attractionConstant = 0.06;
    const gravity = 0.04;
    const damping = 0.65;

    for (let tick = 0; tick < 160; tick++) {
      // Repulsion between all nodes
      for (let i = 0; i < initialNodes.length; i++) {
        const nodeA = initialNodes[i];
        for (let j = i + 1; j < initialNodes.length; j++) {
          const nodeB = initialNodes[j];
          const dx = nodeA.x - nodeB.x;
          const dy = nodeA.y - nodeB.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          
          if (dist < 280) {
            const force = repulsionConstant / (dist * dist);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            
            nodeA.vx += fx;
            nodeA.vy += fy;
            nodeB.vx -= fx;
            nodeB.vy -= fy;
          }
        }
      }

      // Attraction along links
      links.forEach(link => {
        const nodeA = initialNodes.find(n => n.id === link.source);
        const nodeB = initialNodes.find(n => n.id === link.target);
        if (nodeA && nodeB) {
          const dx = nodeA.x - nodeB.x;
          const dy = nodeA.y - nodeB.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          
          const force = attractionConstant * (dist - k * 0.7);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          
          nodeA.vx -= fx;
          nodeA.vy -= fy;
          nodeB.vx += fx;
          nodeB.vy += fy;
        }
      });

      // Gravity pulling to center & Update Positions
      initialNodes.forEach(node => {
        const dx = width / 2 - node.x;
        const dy = height / 2 - node.y;
        node.vx += dx * gravity;
        node.vy += dy * gravity;

        node.x += node.vx;
        node.y += node.vy;

        node.vx *= damping;
        node.vy *= damping;
      });
    }

    setSimNodes(initialNodes);
    setSimLinks(links);
    // Auto-select first node if none selected
    if (nodes.length > 0 && !selectedNode) {
      // Find the first node
      setSelectedNode(nodes[0]);
    }
  }, [nodes, dimensions]);

  // Pan operations
  const handleMouseDown = (e: MouseEvent<SVGSVGElement>) => {
    // Check if clicking background, not node
    const target = e.target as SVGElement;
    if (target.tagName === 'svg' || target.getAttribute('data-bg') === 'true') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: MouseEvent<SVGSVGElement>) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    } else if (draggedNodeId !== null) {
      // Update dragged node
      // Convert screen delta to zoom-relative canvas delta
      const canvasX = (e.clientX - pan.x) / zoom;
      const canvasY = (e.clientY - pan.y) / zoom;
      
      setSimNodes(prev => prev.map(n => {
        if (n.id === draggedNodeId) {
          return {
            ...n,
            x: canvasX - nodeOffset.current.x,
            y: canvasY - nodeOffset.current.y
          };
        }
        return n;
      }));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggedNodeId(null);
  };

  const handleWheel = (e: WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    const newZoom = e.deltaY < 0 ? zoom * zoomFactor : zoom / zoomFactor;
    setZoom(Math.max(0.2, Math.min(4, newZoom)));
  };

  // Drag Node operations
  const handleNodeDragStart = (e: MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setDraggedNodeId(nodeId);
    
    const node = simNodes.find(n => n.id === nodeId);
    if (node) {
      const canvasX = (e.clientX - pan.x) / zoom;
      const canvasY = (e.clientY - pan.y) / zoom;
      
      // Calculate offset of mouse click inside the node structure
      nodeOffset.current = {
        x: canvasX - node.x,
        y: canvasY - node.y
      };
    }
  };

  const resetView = () => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
  };

  // Graph styling helpers
  const getNodeColor = (node: GroundedNode) => {
    const isr = node.metadata.domain || node.type || '';
    if (isr.toUpperCase().includes('AEROSPACE')) return '#f27420'; // ISRO Orange
    if (isr.toUpperCase().includes('GOVERN')) return '#3b82f6'; // Deep Blue
    if (node.metadata.source === 'frontend-upload') return '#10b981'; // Emerald
    return '#8b5cf6'; // Purple
  };

  // Connections helper for hover highlight
  const getConnectedNodeIds = (nodeId: string | null) => {
    if (!nodeId) return new Set<string>();
    const connected = new Set<string>([nodeId]);
    simLinks.forEach(link => {
      if (link.source === nodeId) connected.add(link.target);
      if (link.target === nodeId) connected.add(link.source);
    });
    return connected;
  };

  const activeHighlights = getConnectedNodeIds(hoveredNodeId);

  return (
    <div ref={containerRef} className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-zinc-800 bg-linear-to-br from-zinc-950 to-black select-none">
      
      {/* Zoom / Pan Controls */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-1 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 p-1.5 rounded-xl">
        <button 
          onClick={() => setZoom(prev => Math.min(4, prev * 1.2))}
          className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors text-xs font-bold font-mono"
          title="Zoom In"
        >
          +
        </button>
        <button 
          onClick={() => setZoom(prev => Math.max(0.2, prev / 1.2))}
          className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors text-xs font-bold font-mono"
          title="Zoom Out"
        >
          -
        </button>
        <button 
          onClick={resetView}
          className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
          title="Reset View"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
        <div className="px-2 text-[10px] font-mono text-zinc-500">
          {(zoom * 100).toFixed(0)}%
        </div>
      </div>

      {/* SVG Canvas */}
      <svg
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <rect width="100%" height="100%" fill="transparent" data-bg="true" />
        
        {/* Glow Filters */}
        <defs>
          <filter id="node-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Links/Edges */}
          {simLinks.map(link => {
            const sourceNode = simNodes.find(n => n.id === link.source);
            const targetNode = simNodes.find(n => n.id === link.target);
            if (!sourceNode || !targetNode) return null;

            // Determine if dimmed due to hover state
            const isHoverActive = hoveredNodeId !== null;
            const isHighlighted = isHoverActive && activeHighlights.has(link.source) && activeHighlights.has(link.target);
            const opacity = isHoverActive ? (isHighlighted ? 0.8 : 0.1) : 0.35;

            return (
              <line
                key={link.id}
                x1={sourceNode.x}
                y1={sourceNode.y}
                x2={targetNode.x}
                y2={targetNode.y}
                stroke="#52525b"
                strokeWidth={isHighlighted ? 2 : 1}
                strokeDasharray={sourceNode.data.metadata.source === 'frontend-upload' ? "4,4" : undefined}
                style={{ opacity, transition: 'opacity 0.2s, stroke-width 0.2s' }}
              />
            );
          })}

          {/* Nodes */}
          {simNodes.map(node => {
            const isSelected = selectedNode?.id === node.id;
            const isHoverActive = hoveredNodeId !== null;
            const isHighlighted = isHoverActive ? activeHighlights.has(node.id) : true;
            const opacity = isHoverActive ? (isHighlighted ? 1.0 : 0.2) : 1.0;
            const nodeColor = getNodeColor(node.data);

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNode(node.data);
                }}
                className="cursor-pointer"
                style={{ opacity, transition: 'opacity 0.2s' }}
              >
                {/* Outer selection ring */}
                {isSelected && (
                  <circle
                    r={22}
                    fill="none"
                    stroke={nodeColor}
                    strokeWidth={2}
                    className="animate-pulse"
                  />
                )}

                {/* Main Node Circle */}
                <circle
                  r={14}
                  fill={nodeColor}
                  className="transition-all duration-300"
                  style={{
                    filter: isSelected ? 'url(#node-glow)' : undefined,
                    fillOpacity: isSelected ? 0.95 : 0.75,
                  }}
                  onMouseDown={(e) => handleNodeDragStart(e, node.id)}
                />

                {/* Node Icon/Indicator */}
                <circle
                  r={4}
                  fill="#fff"
                  style={{ opacity: 0.8 }}
                />

                {/* Label text */}
                <text
                  y={30}
                  textAnchor="middle"
                  fill="#e4e4e7"
                  fontSize={10}
                  className="font-mono font-bold tracking-tight pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                >
                  {node.data.metadata.filename.split('.').slice(0, -1).join('.') || node.data.metadata.filename}
                </text>
                
                {/* Subtext: Chunk Index */}
                {node.data.metadata.chunk_index !== undefined && (
                  <text
                    y={42}
                    textAnchor="middle"
                    fill="#71717a"
                    fontSize={8}
                    className="font-mono pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                  >
                    CH-{node.data.metadata.chunk_index}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Selected Node Details Drawer */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ x: 340, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 340, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className="absolute top-4 right-4 bottom-4 w-80 bg-zinc-950/90 backdrop-blur-xl border border-zinc-800 rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col z-20"
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-zinc-800 pb-3 mb-4 shrink-0">
              <div className="min-w-0">
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">
                  NODE_SPECS
                </span>
                <h3 className="text-sm font-bold text-zinc-100 truncate flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-isro-orange shrink-0" />
                  {selectedNode.metadata.filename}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedNode(null)}
                className="text-zinc-500 hover:text-white p-1 hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Details */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
              {/* Domain & Type Badges */}
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-0.5 rounded bg-zinc-900 text-[10px] font-mono border border-zinc-800 text-zinc-400 flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {selectedNode.metadata.domain || selectedNode.type}
                </span>
                {selectedNode.metadata.subsystem && (
                  <span className="px-2 py-0.5 rounded bg-isro-orange/10 text-[10px] font-mono border border-isro-orange/20 text-isro-orange">
                    {selectedNode.metadata.subsystem}
                  </span>
                )}
                {selectedNode.metadata.chunk_index !== undefined && (
                  <span className="px-2 py-0.5 rounded bg-zinc-900 text-[10px] font-mono border border-zinc-800 text-zinc-400">
                    Chunk {selectedNode.metadata.chunk_index + 1}
                  </span>
                )}
              </div>

              {/* Similarity Score */}
              <div className="flex justify-between items-center p-3 bg-zinc-900/50 rounded-xl border border-zinc-900">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">Match Score</span>
                <span className="text-sm font-mono text-isro-blue font-bold">
                  {selectedNode.score !== undefined ? (selectedNode.score).toFixed(4) : 'REAL_TIME_INDEX'}
                </span>
              </div>

              {/* Chunk Content Text */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">
                  Grounding Text
                </span>
                <div className="p-3 bg-black/40 border border-zinc-800/80 rounded-xl text-xs text-zinc-300 leading-relaxed max-h-56 overflow-y-auto font-sans italic scrollbar-thin">
                  "{selectedNode.content}"
                </div>
              </div>

              {/* Neighbor Links Info */}
              {selectedNode.neighborIds && selectedNode.neighborIds.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">
                    Ontological Neighbors
                  </span>
                  <div className="space-y-1.5">
                    {selectedNode.neighborIds.map(nid => (
                      <div key={nid} className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 bg-zinc-900/30 p-1.5 rounded border border-zinc-900 truncate">
                        <LinkIcon className="w-3 h-3 text-zinc-600" />
                        {nid}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            {onQueryNode && (
              <div className="mt-4 pt-3 border-t border-zinc-800 shrink-0">
                <button
                  onClick={() => onQueryNode(selectedNode.content)}
                  className="w-full flex items-center justify-center gap-2 bg-isro-orange hover:bg-orange-500 text-white font-bold text-xs uppercase py-2.5 rounded-xl transition-all font-sans cursor-pointer shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20"
                >
                  <Search className="w-3.5 h-3.5" />
                  Query this chunk context
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
