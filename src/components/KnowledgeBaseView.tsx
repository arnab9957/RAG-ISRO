/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { KNOWLEDGE_BASE } from "../lib/ontology";
import { Domain } from "../types";
import { Database, Tag, Clock, CloudOff, Layers, Shield, Upload, FileJson, Cpu, Zap, Eye, FileText, X } from "lucide-react";
import { useState } from "react";

const MOCK_PDF_PAGES = [
  { id: 'p1', filename: 'CCSDS_133.pdf', page: 1, title: 'Packet Structure', color: 'bg-isro-blue/10' },
  { id: 'p2', filename: 'CCSDS_133.pdf', page: 2, title: 'APID Mapping', color: 'bg-isro-blue/10' },
  { id: 'p3', filename: 'CCSDS_133.pdf', page: 3, title: 'Error Control', color: 'bg-isro-blue/10' },
  { id: 'p4', filename: 'THERMAL_TECH.pdf', page: 10, title: 'MLI Insulation', color: 'bg-isro-orange/10' },
  { id: 'p5', filename: 'THERMAL_TECH.pdf', page: 11, title: 'Active Control', color: 'bg-isro-orange/10' },
  { id: 'p6', filename: 'GFR_2017.pdf', page: 60, title: 'Procurement', color: 'bg-emerald-500/10' },
];

