import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal, Copy, Check, Trash2, Cpu, Activity, RefreshCw, Zap,
  Search, FileText, Code, LayoutGrid, Download, HelpCircle, Info,
  Sliders, Gauge, Server, Layers, ChevronRight, CheckCircle2, AlertCircle
} from 'lucide-react';
import {
  parseOllamaLogLine,
  calculateTelemetryStats,
  formatEntryToJson,
  formatLogsToMarkdownReport,
  OllamaLogEntry,
  LogLevel,
  defaultOllamaLogs
} from '../../utils/ollamaLogFormatter';

// Re-export default log array as raw strings for initial state
export const rawDefaultLogs = [
  '[OLLAMA] slot launch_slot_: id  0 | task -1 | sampler params:',
  '[OLLAMA]        repeat_last_n = 64, repeat_penalty = 1.100, frequency_penalty = 0.000, presence_penalty = 0.000',
  '[OLLAMA]        dry_multiplier = 0.000, dry_base = 1.750, dry_allowed_length = 2, dry_penalty_last_n = 4096',
  '[OLLAMA]        top_k = 40, top_p = 0.900, min_p = 0.000, xtc_probability = 0.000, xtc_threshold = 0.100, typical_p = 1.000, top_n_sigma = -1.000, temp = 0.000',
  '[OLLAMA]        mirostat = 0, mirostat_lr = 0.100, mirostat_ent = 5.000, adaptive_target = -1.000, adaptive_decay = 0.900',
  '[OLLAMA] slot launch_slot_: id  0 | task 112 | processing task, is_child = 0',
  '[OLLAMA] slot   operator(): id  0 | task 112 | new prompt, n_ctx_slot = 4096, n_keep = 4, task.n_tokens = 98',
  '[OLLAMA] slot   operator(): id  0 | task 112 | checking checkpoint with [0, 109] against 0...',
  '[OLLAMA] slot   operator(): id  0 | task 112 | forcing full prompt re-processing due to lack of cache data (likely due to SWA or hybrid/recurrent memory, see https://github.com/ggml-org/llama.cpp/pull/13194#issuecomment-2868343055)',
  '[OLLAMA] slot   operator(): id  0 | task 112 | erased invalidated context checkpoint (pos_min = 0, pos_max = 109, n_tokens = 110, n_swa = 4096, pos_next = 0, size = 5.588 MiB)',
  '[OLLAMA] slot   operator(): id  0 | task 112 | cached n_tokens = 0, memory_seq_rm [0, end)',
  '[OLLAMA] srv  stream_sessi: conv_id= (empty=1)',
  '[OLLAMA] slot print_timing: id  0 | task 112 | prompt processing, n_tokens =     94, progress = 0.96, t =   3.93 s / 23.90 tokens per second',
  '[OLLAMA] slot   operator(): id  0 | task 112 | cached n_tokens = 94, memory_seq_rm [94, end)',
  '[OLLAMA] slot init_sampler: id  0 | task 112 | init sampler, took 0.13 ms, tokens: text = 98, total = 98',
  '[OLLAMA] slot create_check: id  0 | task 112 | created context checkpoint 1 of 32 (pos_min = 0, pos_max = 93, n_tokens = 94, size = 4.775 MiB)',
  '[OLLAMA] slot print_timing: id  0 | task 112 | n_decoded =    100, tg =   5.68 t/s, tg_3s =   5.68 t/s',
  '[OLLAMA] slot print_timing: id  0 | task 112 | n_decoded =    119, tg =   5.72 t/s, tg_3s =   5.95 t/s',
  '[OLLAMA] slot print_timing: id  0 | task 112 | n_decoded =    134, tg =   5.61 t/s, tg_3s =   4.91 t/s',
  '[OLLAMA] slot print_timing: id  0 | task 112 | prompt eval time =    4392.24 ms /    98 tokens (   44.82 ms per token,    22.31 tokens per second)',
  '[OLLAMA] slot print_timing: id  0 | task 112 |        eval time =   25045.80 ms /   141 tokens (  177.63 ms per token,     5.63 tokens per second)',
  '[OLLAMA] slot print_timing: id  0 | task 112 |       total time =   29438.05 ms /   239 tokens',
  '[OLLAMA] slot print_timing: id  0 | task 112 |    graphs reused =        241',
  '[OLLAMA] slot      release: id  0 | task 112 | stop processing: n_tokens = 238, truncated = 0',
  '[OLLAMA] srv  update_slots: all slots are idle',
  '[OLLAMA] [GIN] 2026/07/29 - 13:54:23 | 200 |   34.6319813s |       127.0.0.1 | POST     "/api/generate"'
];

