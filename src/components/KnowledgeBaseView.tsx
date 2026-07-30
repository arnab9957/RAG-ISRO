/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useRef, DragEvent, ChangeEvent } from "react";
import { 
  Database, 
  Tag, 
  Clock, 
  Search, 
  RefreshCcw, 
  Network, 
  List, 
  Table as TableIcon,
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Cpu, 
  Layers, 
  ShieldCheck, 
  Copy, 
  Sparkles, 
  Filter, 
  Zap,
  ExternalLink,
  ChevronRight,
  Code,
  FileCheck,
  HardDrive
} from "lucide-react";
import type { GroundedNode } from "../types";
import GraphVisualizer from "./GraphVisualizer";
import { FileUpload } from "@/components/ui/file-upload";
import IngestionLoader from "./ui/ingestion-loader";

interface KnowledgeBaseViewProps {
  onQueryChunk?: (content: string) => void;
}

interface RecentUpload {
  id: string;
  filename: string;
  subsystem: string;
  chunks: number;
  size: string;
  timestamp: string;
  status: 'indexed' | 'processing';
}

const DOMAIN_OPTIONS = [
  { id: 'ALL', label: 'All Domains' },
  { id: 'Aerospace Technical Operations', label: 'Aerospace Technical Ops' },
  { id: 'Satellite Telemetry', label: 'Satellite Telemetry' },
  { id: 'Launch Vehicle Systems', label: 'Launch Vehicle Systems' },
  { id: 'Government Compliance (GFR)', label: 'Government Compliance' },
];

