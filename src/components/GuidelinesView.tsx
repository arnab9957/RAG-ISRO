/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  Shield, 
  Cpu, 
  Zap, 
  Lock, 
  FileText, 
  CheckCircle,
  Database,
  Network,
  Code as CodeIcon,
  Fingerprint
} from "lucide-react";

export default function GuidelinesView() {
  const coreArchitecture = [
    {
      title: "Multi-Agent Orchestration",
      tech: "LangGraph",
      desc: "Utilizes LangGraph for stateful, cyclic multi-agent graphs. Enforces strict Executor-Validator-Critic workflows with cyclic self-correction loops.",
      icon: <Network className="w-4 h-4 text-isro-orange" />
    },
    {
      title: "Knowledge Graph Engine",
      tech: "FalkorDB / Neo4j",
      desc: "High-performance multi-graph retrieval using FalkorDB for ultra-low latency Graph-Flow matching and SDO/MDDS ontological traversals.",
      icon: <Database className="w-4 h-4 text-isro-orange" />
    },
    {
      title: "Zero-Knowledge Verifiability",
      tech: "RISC Zero zkVM",
      desc: "Generates zk-STARKs via RISC Zero SDK to prove model integrity and execution provenance without exposing sensitive parametric data.",
      icon: <Fingerprint className="w-4 h-4 text-isro-orange" />
    }
  ];

  const sections = [
    {
      title: "Deterministic Ingestion",
      icon: <Zap className="w-5 h-5 text-isro-orange" />,
      content: "SARASWATI avoids probabilistic graph extraction. It uses AMR parsing (amrlib/Penman) and spaCy-based Semantic Role Labeling for absolute syntactic grounding.",
      points: ["AMR/SRL Parsing", "PropBank Argument Extraction", "Ontological Alignment (BFO)"]
    },
    {
      title: "Privacy & Zero-Trust",
      icon: <Lock className="w-5 h-5 text-isro-orange" />,
      content: "Implements CAPRISE for encrypted similarity search. PII redaction is enforced at edge using Microsoft Presidio before vectorization.",
      points: ["CAPRISE Homomorphic Encryption", "Microsoft Presidio Masking", "Hyperledger Indy/Aries DID"]
    },
    {
      title: "Formal Verification",
      icon: <Shield className="w-5 h-5 text-isro-orange" />,
      content: "Outputs are validated against an OOMRAM lattice using SMT solvers and Isabelle REPL. Checks for logical satisfiability before delivery.",
      points: ["SMT-based Satisfiability", "Isabelle Formal Logic", "Temporal Logic Checking"]
    },
    {
      title: "Provenance & Trust",
      icon: <CheckCircle className="w-5 h-5 text-isro-orange" />,
      content: "Every synthesized fact is embedded with a C2PA manifest. Provenance hashes link each claim back to its cryptographically verified source node.",
      points: ["C2PA Manifest Embedding", "Immutable NIC NTP Logs", "Verifiable Chain of Trust"]
    }
  ];

  return (
    <div className="space-y-16 max-w-5xl mx-auto">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-display font-bold tracking-[0.3em] text-zinc-100 uppercase">
          SARASWATI Protocol Stack
        </h2>
        <div className="w-24 h-1 bg-isro-orange mx-auto rounded-full" />
        <p className="text-zinc-500 max-w-2xl mx-auto text-sm leading-relaxed">
          The following technologies represent the ISRO-grade implementation of the 
          Secure and Accurate Retrieval-Augmented Generation framework.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {coreArchitecture.map((item, idx) => (
          <div key={idx} className="isro-glass p-6 rounded-2xl border-t-2 border-t-isro-orange bg-zinc-950">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-zinc-900 rounded-lg">
                {item.icon}
              </div>
              <div>
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Stack Component</p>
                <h4 className="text-sm font-bold text-white">{item.tech}</h4>
              </div>
            </div>
            <p className="text-[11px] text-zinc-400 font-medium mb-2">{item.title}</p>
            <p className="text-[10px] text-zinc-500 leading-normal">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {sections.map((section, idx) => (
          <div key={idx} className="isro-glass p-8 rounded-2xl relative overflow-hidden group hover:bg-zinc-900/40 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              {section.icon}
            </div>
            
            <div className="mb-6 flex items-center gap-3">
              <div className="p-2 bg-isro-orange/10 rounded-lg">
                {section.icon}
              </div>
              <h3 className="text-sm font-bold uppercase tracking-[0.1em] text-white">
                {section.title}
              </h3>
            </div>

            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
              {section.content}
            </p>

            <ul className="space-y-3">
              {section.points.map((point, pIdx) => (
                <li key={pIdx} className="flex items-center gap-3 text-xs text-zinc-500">
                  <div className="w-1 h-1 rounded-full bg-isro-orange/50" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-zinc-900/40 p-8 rounded-3xl border border-zinc-800 shadow-2xl">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-isro-orange">
            <Zap className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Inference Performance</span>
          </div>
          <h3 className="text-xl font-display font-bold text-white">Advanced Neuro-Symbolic Integration</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            SARASWATI utilizes PEIRCE to unify LLM heuristic reasoning with formal symbolic provers. 
            This resolves knowledge conflicts via the CARE (Conflict-Aware Retrieval-Augmented Generation) module, 
            ensuring parametric memory never overrides verified technical ground truths.
          </p>
          <div className="flex gap-4">
            <div className="px-3 py-1 bg-zinc-800 rounded-md border border-zinc-700 text-[10px] font-mono text-zinc-500">
              LNN_LATENCY: 42ms
            </div>
            <div className="px-3 py-1 bg-zinc-800 rounded-md border border-zinc-700 text-[10px] font-mono text-zinc-500">
              SMT_SOLVER: Z3_OPTIMIZED
            </div>
          </div>
        </div>
        <div className="isro-glass p-6 rounded-2xl border-dashed">
          <div className="flex items-center gap-3 mb-4">
            <Fingerprint className="w-5 h-5 text-isro-orange" />
            <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-300">Auditable Chain of Trust</h4>
          </div>
          <div className="space-y-3">
            {[
              "C2PA_MANIFEST_SIGNATURE",
              "RISC_ZERO_STARK_PROOF",
              "FALKOR_GRAPH_TRAVERSAL_ID",
              "CERT_IN_NTP_TIMESTAMP"
            ].map((token) => (
              <div key={token} className="flex items-center justify-between p-2 bg-black/40 rounded border border-zinc-800">
                <span className="text-[9px] font-mono text-zinc-500">{token}</span>
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

