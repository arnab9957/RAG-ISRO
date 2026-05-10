/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { KNOWLEDGE_BASE } from "../lib/ontology";
import { Domain } from "../types";
import { Database, Tag, Clock, Code } from "lucide-react";

export default function KnowledgeBaseView() {
  return (
    <div className="space-y-12">
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
                  {Object.entries(node.properties).map(([key, value]) => (
                    key !== 'timestamp' && (
                      <div key={key} className="flex items-center gap-2 text-xs">
                        <span className="text-zinc-600 w-24 shrink-0">{key}:</span>
                        <span className="text-zinc-400 truncate">{String(value)}</span>
                      </div>
                    )
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-zinc-800/50">
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-600">
                    <Clock className="w-3 h-3" />
                    {node.properties.timestamp ? new Date(node.properties.timestamp).toLocaleDateString() : 'LIFETIME'}
                  </div>
                  <div className="text-[10px] font-mono text-emerald-500/60 uppercase">
                    SMT_COMPLIANT
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
