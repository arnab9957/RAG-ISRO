import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal,
  Activity,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Layers,
  Cpu,
  Database,
  Network,
  ShieldCheck,
  Hash,
  Clock,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Filter,
  Sparkles,
} from "lucide-react";

export interface IngestionLogEntry {
  id: string;
  timestamp: string;
  stage: "PROVENANCE" | "PII_REDACTION" | "CHUNKING" | "EMBEDDING" | "CHROMADB" | "RAPTOR" | "GRAPHRAG" | "PIPELINE";
  level: "info" | "success" | "warn" | "debug";
  message: string;
  details?: Record<string, any> | string;
  executionMs?: number;
}

export const initialIngestionLogs: IngestionLogEntry[] = [
  {
    id: "log-1",
    timestamp: new Date(Date.now() - 600000).toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }) + ".104",
    stage: "PROVENANCE",
    level: "success",
    message: 'Document provenance hash verified: filename="IRS-1C_Telemetry_Manual.pdf" hash="8f3c71a9...e41b" domain="AEROSPACE"',
    details: {
      filename: "IRS-1C_Telemetry_Manual.pdf",
      sha256: "8f3c71a99a72b0c2e391b4028591efb09817e41b",
      provenance: "C2PA Verified Digital Signature",
      domain: "AEROSPACE",
    },
    executionMs: 14,
  },
  {
    id: "log-2",
    timestamp: new Date(Date.now() - 598000).toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }) + ".340",
    stage: "PII_REDACTION",
    level: "info",
    message: "Zero-Trust PII Redaction scan complete. Sanitized 24 pages. 0 sensitive entity leaks detected.",
    details: {
      pagesScanned: 24,
      piiRedacted: 0,
      sanitizationEngine: "Regex + Presidio Local NER",
    },
    executionMs: 85,
  },
  {
    id: "log-3",
    timestamp: new Date(Date.now() - 595000).toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }) + ".890",
    stage: "CHUNKING",
    level: "info",
    message: "Recursive Overlap Chunking executed. Created 24 parent chunks (500 tokens) & 96 child chunks (125 tokens).",
    details: {
      parentChunks: 24,
      childChunks: 96,
      overlapTokens: 32,
    },
    executionMs: 110,
  },
  {
    id: "log-4",
    timestamp: new Date(Date.now() - 590000).toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }) + ".420",
    stage: "EMBEDDING",
    level: "info",
    message: "BGE Vector Embeddings generated for 96 child chunks using bge-large-en-v1.5 (1024 dimension).",
    details: {
      model: "Xenova/bge-large-en-v1.5",
      vectorDimensions: 1024,
      throughputTokSec: 342.8,
    },
    executionMs: 640,
  },
  {
    id: "log-5",
    timestamp: new Date(Date.now() - 588000).toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }) + ".115",
    stage: "CHROMADB",
    level: "success",
    message: "Indexed 96 vector embeddings into ChromaDB collection 'isro_telemetry_vectors'.",
    details: {
      collection: "isro_telemetry_vectors",
      recordsInserted: 96,
      storageEngine: "ChromaDB Persistent Store",
    },
    executionMs: 120,
  },
  {
    id: "log-6",
    timestamp: new Date(Date.now() - 585000).toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }) + ".770",
    stage: "RAPTOR",
    level: "info",
    message: "RAPTOR Hierarchical Tree generated: 4 cluster summaries computed at cosine threshold 0.70.",
    details: {
      summaryNodesCreated: 4,
      clusterThreshold: 0.70,
    },
    executionMs: 410,
  },
  {
    id: "log-7",
    timestamp: new Date(Date.now() - 582000).toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }) + ".905",
    stage: "GRAPHRAG",
    level: "success",
    message: "GraphRAG triplets extracted: Merged 18 subject-relation-object entity edges into knowledge_graph.json.",
    details: {
      tripletsExtracted: 18,
      graphFile: "knowledge_graph.json",
    },
    executionMs: 290,
  },
  {
    id: "log-8",
    timestamp: new Date(Date.now() - 580000).toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }) + ".001",
    stage: "PIPELINE",
    level: "success",
    message: 'Ingestion pipeline finished successfully for "IRS-1C_Telemetry_Manual.pdf". Total time: 1.67s.',
    executionMs: 1669,
  },
];

