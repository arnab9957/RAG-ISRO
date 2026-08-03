/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SecurityTrace } from "../types";
import { Shield, Key, Hash, FileCheck, Clock, Terminal } from "lucide-react";

interface Props {
  traces: SecurityTrace[];
  isVerifying?: boolean;
}

export default function TraceAudit({ traces, isVerifying }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-5 h-5 text-isro-orange" />
        <h3 className="text-sm font-bold tracking-[0.2em] uppercase text-zinc-300">
          Cryptographic Audit Trail
        </h3>
      </div>
      
      {isVerifying && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-zinc-900/10 border border-zinc-800/50 rounded-lg animate-pulse">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 bg-zinc-800 rounded-full mt-1" />
                  <div className="space-y-2 flex-1">
                    <div className="h-2 bg-zinc-800 rounded w-1/3" />
                    <div className="h-3.5 bg-zinc-800 rounded w-2/3" />
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 bg-zinc-800 rounded-full mt-1" />
                  <div className="space-y-2 flex-1">
                    <div className="h-2 bg-zinc-800 rounded w-1/3" />
                    <div className="h-4 bg-zinc-800 rounded w-1/4" />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 bg-zinc-800 rounded-full mt-1" />
                  <div className="space-y-2 flex-1">
                    <div className="h-2 bg-zinc-800 rounded w-1/3" />
                    <div className="h-3 bg-zinc-800 rounded w-3/4" />
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 bg-zinc-800 rounded-full mt-1" />
                  <div className="space-y-2 flex-1">
                    <div className="h-2 bg-zinc-800 rounded w-1/3" />
                    <div className="h-4 bg-zinc-800 rounded w-1/3" />
                  </div>
                </div>
              </div>
              <div className="col-span-full pt-2 mt-2 border-t border-zinc-800/30 flex justify-between items-center">
                <div className="h-3 bg-zinc-800 rounded w-1/4" />
                <div className="h-5 bg-zinc-800/50 rounded w-28 border border-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      )}
      
      {!isVerifying && traces.length === 0 && (
        <div className="text-zinc-500 text-xs text-center py-8 border border-dashed border-zinc-800 rounded-lg">
          No audit data available. Execute query to generate trace logs.
        </div>
      )}

      {traces.map((trace, idx) => (
        <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-zinc-900/30 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="space-y-4 min-w-0">
            <div className="flex items-start gap-3">
              <Key className="w-4 h-4 text-emerald-400 mt-1 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">ZK-SNARK Groth16 DACL Proof</p>
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${trace.zkpStatus === 'verified' ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40' : 'bg-red-950/60 text-red-400 border-red-800/40'}`}>
                    {trace.zkpStatus === 'verified' ? 'VERIFIED (ZK OK)' : 'FAILED'}
                  </span>
                </div>
                <div className="flex flex-col mt-1">
                  <span className="text-sm font-mono text-zinc-200 break-all">{trace.nodeId}</span>
                  {trace.zkProofHash && (
                    <span className="text-[9px] text-emerald-400/90 font-mono break-all mt-0.5">
                      PROOF: {trace.zkProofHash}
                    </span>
                  )}
                  {trace.zkMerkleRoot && (
                    <span className="text-[9px] text-zinc-500 font-mono break-all">
                      MERKLE ROOT: {trace.zkMerkleRoot.substring(0, 24)}...
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Shield className="w-4 h-4 text-blue-400 mt-1 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">BM25 Retrieval Score</p>
                <p className="text-sm font-bold text-isro-orange">
                  {(trace.relevanceScore * 100).toFixed(2)} pts
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 min-w-0">
            <div className="flex items-start gap-3">
              <Hash className="w-4 h-4 text-amber-400 mt-1 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">C2PA Provenance Hash</p>
                <p className="text-[10px] font-mono text-zinc-400 break-all">{trace.provenanceHash}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileCheck className="w-4 h-4 text-purple-400 mt-1 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">Z3 WASM SMT Logic Solver</p>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
                    Z3-WASM v4.12
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <p className={`text-sm font-bold font-mono ${trace.smtApproval ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {trace.smtStatus || (trace.smtApproval ? 'SAT (VERIFIED)' : 'UNSAT (CONFLICT)')}
                  </p>
                  {trace.smtConstraintsCount !== undefined && (
                    <span className="text-[10px] text-zinc-400 font-mono">
                      ({trace.smtConstraintsCount} bounds checked)
                    </span>
                  )}
                </div>
                {trace.smtConflicts && trace.smtConflicts.length > 0 && (
                  <div className="mt-2 p-2 bg-red-950/40 border border-red-900/60 rounded text-[10px] font-mono text-red-300 space-y-1">
                    {trace.smtConflicts.map((c, i) => (
                      <p key={i}>⚠️ {c}</p>
                    ))}
                  </div>
                )}
                {trace.smtProofTrace && (
                  <details className="mt-2.5 group">
                    <summary className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 cursor-pointer flex items-center gap-1.5 py-1 select-none">
                      <Terminal className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span className="font-bold">View Z3 SMT-LIB2 Proof Script Log</span>
                    </summary>
                    <pre className="mt-1.5 p-2.5 bg-black/90 border border-zinc-800 rounded font-mono text-[10px] text-emerald-400/90 whitespace-pre-wrap overflow-x-auto max-h-44 leading-relaxed shadow-inner">
                      {trace.smtProofTrace}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>

          <div className="col-span-full pt-2 mt-2 border-t border-zinc-800/50 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-600">
              <Clock className="w-3 h-3" />
              {trace.timestamp}
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-cyan-950/30 text-cyan-400 px-2 py-0.5 rounded text-[10px] font-mono border border-cyan-900/50">
                REAL_Z3_SMT_WASM
              </div>
              <div className="bg-emerald-950/30 text-emerald-500 px-2 py-0.5 rounded text-[10px] font-mono border border-emerald-900/50">
                BLOCK_VERIFIED
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