export default function KnowledgeBaseView() {
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestionProgress, setIngestionProgress] = useState(0);
  const [selectedPreview, setSelectedPreview] = useState<typeof MOCK_PDF_PAGES[0] | null>(null);

  const simulateIngestion = () => {
    setIsIngesting(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setIngestionProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsIngesting(false);
          setIngestionProgress(0);
        }, 1000);
      }
    }, 100);
  };

  return (
    <div className="space-y-12">
      {/* Production Ingestion Pipeline Header */}
      <section className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 p-8 rounded-2xl">
        <div className="flex flex-col lg:flex-row gap-8 items-start justify-between">
          <div className="space-y-4 max-w-xl">
            <div className="flex items-center gap-2 text-isro-orange">
              <Zap className="w-5 h-5" />
              <h2 className="text-sm font-bold uppercase tracking-[0.2em]">Scale-In Ingestion Hub</h2>
            </div>
            <h3 className="text-2xl font-display text-white">Scale-In Paging Ingestion</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Upload mission telemetry, formal SDO documents, or compliance rulebooks. 
              The system utilizes **Paging Chunking** and **BM25 Retrieval Profiles** to index data without vector embeddings, preserving 100% contextual continuity across neighboring pages.
            </p>
          </div>

          <div className="w-full lg:w-72 space-y-4">
            <button 
              onClick={simulateIngestion}
              disabled={isIngesting}
              className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl flex items-center justify-center gap-3 text-white font-bold transition-all disabled:opacity-50"
            >
              {isIngesting ? <Cpu className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              {isIngesting ? 'PROCESSING_CHUNKS...' : 'INITIATE_INGESTION'}
            </button>
            
            {isIngesting && (
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                  <span>INDEXING_RECORDS</span>
                  <span>{ingestionProgress}%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-isro-blue transition-all duration-300"
                    style={{ width: `${ingestionProgress}%` }}
                  />
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2 p-3 bg-black/40 rounded-lg border border-zinc-800/50">
              <FileJson className="w-4 h-4 text-zinc-600" />
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-tighter">Supported: .PDF, .JSON, .H5, .CSV</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 pt-8 border-t border-zinc-800/50">
          <div className="isro-glass p-6 rounded-2xl border-emerald-500/20 bg-emerald-500/5">
            <div className="flex items-center gap-3 mb-4">
              <CloudOff className="w-5 h-5 text-emerald-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-500">Air-Gapped Ready</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              SARASWATI is architected for offline deployment. All retrieval, reranking, and verification layers execute within the secure enclave.
            </p>
          </div>
          <div className="isro-glass p-6 rounded-2xl border-isro-blue/20 bg-isro-blue/5">
            <div className="flex items-center gap-3 mb-4">
              <Layers className="w-5 h-5 text-isro-blue" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-isro-blue">Ingestion Layer</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Multi-modal ingestion pipeline simulates secure processing of mission data from ISRO telemetry nodes and GFR rulebooks.
            </p>
          </div>
          <div className="isro-glass p-6 rounded-2xl border-isro-orange/20 bg-isro-orange/5">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-isro-orange" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-isro-orange">Grounding Index</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Entities are indexed using Bi-Encoder embeddings and cross-referenced with AMR semantic semantic dependency parses.
            </p>
          </div>
        </div>
      </section>

      {/* PDF Page Preview Support */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-l-2 border-isro-blue pl-4">
          <FileText className="w-5 h-5 text-isro-blue" />
          <h2 className="text-lg font-display font-medium text-white">Document Source Previews</h2>
          <span className="text-[10px] font-mono text-zinc-600 uppercase bg-zinc-800 px-2 py-0.5 rounded">Paging Optimized</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {MOCK_PDF_PAGES.map((page) => (
            <div 
              key={page.id}
              onClick={() => setSelectedPreview(page)}
              className="group relative aspect-[3/4] bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden cursor-pointer hover:border-isro-blue transition-all"
            >
              <div className={`absolute inset-0 opacity-20 ${page.color}`} />
              <div className="absolute inset-x-2 top-2 h-4 bg-zinc-800 rounded opacity-40" />
              <div className="absolute inset-x-2 top-8 space-y-1">
                <div className="h-1 w-full bg-zinc-800 rounded opacity-30" />
                <div className="h-1 w-4/5 bg-zinc-800 rounded opacity-30" />
                <div className="h-1 w-full bg-zinc-800 rounded opacity-30" />
              </div>
              
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Eye className="w-6 h-6 text-white" />
              </div>

              <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black to-transparent">
                <p className="text-[8px] font-mono text-zinc-500 truncate">{page.filename}</p>
                <p className="text-[10px] font-medium text-white truncate">Page {page.page}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Preview Modal */}
      {selectedPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setSelectedPreview(null)}
              className="absolute top-4 right-4 p-2 hover:bg-zinc-800 rounded-full text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col md:flex-row h-full">
              <div className={`w-full md:w-1/2 aspect-[3/4] ${selectedPreview.color} relative border-r border-zinc-800 p-8 flex flex-col gap-4`}>
                 <div className="h-4 w-full bg-white/5 rounded" />
                 <div className="space-y-3">
                   <div className="h-2 w-full bg-white/10 rounded" />
                   <div className="h-2 w-full bg-white/10 rounded" />
                   <div className="h-2 w-3/4 bg-white/10 rounded" />
                 </div>
                 <div className="mt-8 grid grid-cols-2 gap-2">
                    <div className="h-20 bg-white/5 rounded" />
                    <div className="h-20 bg-white/5 rounded" />
                 </div>
                 <div className="absolute bottom-4 left-4 right-4 h-1 bg-white/10 rounded-full" />
              </div>
              
              <div className="p-8 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-isro-blue" />
                    <span className="text-[10px] font-mono text-isro-blue uppercase font-bold tracking-widest leading-none">Source Analysis</span>
                  </div>
                  <h3 className="text-xl font-display font-medium text-white mb-1">{selectedPreview.title}</h3>
                  <p className="text-sm text-zinc-500 font-mono mb-6">{selectedPreview.filename}</p>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-black/40 rounded-xl border border-zinc-800">
                      <p className="text-[10px] font-mono text-zinc-600 mb-2 uppercase tracking-tighter">Paging Metadata</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="block text-[10px] text-zinc-500">Page Identity</span>
                          <span className="text-sm text-white font-mono">P-{selectedPreview.page}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-zinc-500">Chunk Status</span>
                          <span className="text-sm text-emerald-500 font-mono tracking-tighter">INDEXED</span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-xs text-zinc-400 leading-relaxed italic border-l-2 border-zinc-700 pl-4 py-1">
                      "Primary telemetry frame architecture requires strict APID isolation. Page {selectedPreview.page} provides the mapping for subsystem payloads..."
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <button className="flex-1 py-3 bg-isro-blue/10 hover:bg-isro-blue/20 text-isro-blue rounded-xl text-xs font-bold border border-isro-blue/30 transition-all">
                    GO_TO_PAGE_SOURCE
                  </button>
                  <button 
                    onClick={() => setSelectedPreview(null)}
                    className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    CLOSE_PREVIEW
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {Object.entries(KNOWLEDGE_BASE).map(([domain, nodes]) => (
        <section key={domain} className="space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-isro-orange" />
              <h2 className="text-lg font-display font-bold uppercase tracking-widest text-zinc-200">
                {domain}
              </h2>
            </div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase">
              {nodes.length} Grounded Nodes Verified
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nodes.map((node) => (
              <div key={node.id} className="isro-glass p-5 rounded-xl hover:border-zinc-600 transition-colors group">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100 group-hover:text-isro-orange transition-colors">
                      {node.label}
                    </h3>
                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-tighter">
                      ID: {node.id}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-zinc-800 px-2 py-0.5 rounded text-[10px] font-mono text-zinc-400">
                    <Tag className="w-3 h-3" />
                    {node.type}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-zinc-600 w-24 shrink-0">Source:</span>
                    <span className="text-zinc-400 truncate font-mono">{node.metadata.filename}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-zinc-600 w-24 shrink-0">Page/Section:</span>
                    <span className="text-zinc-400 truncate">{node.metadata.page} | {node.metadata.section}</span>
                  </div>
                  <div className="mt-3 p-3 bg-black/30 rounded border border-zinc-800/50 text-[11px] text-zinc-300 leading-relaxed italic line-clamp-3">
                    "{node.content}"
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-zinc-800/50">
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-600">
                    <Clock className="w-3 h-3" />
                    {node.metadata.timestamp ? new Date(node.metadata.timestamp).toLocaleDateString() : 'REAL_TIME_INDEX'}
                  </div>
                  <div className="text-[10px] font-mono text-isro-blue/60 uppercase">
                    PAGING_ACTIVE
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
