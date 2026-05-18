/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HistoryItem, Domain } from "../types";
import { Clock, Search, ArrowRight, Trash2 } from "lucide-react";
import { motion } from "motion/react";

interface HistoryViewProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
}

export default function HistoryView({ history, onSelect, onClear }: HistoryViewProps) {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 opacity-20">
        <Clock className="w-16 h-16 mb-4" />
        <p className="text-sm uppercase tracking-widest font-mono">No historical traces found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <h2 className="text-lg font-display font-bold uppercase tracking-widest text-zinc-200">
          Mission History
        </h2>
        <button 
          onClick={onClear}
          className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          PURGE HISTORY
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {history.map((item) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => onSelect(item)}
            className="isro-glass p-4 rounded-xl hover:border-isro-orange/50 transition-all text-left group"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${item.domain === Domain.AEROSPACE ? 'bg-isro-orange' : 'bg-isro-blue'}`} />
                <span className="text-[10px] font-mono text-zinc-500 uppercase">{item.domain}</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-600">
                {new Date(item.timestamp).toLocaleString()}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-300 line-clamp-1 group-hover:text-white transition-colors">
                {item.query}
              </p>
              <ArrowRight className="w-4 h-4 text-zinc-700 group-hover:text-isro-orange transition-colors shrink-0 ml-4" />
            </div>

            <div className="mt-3 flex gap-2">
              <div className="px-2 py-0.5 bg-zinc-900 rounded text-[9px] font-mono text-zinc-500 border border-zinc-800">
                TRACE_NODES: {item.response.traceLog.length}
              </div>
              <div className="px-2 py-0.5 bg-zinc-900 rounded text-[9px] font-mono text-zinc-500 border border-zinc-800">
                CONFIDENCE: {item.response.metrics ? `${(item.response.metrics.overallConfidence * 100).toFixed(0)}%` : 'N/A'}
              </div>
              <div className="px-2 py-0.5 bg-zinc-900 rounded text-[9px] font-mono text-zinc-500 border border-zinc-800">
                VERIFIED: YES
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
