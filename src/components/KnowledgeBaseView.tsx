/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from "react";
import { Database, Tag, Clock, Search, RefreshCcw } from "lucide-react";
import type { GroundedNode } from "../types";

export default function KnowledgeBaseView() {
  const [searchQuery, setSearchQuery] = useState("rocket");
  const [isLoadingNodes, setIsLoadingNodes] = useState(false);
  const [liveNodes, setLiveNodes] = useState<GroundedNode[]>([]);
  const [liveError, setLiveError] = useState<string | null>(null);

  const fetchLiveNodes = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setIsLoadingNodes(true);
    setLiveError(null);

    try {
      const response = await fetch("http://localhost:3001/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: trimmed,
          domain: "Aerospace Technical Operations",
          nResults: 12,
        }),
      });

      if (!response.ok) {
        throw new Error(`Search failed with status ${response.status}`);
      }

      const data = await response.json();
      setLiveNodes(Array.isArray(data.nodes) ? data.nodes : []);
    } catch (error) {
      setLiveError(error instanceof Error ? error.message : "Unable to load nodes");
      setLiveNodes([]);
    } finally {
      setIsLoadingNodes(false);
    }
  };

  useEffect(() => {
    void fetchLiveNodes(searchQuery);
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <section className="bg-linear-to-br from-zinc-900 to-black border border-zinc-800 p-6 md:p-8 rounded-2xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
          <div className="flex items-center gap-3 border-l-2 border-isro-orange pl-4">
            <Database className="w-5 h-5 text-isro-orange" />
            <div>
              <h2 className="text-lg font-display font-medium text-white">Live Indexed Nodes</h2>
              <p className="text-[10px] font-mono text-zinc-600 uppercase">Fetched directly from ChromaDB</p>
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void fetchLiveNodes(searchQuery);
                  }
                }}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-10 pr-4 py-3 text-sm text-zinc-200 outline-none focus:border-isro-orange"
                placeholder="Search indexed nodes..."
              />
            </div>
            <button
              onClick={() => void fetchLiveNodes(searchQuery)}
              className="px-4 py-3 rounded-xl bg-isro-orange hover:bg-orange-500 text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2"
              disabled={isLoadingNodes}
            >
              <RefreshCcw className={`w-3.5 h-3.5 ${isLoadingNodes ? "animate-spin" : ""}`} />
              {isLoadingNodes ? "Loading" : "Search"}
            </button>
          </div>
        </div>

        {liveError && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-sm text-red-200">
            {liveError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {liveNodes.length > 0 ? (
            liveNodes.map((node) => (
              <div key={node.id} className="isro-glass p-5 rounded-xl hover:border-zinc-600 transition-colors group">
                <div className="flex items-start justify-between mb-3 gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-zinc-100 group-hover:text-isro-orange transition-colors truncate">
                      {node.metadata.filename}
                    </h3>
                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-tighter truncate">
                      ID: {node.id}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-zinc-800 px-2 py-0.5 rounded text-[10px] font-mono text-zinc-400 shrink-0">
                    <Tag className="w-3 h-3" />
                    {node.metadata.domain || node.type}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-zinc-600 w-24 shrink-0">Source:</span>
                    <span className="text-zinc-400 truncate font-mono">{node.metadata.source}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-zinc-600 w-24 shrink-0">Chunk:</span>
                    <span className="text-zinc-400 truncate">{node.metadata.chunk_index}</span>
                  </div>
                  <div className="mt-3 p-3 bg-black/30 rounded border border-zinc-800/50 text-[11px] text-zinc-300 leading-relaxed italic line-clamp-4">
                    "{node.content}"
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-zinc-800/50">
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-600">
                    <Clock className="w-3 h-3" />
                    {node.metadata.timestamp ? new Date(node.metadata.timestamp).toLocaleDateString() : "REAL_TIME_INDEX"}
                  </div>
                  <div className="text-[10px] font-mono text-isro-blue/60 uppercase">
                    SCORE {(node.score ?? 0).toFixed(3)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            !isLoadingNodes && (
              <div className="md:col-span-2 p-6 rounded-xl border border-zinc-800 bg-zinc-900/40 text-zinc-500 text-sm">
                No live nodes returned for "{searchQuery}". Try a broader term like "satellite", "orbit", or "payload".
              </div>
            )
          )}
        </div>
      </section>
    </div>
  );
}