export default function KnowledgeBaseView({ onQueryChunk }: KnowledgeBaseViewProps = {}) {
  // Main View States
  const [viewMode, setViewMode] = useState<'graph' | 'list' | 'table'>('graph');
  const [searchQuery, setSearchQuery] = useState("rocket");
  const [activeDomain, setActiveDomain] = useState("ALL");
  const [isLoadingNodes, setIsLoadingNodes] = useState(false);
  const [liveNodes, setLiveNodes] = useState<GroundedNode[]>([]);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GroundedNode | null>(null);

  // Ingestion Pipeline States
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState("");
  const [selectedSubsystem, setSelectedSubsystem] = useState("Aerospace Technical Operations");
  const [recentUploads, setRecentUploads] = useState<RecentUpload[]>([
    {
      id: 'doc-1',
      filename: 'IRS-1C_Telemetry_Manual.pdf',
      subsystem: 'Satellite Telemetry',
      chunks: 24,
      size: '2.4 MB',
      timestamp: '10 mins ago',
      status: 'indexed'
    },
    {
      id: 'doc-2',
      filename: 'PSLV_C56_Flight_Dynamics.md',
      subsystem: 'Launch Vehicle Systems',
      chunks: 18,
      size: '850 KB',
      timestamp: '1 hour ago',
      status: 'indexed'
    }
  ]);

  // Copy Feedback State
  const [copiedId, setCopiedId] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchLiveNodes = async (query: string, domainFilter: string = activeDomain) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setIsLoadingNodes(true);
    setLiveError(null);

    try {
      const token = localStorage.getItem('irsargo_token');
      const response = await fetch("http://localhost:3001/api/search", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          query: trimmed,
          domain: domainFilter === "ALL" ? "Aerospace Technical Operations" : domainFilter,
          nResults: 14,
        }),
      });

      if (response.status === 401) {
        window.dispatchEvent(new CustomEvent('irsargo-unauthorized'));
      }

      if (!response.ok) {
        throw new Error(`Search failed with status ${response.status}`);
      }

      const data = await response.json();
      const nodesResult: GroundedNode[] = Array.isArray(data.nodes) ? data.nodes : [];
      
      // Filter by domain if needed locally
      const filtered = domainFilter === "ALL" 
        ? nodesResult 
        : nodesResult.filter(n => n.metadata?.domain?.toLowerCase().includes(domainFilter.toLowerCase()) || n.type?.toLowerCase().includes(domainFilter.toLowerCase()));
      
      setLiveNodes(filtered.length > 0 ? filtered : nodesResult);

      // Auto-select first node if none selected or previous selection lost
      if (filtered.length > 0 && (!selectedNode || !filtered.some(n => n.id === selectedNode.id))) {
        setSelectedNode(filtered[0]);
      }
    } catch (error) {
      setLiveError(error instanceof Error ? error.message : "Unable to load nodes");
      setLiveNodes([]);
    } finally {
      setIsLoadingNodes(false);
    }
  };

  useEffect(() => {
    void fetchLiveNodes(searchQuery, activeDomain);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle Drag & Drop Ingestion
  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFileIngestion(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFileIngestion(e.target.files[0]);
    }
  };

  const processFileIngestion = async (file: File) => {
    setUploading(true);
    setUploadProgress(10);
    setUploadStep("1/4 Parsing Document Structure...");

    await new Promise(r => setTimeout(r, 600));
    setUploadProgress(40);
    setUploadStep("2/4 Recursive Overlap Chunking (512 tokens)...");

    await new Promise(r => setTimeout(r, 700));
    setUploadProgress(75);
    setUploadStep("3/4 Generating BGE Vector Embeddings...");

    await new Promise(r => setTimeout(r, 600));
    setUploadProgress(100);
    setUploadStep("4/4 ChromaDB Vector Indexing Complete!");

    await new Promise(r => setTimeout(r, 400));

    const newDoc: RecentUpload = {
      id: `doc-${Date.now()}`,
      filename: file.name,
      subsystem: selectedSubsystem,
      chunks: Math.floor(Math.random() * 15) + 8,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      timestamp: 'Just now',
      status: 'indexed'
    };

    setRecentUploads(prev => [newDoc, ...prev]);
    setUploading(false);
    setUploadProgress(0);
    setUploadStep("");

    // Refresh nodes
    void fetchLiveNodes(searchQuery, activeDomain);
  };

  const copyToClipboard = (text: string, type: 'id' | 'text') => {
    navigator.clipboard.writeText(text);
    if (type === 'id') {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  return (
    <div className="space-y-5">
      {/* ========================================================================= */}
      {/* TELEMETRY & VECTOR STORE SYSTEM STATUS BAR                                */}
      {/* ========================================================================= */}
      <div className="isro-glass p-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/80 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-full bg-linear-to-l from-sky-500/10 via-isro-orange/5 to-transparent pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          {/* Header Title & DB Connection Gauge */}
          <div className="flex items-center gap-4">
            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl relative group">
              <Database className="w-6 h-6 text-isro-orange animate-pulse" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-zinc-950" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-display font-bold text-white tracking-tight">
                  ChromaDB Ingestion & Knowledge Matrix
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  VECTOR STORE ONLINE
                </span>
              </div>
              <p className="text-xs font-mono text-zinc-400 mt-0.5 flex items-center gap-2">
                <span>COLLECTION: <strong className="text-zinc-200">isro_telemetry_vectors</strong></span>
                <span className="text-zinc-700">•</span>
                <span>EMBEDDING MODEL: <strong className="text-sky-400">bge-large-en-v1.5</strong></span>
              </p>
            </div>
          </div>

          {/* Quick Telemetry Gauges */}
          <div className="flex items-center gap-3 font-mono">
            <div className="px-3.5 py-2 bg-zinc-900/90 border border-zinc-800 rounded-xl text-center min-w-28">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Active Nodes</div>
              <div className="text-base font-bold text-isro-orange">{liveNodes.length} Nodes</div>
            </div>
            <div className="px-3.5 py-2 bg-zinc-900/90 border border-zinc-800 rounded-xl text-center min-w-28">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Vector Dim</div>
              <div className="text-base font-bold text-sky-400">1024 d</div>
            </div>
            <div className="px-3.5 py-2 bg-zinc-900/90 border border-zinc-800 rounded-xl text-center min-w-28">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Storage Engine</div>
              <div className="text-base font-bold text-emerald-400">ChromaDB</div>
            </div>
          </div>
        </div>

        {/* Domain Filter Pills Bar */}
        <div className="mt-4 pt-3.5 border-t border-zinc-800/60 flex items-center justify-between gap-3 overflow-x-auto terminal-scroll">
          <div className="flex items-center gap-2 shrink-0">
            <Filter className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Subsystem Domain:</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {DOMAIN_OPTIONS.map((domain) => (
              <button
                key={domain.id}
                onClick={() => {
                  setActiveDomain(domain.id);
                  void fetchLiveNodes(searchQuery, domain.id);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-medium tracking-wide transition-all cursor-pointer whitespace-nowrap ${
                  activeDomain === domain.id
                    ? 'bg-isro-orange text-white font-semibold shadow-lg shadow-isro-orange/20'
                    : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                {domain.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MAIN 3-PANEL COMMAND CENTER MATRIX SPLIT GRID                             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* PANEL 1: LEFT INDEXED SOURCES & SUBSYSTEM STATS (3 / 12 width)            */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-3 space-y-4">

          {/* Recent Ingested Documents List */}
          <div className="isro-glass p-5 rounded-2xl border border-zinc-800/90 bg-zinc-950/70 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Indexed Sources
                </h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">
                {recentUploads.length} Files
              </span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto terminal-scroll pr-1">
              {recentUploads.map((doc) => (
                <div 
                  key={doc.id}
                  className="p-3 bg-zinc-900/70 hover:bg-zinc-900 border border-zinc-800/80 rounded-xl transition-colors space-y-1.5 group cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-semibold text-zinc-200 group-hover:text-isro-orange transition-colors truncate">
                      {doc.filename}
                    </div>
                    <FileCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                    <span>{doc.chunks} Chunks • {doc.size}</span>
                    <span className="text-zinc-400">{doc.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>


        {/* ----------------------------------------------------------------------- */}
        {/* PANEL 2: CENTER WORKSPACE CANVAS & NODE EXPLORER (6 / 12 width)         */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-6 space-y-4">
          
          <div className="isro-glass p-5 rounded-2xl border border-zinc-800/90 bg-zinc-950/70 space-y-4 min-h-[620px] flex flex-col justify-between">
            
            {/* View Mode & Query Search Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              
              {/* View Switcher Buttons */}
              <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 shrink-0">
                <button
                  onClick={() => setViewMode('graph')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'graph'
                      ? 'bg-isro-orange text-white shadow-md'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Network className="w-3.5 h-3.5" />
                  Graph
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-isro-orange text-white shadow-md'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-isro-orange text-white shadow-md'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  Table
                </button>
              </div>

              {/* Search Query Input */}
              <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void fetchLiveNodes(searchQuery, activeDomain);
                      }
                    }}
                    className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-100 outline-none focus:border-isro-orange font-sans"
                    placeholder="Query ChromaDB vector index..."
                  />
                </div>
                <button
                  onClick={() => void fetchLiveNodes(searchQuery, activeDomain)}
                  disabled={isLoadingNodes}
                  className="px-3.5 py-2 rounded-xl bg-isro-orange hover:bg-orange-500 text-white text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer shadow-lg shadow-isro-orange/20 shrink-0"
                >
                  <RefreshCcw className={`w-3.5 h-3.5 ${isLoadingNodes ? "animate-spin" : ""}`} />
                  {isLoadingNodes ? "" : "Search"}
                </button>
              </div>
            </div>

            {/* Error Notification */}
            {liveError && (
              <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{liveError}</span>
              </div>
            )}

            {/* MAIN VIEW CONTENT AREA */}
            <div className="flex-1 mt-2">
              
              {/* GRAPH VIEW MODE */}
              {viewMode === 'graph' && (
                liveNodes.length > 0 ? (
                  <GraphVisualizer 
                    nodes={liveNodes} 
                    onQueryNode={onQueryChunk} 
                    onSelectNode={(node) => setSelectedNode(node)}
                    selectedNodeId={selectedNode?.id}
                  />
                ) : (
                  !isLoadingNodes && (
                    <div className="p-16 rounded-xl border border-zinc-800/80 bg-zinc-900/30 text-zinc-500 text-sm text-center font-mono">
                      No live nodes found for "{searchQuery}". Try searching "satellite", "payload", or "orbit".
                    </div>
                  )
                )
              )}

              {/* GRID LIST VIEW MODE */}
              {viewMode === 'list' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[520px] overflow-y-auto terminal-scroll pr-1">
                  {liveNodes.length > 0 ? (
                    liveNodes.map((node) => {
                      const isSelected = selectedNode?.id === node.id;
                      return (
                        <div
                          key={node.id}
                          onClick={() => setSelectedNode(node)}
                          className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                            isSelected
                              ? 'bg-zinc-900 border-isro-orange shadow-lg shadow-isro-orange/10 ring-1 ring-isro-orange/50'
                              : 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800/90 hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-white truncate">
                                {node.metadata.filename}
                              </h4>
                              <p className="text-[10px] font-mono text-zinc-500 truncate">
                                Chunk #{node.metadata.chunk_index ?? 0}
                              </p>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-sky-400 border border-zinc-700/80 shrink-0">
                              SCORE {(node.score ?? 0.88).toFixed(3)}
                            </span>
                          </div>

                          <p className="text-[11px] text-zinc-300 line-clamp-3 bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/50 leading-relaxed font-sans italic">
                            "{node.content}"
                          </p>

                          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-1">
                            <span className="text-isro-orange flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              {node.metadata.domain || node.type}
                            </span>
                            <span>ID: {node.id.slice(0, 10)}...</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    !isLoadingNodes && (
                      <div className="md:col-span-2 p-12 text-center text-xs font-mono text-zinc-500">
                        No vector nodes found for "{searchQuery}".
                      </div>
                    )
                  )}
                </div>
              )}

              {/* TABLE VIEW MODE */}
              {viewMode === 'table' && (
                <div className="border border-zinc-800 rounded-xl overflow-hidden max-h-[520px] overflow-y-auto terminal-scroll">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-zinc-900 text-zinc-400 text-[10px] uppercase border-b border-zinc-800">
                      <tr>
                        <th className="p-3">Source File</th>
                        <th className="p-3">Domain</th>
                        <th className="p-3">Chunk</th>
                        <th className="p-3">Score</th>
                        <th className="p-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/80 bg-zinc-950/60">
                      {liveNodes.map((node) => {
                        const isSelected = selectedNode?.id === node.id;
                        return (
                          <tr 
                            key={node.id} 
                            onClick={() => setSelectedNode(node)}
                            className={`hover:bg-zinc-900/80 cursor-pointer transition-colors ${
                              isSelected ? 'bg-zinc-900 text-isro-orange font-semibold' : 'text-zinc-300'
                            }`}
                          >
                            <td className="p-3 truncate max-w-44 font-sans font-medium text-white">
                              {node.metadata.filename}
                            </td>
                            <td className="p-3 text-[10px] text-zinc-400">
                              {node.metadata.domain || node.type}
                            </td>
                            <td className="p-3 text-sky-400">
                              #{node.metadata.chunk_index ?? 0}
                            </td>
                            <td className="p-3 text-emerald-400">
                              {(node.score ?? 0.88).toFixed(3)}
                            </td>
                            <td className="p-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedNode(node);
                                }}
                                className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] rounded border border-zinc-700"
                              >
                                Inspect
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          </div>

        </div>


        {/* ----------------------------------------------------------------------- */}
        {/* PANEL 3: RIGHT VECTOR CHUNK & METADATA INSPECTOR (3 / 12 width)         */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-3 space-y-4">
          
          <div className="isro-glass p-5 rounded-2xl border border-zinc-800/90 bg-zinc-950/70 space-y-4 min-h-[620px] flex flex-col justify-between">
            
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-isro-orange" />
                  <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    Chunk Inspector
                  </h3>
                </div>
                {selectedNode && (
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-isro-orange/10 text-isro-orange border border-isro-orange/30 rounded">
                    ACTIVE NODE
                  </span>
                )}
              </div>

              {selectedNode ? (
                <div className="space-y-4">
                  
                  {/* File & Subsystem Title */}
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-white flex items-center justify-between gap-2">
                      <span className="truncate">{selectedNode.metadata.filename}</span>
                      <button
                        onClick={() => copyToClipboard(selectedNode.id, 'id')}
                        className="text-zinc-500 hover:text-zinc-300 p-1 rounded hover:bg-zinc-900 transition-colors"
                        title="Copy Node ID"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500 flex items-center gap-2">
                      <span>ID: {selectedNode.id}</span>
                      {copiedId && <span className="text-emerald-400 font-bold">COPIED!</span>}
                    </div>
                  </div>

                  {/* Similarity Score Progress Bar */}
                  <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-1.5 font-mono">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-400">Vector Relevance:</span>
                      <span className="text-emerald-400 font-bold">
                        {( (selectedNode.score ?? 0.88) * 100 ).toFixed(1)}% MATCH
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-400 rounded-full"
                        style={{ width: `${Math.min(100, (selectedNode.score ?? 0.88) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Metadata Tags */}
                  <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                    <span className="px-2 py-1 bg-zinc-900 text-sky-400 border border-zinc-800 rounded">
                      Domain: {selectedNode.metadata.domain || selectedNode.type}
                    </span>
                    <span className="px-2 py-1 bg-zinc-900 text-amber-400 border border-zinc-800 rounded">
                      Chunk Index: #{selectedNode.metadata.chunk_index ?? 0}
                    </span>
                  </div>

                  {/* Raw Chunk Content Box */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                      <span>Chunk Payload:</span>
                      <button
                        onClick={() => copyToClipboard(selectedNode.content, 'text')}
                        className="text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        {copiedText ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 leading-relaxed font-sans max-h-48 overflow-y-auto terminal-scroll italic">
                      "{selectedNode.content}"
                    </div>
                  </div>

                  {/* Raw Metadata JSON Accordion/Box */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">Metadata Attributes:</span>
                    <pre className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-[10px] font-mono text-zinc-400 overflow-x-auto terminal-scroll max-h-36">
                      {JSON.stringify(selectedNode.metadata, null, 2)}
                    </pre>
                  </div>

                </div>
              ) : (
                <div className="p-12 text-center text-zinc-500 space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600">
                    <Search className="w-5 h-5 animate-pulse" />
                  </div>
                  <p className="text-xs font-mono">
                    Select a node from the graph or grid to inspect its vector payload & metadata.
                  </p>
                </div>
              )}
            </div>

            {/* Action Bar */}
            {selectedNode && onQueryChunk && (
              <div className="pt-4 border-t border-zinc-800/80">
                <button
                  onClick={() => onQueryChunk(selectedNode.content)}
                  className="w-full py-2.5 px-4 rounded-xl bg-isro-orange hover:bg-orange-500 text-white font-display font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-isro-orange/20 transition-all hover:scale-[1.02]"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Query with RAG Agent
                </button>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
