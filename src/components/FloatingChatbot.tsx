/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { motion, useDragControls } from 'motion/react';
import { 
  Bot, 
  X, 
  Minus, 
  Maximize2, 
  Send, 
  Sparkles, 
  ShieldCheck, 
  RefreshCcw, 
  Trash2, 
  Layers, 
  ArrowRight,
  ChevronDown,
  GripVertical,
  Move
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage, AgentAction, Domain } from '../types';
import { sanitizeOutput } from '../App';

interface FloatingChatbotProps {
  isOpen: boolean;
  isMinimized: boolean;
  onToggleOpen: () => void;
  onToggleMinimize: () => void;
  messages: ChatMessage[];
  isQuerying: boolean;
  currentAgentAction: AgentAction | null;
  onSendMessage: (query: string, domain?: Domain) => void;
  onClearHistory: () => void;
  airGappedMode: boolean;
  selectedDomain: Domain;
  setSelectedDomain: (domain: Domain) => void;
  activeTab: string;
}

export const FloatingChatbot: React.FC<FloatingChatbotProps> = ({
  isOpen,
  isMinimized,
  onToggleOpen,
  onToggleMinimize,
  messages,
  isQuerying,
  currentAgentAction,
  onSendMessage,
  onClearHistory,
  airGappedMode,
  selectedDomain,
  setSelectedDomain,
  activeTab
}) => {
  const [inputQuery, setInputQuery] = useState('');
  const [showDomainMenu, setShowDomainMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  
  // Framer Motion drag controls for smooth header-based dragging
  const dragControls = useDragControls();

  // Auto scroll to bottom when messages update
  useEffect(() => {
    if (isOpen && !isMinimized) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isQuerying, isOpen, isMinimized]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || isQuerying) return;
    onSendMessage(inputQuery.trim(), selectedDomain);
    setInputQuery('');
  };

  const starterChips = [
    { label: "GFR 2017 Procurement", query: "What are the key financial thresholds under GFR 2017 for aerospace payload procurement?" },
    { label: "Thermal Limits", query: "What are the maximum operating temperature limits for satellite subsystems?" },
    { label: "DACL Security Policy", query: "Explain how Dynamic Access Control Lists (DACL) sanitize document retrieval." },
    { label: "GraphRAG Triplets", query: "Retrieve entity relationship triplets for satellite telemetry systems." }
  ];

  // Tab label display
  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'console': return 'Console';
      case 'activities': return 'Swarm Activities';
      case 'database': return 'Vector Nodes';
      case 'ingest': return 'Doc Ingestion';
      case 'history': return 'Mission History';
      case 'evaluate': return 'Evaluation & Benchmarks';
      case 'baseline': return 'Baseline Comparison';
      default: return 'Overview';
    }
  };

  // When chatbot is closed or minimized, display ONLY the floating retro robot icon via createPortal on document.body
  if (!isOpen || isMinimized) {
    return createPortal(
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => {
          setTimeout(() => setIsDragging(false), 50);
        }}
        initial={false}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => {
          if (isDragging) return;
          if (!isOpen) onToggleOpen();
          if (isMinimized) onToggleMinimize();
        }}
        role="button"
        tabIndex={0}
        className="fixed bottom-6 right-6 z-[99999] p-3 rounded-full bg-zinc-950/90 backdrop-blur-md border border-orange-500/60 shadow-[0_10px_35px_rgba(234,88,12,0.6)] cursor-grab active:cursor-grabbing group hover:shadow-[0_15px_45px_rgba(6,182,212,0.8)] transition-all flex items-center justify-center select-none"
        title="IRSARGO AI Assistant (Click to open, drag to move)"
      >
        <div className="relative flex items-center justify-center pointer-events-none select-none">
          <img 
            src="/chatbot-icon.png" 
            alt="IRSARGO AI Assistant" 
            draggable={false}
            className="w-12 h-12 object-contain group-hover:scale-110 group-hover:rotate-12 transition-transform drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)] pointer-events-none select-none" 
          />
          {isQuerying ? (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-zinc-950 flex items-center justify-center">
              <RefreshCcw className="w-2.5 h-2.5 text-zinc-950 animate-spin" />
            </span>
          ) : (
            <>
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-zinc-950" />
            </>
          )}
        </div>
      </motion.div>,
      document.body
    );
  }

  // Fully EXPANDED Floating Chatbot Window via createPortal on document.body
  return createPortal(
    <motion.div
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0.05}
      initial={false}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed bottom-6 right-6 z-[99999] w-[calc(100vw-3rem)] sm:w-[420px] md:w-[450px] h-[580px] max-h-[82vh] flex flex-col rounded-2xl border border-[var(--border-structure)] bg-zinc-950/95 backdrop-blur-2xl shadow-[0_25px_70px_rgba(0,0,0,0.95)] overflow-hidden"
    >
      {/* Top Header Bar (Draggable Handle) */}
      <div 
        onPointerDown={(e) => dragControls.start(e)}
        className="flex items-center justify-between py-3 px-4 bg-gradient-to-r from-zinc-900/90 via-zinc-900/95 to-zinc-900/90 border-b border-[var(--border-structure)] shrink-0 select-none cursor-grab active:cursor-grabbing hover:bg-zinc-850/80 transition-colors group"
        title="Click and drag to move window anywhere on screen"
      >
        <div className="flex items-center gap-2">
          {/* Drag Handle Icon */}
          <div className="p-1 rounded text-zinc-500 group-hover:text-orange-400 transition-colors">
            <GripVertical className="w-4 h-4" />
          </div>

          <div className="relative p-1 rounded-xl bg-orange-500/10 border border-orange-500/30">
            <img 
              src="/chatbot-icon.png" 
              alt="IRSARGO Robot" 
              className="w-5 h-5 object-contain" 
            />
            <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${airGappedMode ? 'bg-amber-400' : 'bg-emerald-400'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-mono font-extrabold uppercase text-white tracking-wide">
                IRSARGO AI Assistant
              </h3>
              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                airGappedMode 
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' 
                  : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              }`}>
                {airGappedMode ? 'OFFLINE' : 'ONLINE'}
              </span>
            </div>
            <p className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
              <span>Active view:</span>
              <span className="text-cyan-400 font-semibold">{getTabLabel(activeTab)}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div 
          className="flex items-center gap-1"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {messages.length > 0 && (
            <button
              onClick={onClearHistory}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition cursor-pointer"
              title="Clear Chat History"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onToggleMinimize}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
            title="Minimize Floating Window"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleMinimize}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition cursor-pointer"
            title="Minimize Floating Assistant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs scrollbar-thin scrollbar-thumb-zinc-700">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-zinc-400 space-y-4">
            <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20">
              <img 
                src="/chatbot-icon.png" 
                alt="IRSARGO Robot" 
                className="w-10 h-10 object-contain drop-shadow-[0_0_15px_rgba(234,88,12,0.4)]" 
              />
            </div>
            <div>
              <p className="text-xs font-mono font-bold text-zinc-200 uppercase">Zero-Trust Assistant Ready</p>
              <p className="text-[11px] text-zinc-400 max-w-xs mt-1">
                Ask questions about ISRO satellite technical guides or GFR 2017 compliance anytime. Drag the window anywhere using the top bar.
              </p>
            </div>

            {/* Quick Starter Chips */}
            <div className="w-full space-y-2 pt-2">
              <p className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider text-left">Suggested Queries:</p>
              <div className="flex flex-col gap-1.5">
                {starterChips.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onSendMessage(chip.query, selectedDomain);
                    }}
                    className="w-full text-left p-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-850 hover:border-orange-500/40 text-[11px] text-zinc-300 hover:text-white transition flex items-center justify-between group cursor-pointer"
                  >
                    <span className="truncate">{chip.label}</span>
                    <ArrowRight className="w-3 h-3 text-zinc-500 group-hover:text-orange-400 transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1">
                <span className="text-[10px] font-mono text-zinc-500">
                  {msg.sender === 'user' ? 'Operator' : 'IRSARGO AI'}
                </span>
                <span className="text-[9px] font-mono text-zinc-600">
                  {msg.timestamp}
                </span>
              </div>

              <div
                className={`p-3 rounded-2xl max-w-[90%] font-sans text-[12px] leading-relaxed shadow-lg ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-tr-none'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-none'
                }`}
              >
                {msg.sender === 'user' ? (
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                ) : (
                  <div className="space-y-2">
                    <div className="prose prose-invert prose-xs max-w-none text-zinc-200">
                      <ReactMarkdown>
                        {sanitizeOutput(msg.text, msg.response?.retrievedNodes || [])}
                      </ReactMarkdown>
                    </div>

                    {/* Metrics & Proof Badges if available */}
                    {msg.response?.metrics && (
                      <div className="pt-2 border-t border-zinc-800/80 flex flex-wrap gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[9px]">
                          Fidelity: {Math.round(msg.response.metrics.groundingFidelity * 100)}%
                        </span>
                        <span className="px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono text-[9px]">
                          Retrieval: {Math.round(msg.response.metrics.retrievalAccuracy * 100)}%
                        </span>
                        {msg.response.traceLog?.[0]?.zkpStatus === 'verified' && (
                          <span className="px-2 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono text-[9px] flex items-center gap-1">
                            <ShieldCheck className="w-2.5 h-2.5" /> ZK Proof Verified
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Live Querying Agent Indicator */}
        {isQuerying && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-300 font-mono text-xs animate-pulse">
            <RefreshCcw className="w-4 h-4 animate-spin text-orange-400 shrink-0" />
            <div className="flex-1 overflow-hidden">
              <p className="font-bold text-[11px]">
                {currentAgentAction?.role || 'IRSARGO Orchestrator'}
              </p>
              <p className="text-[10px] text-zinc-400 truncate">
                {currentAgentAction?.action || 'Executing multi-agent retrieval & SMT logic proof...'}
              </p>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Footer Controls & Query Form */}
      <div className="p-3 bg-zinc-900/90 border-t border-[var(--border-structure)] shrink-0 space-y-2">
        {/* Domain Selector & Filters */}
        <div className="flex items-center justify-between text-[10px] font-mono">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDomainMenu(!showDomainMenu)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
            >
              <Layers className="w-3 h-3 text-orange-400" />
              <span className="truncate max-w-[150px]">{selectedDomain}</span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            {showDomainMenu && (
              <div className="absolute bottom-full left-0 mb-1 w-56 rounded-xl bg-zinc-900 border border-zinc-700 shadow-2xl p-1 z-50 space-y-1">
                {Object.values(Domain).map((dom) => (
                  <button
                    key={dom}
                    type="button"
                    onClick={() => {
                      setSelectedDomain(dom);
                      setShowDomainMenu(false);
                    }}
                    className={`w-full text-left p-2 rounded-lg text-[10px] font-mono transition ${
                      selectedDomain === dom 
                        ? 'bg-orange-500/20 text-orange-300 font-bold border border-orange-500/40' 
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    {dom}
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="text-zinc-500 flex items-center gap-1">
            <Move className="w-2.5 h-2.5 text-zinc-500" /> Drag header to move
          </span>
        </div>

        {/* Form Input */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask IRSARGO AI..."
            disabled={isQuerying}
            className="flex-1 py-2.5 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 font-sans text-xs focus:outline-none focus:border-orange-500/80 transition disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isQuerying}
            className="p-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-orange-500/20 transition cursor-pointer shrink-0"
          >
            {isQuerying ? (
              <RefreshCcw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Send className="w-4 h-4 text-white" />
            )}
          </button>
        </form>
      </div>
    </motion.div>,
    document.body
  );
};

export default FloatingChatbot;