interface IngestionLogsPanelProps {
  isIngesting?: boolean;
  activeFileName?: string | null;
  activeDomain?: string;
}

export const IngestionLogsPanel: React.FC<IngestionLogsPanelProps> = ({
  isIngesting = false,
  activeFileName = null,
  activeDomain = "AEROSPACE",
}) => {
  const [logs, setLogs] = useState<IngestionLogEntry[]>(initialIngestionLogs);
  const [filterStage, setFilterStage] = useState<string>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Simulate step-by-step live log generation during active ingestion
  useEffect(() => {
    if (!isIngesting || !activeFileName) return;

    const filename = activeFileName;
    const now = () => new Date().toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }) + "." + Math.floor(Math.random() * 900 + 100);

    const simulatedSteps: Omit<IngestionLogEntry, "id">[] = [
      {
        timestamp: now(),
        stage: "PROVENANCE",
        level: "success",
        message: `Hashing file & verifying provenance: filename="${filename}" domain="${activeDomain}" provenance="C2PA Hashed"`,
        details: { filename, sha256: Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2), domain: activeDomain },
        executionMs: 12,
      },
      {
        timestamp: now(),
        stage: "PII_REDACTION",
        level: "info",
        message: `Zero-Trust PII Redaction scan: Sanitizing text content for "${filename}". 0 leaks detected.`,
        details: { status: "CLEAN", unmaskedEntities: 0, redactionEngine: "Presidio-Regex" },
        executionMs: 78,
      },
      {
        timestamp: now(),
        stage: "CHUNKING",
        level: "info",
        message: `Recursive Overlap Chunking: Splitting "${filename}" into 500-token parent pages and 125-token child chunks.`,
        details: { parentChunks: 6, childChunks: 24, overlapTokens: 32 },
        executionMs: 95,
      },
      {
        timestamp: now(),
        stage: "EMBEDDING",
        level: "info",
        message: `Generating 1024-d BGE dense embeddings for 24 child chunks (bge-large-en-v1.5).`,
        details: { model: "bge-large-en-v1.5", vectorDimensions: 1024, chunksProcessed: 24 },
        executionMs: 420,
      },
      {
        timestamp: now(),
        stage: "CHROMADB",
        level: "success",
        message: `ChromaDB Vector Indexing: Stored 24 vector records into collection 'isro_telemetry_vectors'.`,
        details: { collection: "isro_telemetry_vectors", insertedRecords: 24 },
        executionMs: 110,
      },
      {
        timestamp: now(),
        stage: "RAPTOR",
        level: "info",
        message: `RAPTOR Summary Tree: Clustered embeddings at 0.70 cosine similarity. Generated 2 summary nodes.`,
        details: { summaryNodes: 2, threshold: 0.70 },
        executionMs: 340,
      },
      {
        timestamp: now(),
        stage: "GRAPHRAG",
        level: "success",
        message: `GraphRAG Triplet Extraction: Merged 12 subject-relation-object triplets into knowledge_graph.json.`,
        details: { tripletsExtracted: 12, targetGraph: "knowledge_graph.json" },
        executionMs: 230,
      },
      {
        timestamp: now(),
        stage: "PIPELINE",
        level: "success",
        message: `Ingestion pipeline completed successfully for "${filename}"! Collection updated.`,
        executionMs: 1285,
      },
    ];

    let timer: NodeJS.Timeout;
    simulatedSteps.forEach((step, idx) => {
      timer = setTimeout(() => {
        const newLog: IngestionLogEntry = {
          id: `live-log-${Date.now()}-${idx}`,
          ...step,
        };
        setLogs((prev) => [newLog, ...prev]);
      }, (idx + 1) * 700);
    });

    return () => clearTimeout(timer);
  }, [isIngesting, activeFileName, activeDomain]);

  const filteredLogs = logs.filter((log) => {
    if (filterStage === "ALL") return true;
    return log.stage === filterStage;
  });

  const copyLogsToClipboard = () => {
    const text = JSON.stringify(logs, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStageBadgeStyle = (stage: IngestionLogEntry["stage"]) => {
    switch (stage) {
      case "PROVENANCE":
        return "bg-purple-500/10 text-purple-400 border-purple-500/30";
      case "PII_REDACTION":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "CHUNKING":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "EMBEDDING":
        return "bg-sky-500/10 text-sky-400 border-sky-500/30";
      case "CHROMADB":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "RAPTOR":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/30";
      case "GRAPHRAG":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
      case "PIPELINE":
        return "bg-isro-orange/10 text-isro-orange border-isro-orange/30";
      default:
        return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
  };

  return (
    <section className="isro-glass p-6 rounded-2xl border border-zinc-800 bg-zinc-950/80 space-y-4 shadow-2xl relative overflow-hidden font-sans">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-isro-orange">
            <Activity className={`w-4 h-4 ${isIngesting ? "animate-pulse" : ""}`} />
          </div>
          <div>
            <h3 className="text-sm font-display font-bold text-white tracking-tight flex items-center gap-2">
              Ingestion Audit & Pipeline Logs
              <span className="text-[10px] font-mono font-normal text-zinc-500">
                ({filteredLogs.length} events)
              </span>
            </h3>
            <p className="text-[11px] font-mono text-zinc-400">
              Live audit stream: Provenance → Redaction → Chunking → Vector Embeddings → GraphRAG
            </p>
          </div>
        </div>

        {/* Live Status Pill & Quick Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {isIngesting ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-isro-orange/10 text-isro-orange border border-isro-orange/30">
              <span className="w-1.5 h-1.5 rounded-full bg-isro-orange animate-ping" />
              INGESTING LIVE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-zinc-900 text-zinc-400 border border-zinc-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              AUDIT READY
            </span>
          )}

          <button
            onClick={copyLogsToClipboard}
            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition cursor-pointer text-xs font-mono flex items-center gap-1"
            title="Copy audit log JSON"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setLogs([])}
            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 border border-zinc-800 transition cursor-pointer text-xs font-mono"
            title="Clear logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Stage Filter Buttons Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 terminal-scroll text-[11px] font-mono">
        <span className="text-zinc-500 text-[10px] uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3 text-zinc-500" /> Filter Stage:
        </span>
        {["ALL", "PROVENANCE", "PII_REDACTION", "CHUNKING", "EMBEDDING", "CHROMADB", "RAPTOR", "GRAPHRAG"].map((stage) => (
          <button
            key={stage}
            onClick={() => setFilterStage(stage)}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer whitespace-nowrap ${
              filterStage === stage
                ? "bg-isro-orange text-white font-bold shadow-md"
                : "bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800"
            }`}
          >
            {stage}
          </button>
        ))}
      </div>

      {/* Structured Logs Activity List Container */}
      <div className="space-y-2 max-h-96 overflow-y-auto terminal-scroll pr-1 font-mono">
        <AnimatePresence>
          {filteredLogs.map((log) => {
            const isExpanded = expandedId === log.id;
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="p-3 bg-zinc-900/60 hover:bg-zinc-900/90 border border-zinc-800/80 rounded-xl transition-all space-y-2 group"
              >
                {/* Main Log Header Line */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Level Icon */}
                    {log.level === "success" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : log.level === "warn" ? (
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <FileCheck className="w-4 h-4 text-sky-400 shrink-0" />
                    )}

                    {/* Stage Tag */}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider shrink-0 ${getStageBadgeStyle(log.stage)}`}>
                      {log.stage}
                    </span>

                    {/* Log Message Text */}
                    <p className="text-xs text-zinc-200 truncate group-hover:text-white transition-colors">
                      {log.message}
                    </p>
                  </div>

                  {/* Right Metadata (Timestamp & Details Expand Toggle) */}
                  <div className="flex items-center gap-2 shrink-0 text-[10px] text-zinc-500">
                    {log.executionMs && (
                      <span className="px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-400 border border-zinc-700/50">
                        {log.executionMs}ms
                      </span>
                    )}
                    <span>{log.timestamp}</span>

                    {log.details && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                        className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
                      >
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expandable Technical Details JSON Drawer */}
                {isExpanded && log.details && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-[11px] text-sky-300 overflow-x-auto"
                  >
                    <pre className="font-mono leading-relaxed">
                      {typeof log.details === "string" ? log.details : JSON.stringify(log.details, null, 2)}
                    </pre>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredLogs.length === 0 && (
          <div className="p-8 text-center text-xs font-mono text-zinc-500 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
            No ingestion audit logs match filter "{filterStage}".
          </div>
        )}
        <div ref={logsEndRef} />
      </div>
    </section>
  );
};

export default IngestionLogsPanel;