export interface OllamaTerminalProps {
  isQuerying?: boolean;
}

type FormatterViewMode = 'cards' | 'syntax' | 'json' | 'raw';

export const OllamaTerminal: React.FC<OllamaTerminalProps> = ({ isQuerying = false }) => {
  const [rawLogs, setRawLogs] = useState<string[]>(rawDefaultLogs);
  const [viewMode, setViewMode] = useState<FormatterViewMode>('cards');
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [selectedEntry, setSelectedEntry] = useState<OllamaLogEntry | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Parse raw log lines into formatted OllamaLogEntry objects via formatter library
  const parsedEntries: OllamaLogEntry[] = useMemo(() => {
    return rawLogs.map((line, idx) => parseOllamaLogLine(line, idx));
  }, [rawLogs]);

  // Telemetry statistics calculated via formatter library
  const stats = useMemo(() => {
    return calculateTelemetryStats(parsedEntries);
  }, [parsedEntries]);

  // Filtered log entries based on user selection and search term
  const filteredEntries = useMemo(() => {
    return parsedEntries.filter(entry => {
      // Level filter
      if (filterLevel !== 'ALL') {
        if (filterLevel === 'METRIC' && entry.level !== 'METRIC') return false;
        if (filterLevel === 'CONFIG' && entry.level !== 'CONFIG') return false;
        if (filterLevel === 'SLOT' && entry.level !== 'SLOT' && entry.level !== 'SUCCESS') return false;
        if (filterLevel === 'HTTP' && entry.level !== 'HTTP') return false;
      }
      // Search term filter
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const matchesRaw = entry.raw.toLowerCase().includes(query);
        const matchesSummary = entry.summary.toLowerCase().includes(query);
        const matchesComp = entry.component.toLowerCase().includes(query);
        return matchesRaw || matchesSummary || matchesComp;
      }
      return true;
    });
  }, [parsedEntries, filterLevel, searchTerm]);

  // Auto scroll effect when new logs arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [rawLogs, autoScroll, viewMode, filterLevel, searchTerm]);

  // Streaming log simulation during query
  useEffect(() => {
    if (!isQuerying) return;

    const interval = setInterval(() => {
      const randomTaskId = Math.floor(Math.random() * 900 + 100);
      const randomTokens = Math.floor(Math.random() * 25) + 105;
      const randomSpeed = (Math.random() * 2 + 4.9).toFixed(2);
      
      const liveLog = `[OLLAMA] slot print_timing: id  0 | task ${randomTaskId} | n_decoded =    ${randomTokens}, tg =   ${randomSpeed} t/s, tg_3s =   ${randomSpeed} t/s`;
      
      setRawLogs(prev => [...prev, liveLog]);
    }, 1400);

    return () => clearInterval(interval);
  }, [isQuerying]);

  // Copy handlers
  const handleCopyLogs = () => {
    let content = '';
    if (viewMode === 'json') {
      content = JSON.stringify(parsedEntries.map(e => JSON.parse(formatEntryToJson(e))), null, 2);
    } else if (viewMode === 'cards') {
      content = parsedEntries.map(e => `[${e.level}] ${e.component}: ${e.summary}\n  ${e.raw}`).join('\n\n');
    } else {
      content = rawLogs.join('\n');
    }
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download Markdown formatted report
  const handleDownloadReport = () => {
    const reportMd = formatLogsToMarkdownReport(parsedEntries);
    const blob = new Blob([reportMd], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ollama_SlotServer_Telemetry_${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => setRawLogs([]);
  const handleReset = () => setRawLogs(rawDefaultLogs);

  // Level Badge Color Resolver
  const getLevelBadge = (level: LogLevel) => {
    switch (level) {
      case 'METRIC':
        return 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300';
      case 'CONFIG':
        return 'bg-purple-500/15 border-purple-500/30 text-purple-300';
      case 'SLOT':
        return 'bg-blue-500/15 border-blue-500/30 text-blue-300';
      case 'HTTP':
        return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300';
      case 'SUCCESS':
        return 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400';
      case 'WARN':
        return 'bg-amber-500/15 border-amber-500/30 text-amber-300';
      default:
        return 'bg-zinc-800 border-zinc-700 text-zinc-300';
    }
  };

  return (
    <div className="isro-glass rounded-2xl border border-zinc-800 bg-black/85 flex flex-col h-[740px] overflow-hidden shadow-2xl transition-all">
      
      {/* 1. Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-950/80 gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${stats.activeSlotsCount > 0 ? 'bg-amber-400 animate-ping' : 'bg-emerald-500 animate-pulse'} shadow-[0_0_10px_rgba(16,185,129,0.8)]`} />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-emerald-400" /> OLLAMA LLM SLOT SERVER
            </span>
          </div>
          <span className="hidden sm:inline-flex text-[9px] font-mono px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900/90 text-zinc-400 items-center gap-1">
            <Server className="w-3 h-3 text-cyan-400" /> LLAMA.CPP ENGINE
          </span>
        </div>

        {/* View Mode Switcher Tabs */}
        <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
            title="Formatted human-readable cards"
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Formatted Cards
          </button>

          <button
            type="button"
            onClick={() => setViewMode('syntax')}
            className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
              viewMode === 'syntax'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
            title="Pretty syntax-highlighted terminal"
          >
            <Code className="w-3.5 h-3.5" /> Syntax View
          </button>

          <button
            type="button"
            onClick={() => setViewMode('json')}
            className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
              viewMode === 'json'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
            title="Pretty JSON objects"
          >
            <FileText className="w-3.5 h-3.5" /> JSON Tree
          </button>

          <button
            type="button"
            onClick={() => setViewMode('raw')}
            className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
              viewMode === 'raw'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
            title="Raw terminal text log"
          >
            <Terminal className="w-3.5 h-3.5" /> Raw Console
          </button>
        </div>

        {/* Global Action Icons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadReport}
            className="px-2.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs font-mono text-cyan-300 hover:text-cyan-200 flex items-center gap-1.5 transition cursor-pointer"
            title="Download formatted Markdown log audit report"
          >
            <Download className="w-3.5 h-3.5" /> Export Report
          </button>

          <button
            type="button"
            onClick={handleCopyLogs}
            className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
            title="Copy current formatted view"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-red-950/50 text-zinc-400 hover:text-red-400 transition cursor-pointer"
            title="Clear logs"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {rawLogs.length === 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-isro-orange transition cursor-pointer"
              title="Reset default logs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Telemetry Gauge Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 px-5 py-2.5 border-b border-zinc-900 bg-black/60 text-xs">
        <div className="px-3 py-2 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex items-center justify-between">
          <div>
            <span className="text-zinc-500 font-mono text-[9px] block uppercase tracking-wider">Prompt Eval Speed</span>
            <span className="text-cyan-300 font-mono font-bold text-sm flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-cyan-400" /> {stats.promptEvalSpeed} <span className="text-[10px] text-cyan-500">tok/s</span>
            </span>
          </div>
          <Gauge className="w-5 h-5 text-cyan-500/40" />
        </div>

        <div className="px-3 py-2 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex items-center justify-between">
          <div>
            <span className="text-zinc-500 font-mono text-[9px] block uppercase tracking-wider">Generation Speed</span>
            <span className="text-amber-300 font-mono font-bold text-sm flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-amber-400" /> {stats.generationSpeed} <span className="text-[10px] text-amber-500">tok/s</span>
            </span>
          </div>
          <Gauge className="w-5 h-5 text-amber-500/40" />
        </div>

        <div className="px-3 py-2 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex items-center justify-between">
          <div>
            <span className="text-zinc-500 font-mono text-[9px] block uppercase tracking-wider">Peak Memory (KV Cache)</span>
            <span className="text-purple-300 font-mono font-bold text-sm flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-purple-400" /> {stats.peakMemoryMiB} <span className="text-[10px] text-purple-500">MiB</span>
            </span>
          </div>
          <Layers className="w-5 h-5 text-purple-500/40" />
        </div>

        <div className="px-3 py-2 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex items-center justify-between">
          <div>
            <span className="text-zinc-500 font-mono text-[9px] block uppercase tracking-wider">Slot Server Status</span>
            <span className="text-emerald-400 font-mono font-bold text-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {stats.activeSlotsCount > 0 ? 'SLOT 0 ACTIVE' : 'SLOT 0 IDLE'}
            </span>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-500/40" />
        </div>
      </div>

      {/* 3. Search & Log Category Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-2 border-b border-zinc-900 bg-zinc-950/40 gap-2">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          <span className="text-[10px] font-mono text-zinc-500 uppercase mr-1">Filter:</span>
          {['ALL', 'METRIC', 'CONFIG', 'SLOT', 'HTTP'].map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setFilterLevel(lvl)}
              className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono transition cursor-pointer ${
                filterLevel === lvl
                  ? 'bg-zinc-800 text-white font-bold border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        {/* Search Bar & Auto-Scroll Toggle */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1.2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter log parameters or text..."
              className="w-full pl-8 pr-3 py-1 bg-zinc-900/80 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <button
            type="button"
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-2 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider border transition cursor-pointer ${
              autoScroll
                ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500'
            }`}
          >
            Auto-Scroll: {autoScroll ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* 4. Formatted Log Content Display Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-2.5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent bg-black/90 selection:bg-cyan-950 selection:text-cyan-200"
      >
        {filteredEntries.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-40 text-center p-8">
            <Terminal className="w-12 h-12 mb-3 text-zinc-500" />
            <p className="text-xs font-mono uppercase tracking-widest text-zinc-400">
              No matching Ollama slot server logs found.<br />
              Try resetting filters or initiating a query.
            </p>
          </div>
        ) : (
          <>
            {/* VIEW MODE A: FORMATTED CARDS (Human Readable for Everyone) */}
            {viewMode === 'cards' && (
              <div className="space-y-2">
                {filteredEntries.map((entry) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setSelectedEntry(entry)}
                    className="group rounded-xl border border-zinc-800/80 bg-zinc-950/70 hover:bg-zinc-900/80 p-3.5 transition-all cursor-pointer shadow-sm hover:border-zinc-700"
                  >
                    {/* Header line of card */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border font-bold uppercase ${getLevelBadge(entry.level)}`}>
                          {entry.level}
                        </span>
                        <span className="text-xs font-mono font-semibold text-zinc-200">
                          {entry.component}
                        </span>
                        {entry.slotId !== undefined && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-cyan-400">
                            Slot #{entry.slotId}
                          </span>
                        )}
                        {entry.taskId !== undefined && entry.taskId > 0 && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-indigo-300">
                            Task #{entry.taskId}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {entry.timestamp}
                      </span>
                    </div>

                    {/* Plain-English Explanation (formatted for everyone) */}
                    <div className="mb-2 text-xs font-medium text-emerald-300/90 flex items-start gap-2 bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-900/30">
                      <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{entry.summary}</span>
                    </div>

                    {/* Key Metrics / KV Params pill tags if available */}
                    {entry.kvParams && Object.keys(entry.kvParams).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {Object.entries(entry.kvParams).slice(0, 6).map(([k, v]) => (
                          <span key={k} className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                            <span className="text-purple-400">{k}</span> = <span className="text-amber-300 font-bold">{String(v)}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Raw command snippet collapsible */}
                    <div className="font-mono text-[10px] text-zinc-500 group-hover:text-zinc-400 bg-black/60 p-2 rounded border border-zinc-900 overflow-x-auto truncate">
                      {entry.raw}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* VIEW MODE B: PRETTY SYNTAX HIGHLIGHTED TERMINAL */}
            {viewMode === 'syntax' && (
              <div className="font-mono text-[11px] leading-relaxed bg-black p-4 rounded-xl border border-zinc-900 space-y-1">
                {filteredEntries.map((entry, idx) => (
                  <div key={entry.id} className="flex items-start gap-3 hover:bg-zinc-900/50 p-1 rounded transition">
                    <span className="text-zinc-600 text-[10px] w-6 select-none text-right shrink-0">{idx + 1}</span>
                    <div className="flex-1 flex flex-wrap gap-x-1.5">
                      {entry.tokens.map((tok, tIdx) => {
                        let colorClass = 'text-zinc-300';
                        if (tok.type === 'tag') colorClass = 'text-emerald-400 font-bold';
                        else if (tok.type === 'task') colorClass = 'text-cyan-300 font-semibold';
                        else if (tok.type === 'slot') colorClass = 'text-indigo-400';
                        else if (tok.type === 'keyword') colorClass = 'text-purple-400 font-semibold';
                        else if (tok.type === 'number') colorClass = 'text-amber-300 font-bold';
                        else if (tok.type === 'status-ok') colorClass = 'text-emerald-400 font-bold';
                        else if (tok.type === 'symbol') colorClass = 'text-zinc-500';

                        return (
                          <span key={tIdx} className={colorClass}>
                            {tok.text}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* VIEW MODE C: PRETTY INDENTED STRUCTURED JSON */}
            {viewMode === 'json' && (
              <div className="space-y-3 font-mono text-[11px]">
                {filteredEntries.map((entry) => (
                  <div key={entry.id} className="bg-zinc-950/80 border border-zinc-800 p-3.5 rounded-xl">
                    <div className="flex items-center justify-between mb-1 text-[10px] text-zinc-400 border-b border-zinc-900 pb-1.5">
                      <span className="text-emerald-400 font-bold">{entry.component} (Entry #{entry.index + 1})</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(formatEntryToJson(entry));
                        }}
                        className="text-zinc-500 hover:text-zinc-200 transition cursor-pointer flex items-center gap-1 text-[9px]"
                      >
                        <Copy className="w-3 h-3" /> Copy JSON
                      </button>
                    </div>
                    <pre className="text-emerald-300/90 whitespace-pre-wrap overflow-x-auto p-2 bg-black/80 rounded border border-zinc-900 text-[10px]">
                      {formatEntryToJson(entry)}
                    </pre>
                  </div>
                ))}
              </div>
            )}

            {/* VIEW MODE D: RAW TEXT CONSOLE */}
            {viewMode === 'raw' && (
              <div className="font-mono text-[10px] leading-relaxed bg-black/90 p-4 rounded-xl border border-zinc-900 text-zinc-300 space-y-1 selection:bg-emerald-900 selection:text-white">
                {filteredEntries.map((entry) => (
                  <div key={entry.id} className="hover:bg-zinc-900/60 px-1 py-0.5 rounded">
                    {entry.raw}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* 5. Interactive Log Detail Explainer Modal */}
      <AnimatePresence>
        {selectedEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedEntry(null)}
            className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white">Log Inspector & Plain-English Analysis</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEntry(null)}
                  className="text-zinc-500 hover:text-white transition cursor-pointer text-sm font-mono"
                >
                  ✕ Close
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-xs font-mono uppercase text-zinc-500 block mb-1">Formatted Explanation</span>
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-sm font-medium">
                    {selectedEntry.summary}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-mono uppercase text-zinc-500 block mb-1">Component & Event Type</span>
                  <div className="flex gap-2 text-xs font-mono">
                    <span className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-cyan-300">
                      {selectedEntry.component}
                    </span>
                    <span className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-purple-300">
                      Level: {selectedEntry.level}
                    </span>
                    {selectedEntry.slotId !== undefined && (
                      <span className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-indigo-300">
                        Slot #{selectedEntry.slotId}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-mono uppercase text-zinc-500 block mb-1">Raw Log Command</span>
                  <pre className="p-3 bg-black rounded-xl border border-zinc-900 text-xs font-mono text-zinc-300 overflow-x-auto">
                    {selectedEntry.raw}
                  </pre>
                </div>

                {selectedEntry.kvParams && Object.keys(selectedEntry.kvParams).length > 0 && (
                  <div>
                    <span className="text-xs font-mono uppercase text-zinc-500 block mb-1">Extracted Parameters</span>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      {Object.entries(selectedEntry.kvParams).map(([k, v]) => (
                        <div key={k} className="p-2 rounded bg-zinc-900/80 border border-zinc-800 flex justify-between">
                          <span className="text-purple-400">{k}</span>
                          <span className="text-amber-300 font-bold">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedEntry(null)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl transition cursor-pointer"
                >
                  Got It
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
