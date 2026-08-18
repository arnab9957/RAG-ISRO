import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, Search, Cpu, ShieldCheck, Terminal, Database, Activity, 
  ArrowRight, Shield, Layers, Zap, Globe, Sparkles, Video, Play, Pause, 
  Volume2, VolumeX, CheckCircle2, ChevronRight, HelpCircle, Lock, LogOut, Gauge, Github
} from 'lucide-react';
import { ThemeToggle } from './ui/ThemeToggle';
import { OfflineModeToggle } from './ui/OfflineModeToggle';
import { LiquidButton } from './ui/liquid-glass-button';

interface LandingPageProps {
  onLaunchConsole: (initialQuery?: string) => void;
  onExploreOllama: () => void;
  onViewDatabase: () => void;
  onAccessBaselineRag?: () => void;
  effectiveUser?: any;
  onSignIn?: () => void;
  onLogout?: () => void;
  airGappedMode?: boolean;
  onToggleAirGappedMode?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLaunchConsole,
  onExploreOllama,
  onViewDatabase,
  onAccessBaselineRag,
  effectiveUser,
  onSignIn,
  onLogout,
  airGappedMode = false,
  onToggleAirGappedMode
}) => {
  const [activeVideo, setActiveVideo] = useState<'lp1' | 'lp2'>('lp1');
  const [activeGuideStep, setActiveGuideStep] = useState<number>(0);
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);

  const guideSteps = [
    {
      stepNumber: '01',
      badge: 'AIR-GAPPED vs CLOUD MODE',
      title: 'Select Operational Execution Mode',
      icon: Globe,
      description: 'Choose your desired execution environment. In OFFLINE Mode (Glowing Orange), the system runs 100% air-gapped with local Ollama VLM + ChromaDB vector embeddings for zero data exfiltration. In ONLINE Mode (Glowing Emerald/Cyan), IRSARGO leverages Groq/Gemini API acceleration for high-speed cloud synthesis.',
      bulletPoints: [
        'OFFLINE MODE: Air-gapped confidentiality, local Ollama Moondream2 vision parsing.',
        'ONLINE MODE: Cloud API acceleration (Groq llama-3.3-70b & Gemini 2.0 Flash).',
        'Toggle instantly using the glowing Liquid Button in the top header bar.'
      ],
      tip: 'Use Offline Mode when handling sensitive mission technical specs or classified GFR documents.',
      actionLabel: 'Toggle Mode in Header',
      shortDesc: 'Choose between 100% Air-Gapped local Ollama & fast Cloud API acceleration.',
      action: (_onConsole: any, _onBaseline: any, _onAuth: any, onToggleMode: any) => {
        if (onToggleMode) onToggleMode();
      }
    },
    {
      stepNumber: '02',
      badge: 'KEYCLOAK RBAC & PKI',
      title: 'Authenticate Identity & Clearance Level',
      icon: Lock,
      description: 'Click the Sign In button in the top right to open the Keycloak IAM portal. IRSARGO enforces role-based access control (RBAC) and DACL clearance rules. You can select quick test personas (isro_admin Level 5 Top Secret vs isro_operator Level 3 Confidential vs Guest Level 1 Public) to test data boundary enforcement.',
      bulletPoints: [
        'Level 5 Administrator: Full access across propulsion, telemetry, and administrative rules.',
        'Level 3 Operator: Scoped avionics access, excluded from propulsion secrets.',
        'Level 1 Guest: Access strictly confined to public administrative GFR rules.'
      ],
      tip: 'Switch between isro_admin and isro_operator test personas to verify role-based document access control in action.',
      actionLabel: 'Open Keycloak Sign In',
      shortDesc: 'Authenticate via Keycloak OIDC with Level 1 to 5 Clearance Levels.',
      action: (_onConsole: any, _onBaseline: any, onAuth: any) => {
        if (onAuth) onAuth();
      }
    },
    {
      stepNumber: '03',
      badge: 'SYNTHESIS ENGINE',
      title: 'Dispatch Query & View 3D Globe Telemetry',
      icon: Rocket,
      description: 'Launch the Intelligence Console and enter space mission queries. While your query is processing, the interactive 3D particle satellite globe renders active satellite orbits (LEO/GEO) and real-time SMT formal logic constraint verification.',
      bulletPoints: [
        'Instant Query Dispatch: Select sample queries or type custom space mission questions.',
        'Interactive 3D Globe: Visualizes satellite orbit telemetry & multi-agent reasoning.',
        'Structured Answer: Returns verified technical synthesis with source document citations.'
      ],
      tip: 'Click any sample query card on the landing page to instantly jump to the active query console.',
      actionLabel: 'Launch Query Console',
      shortDesc: 'Dispatch queries & watch the interactive 3D satellite particle globe.',
      action: (onConsole: any) => {
        if (onConsole) onConsole();
      }
    },
    {
      stepNumber: '04',
      badge: 'FORMAL LOGIC AUDIT',
      title: 'Inspect Swarm Traces & Compare Baseline RAG',
      icon: Activity,
      description: 'Review the step-by-step reasoning of all 4 synchronized agents (Query Reformulator, Vector Retriever, Guardrail Auditor, and Synthesizer). Compare IRSARGO formal verified outputs against the un-sanitized Access Baseline Naive RAG engine.',
      bulletPoints: [
        '4-Agent Swarm Audit: Trace exact sub-goals, SMT solver outputs, and hallucination scores.',
        'Naive Baseline Comparison: Evaluate un-sanitized vector search against formal logic verification.',
        '3D Knowledge Graph: Interactively explore interconnected PDF nodes, entities, and citations.'
      ],
      tip: 'Access the Baseline Naive RAG tab to see how formal logic verification eliminates hallucinations found in standard RAG engines.',
      actionLabel: 'Compare Baseline Naive RAG',
      shortDesc: 'Audit 4-agent swarm traces and compare naive baseline RAG outputs.',
      action: (_onConsole: any, onBaseline: any) => {
        if (onBaseline) onBaseline();
      }
    }
  ];

  const sampleQueries = [
    "What are the launch parameters and payload details for Chandrayaan-3?",
    "Summarize thermal shielding specifications for ISRO satellite systems.",
    "Explain the offline multimodal VLM document ingestion architecture.",
    "Extract telemetry metrics from the thesis document dataset."
  ];

  return (
    <div className="relative min-h-screen w-full text-[var(--text-main)] selection:bg-orange-500 selection:text-white flex flex-col">
      
      {/* 0. LANDING PAGE DEDICATED HEADER TOP BAR */}
      <header className="relative z-30 w-full px-4 sm:px-6 lg:px-10 h-16 sm:h-20 flex items-center justify-between">
        {/* Left: Landing Logo & Air-Gapped Mode Toggle */}
        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
          <img 
            src="/logo.png" 
            alt="IRSARGO Logo" 
            style={{ height: '90px', width: 'auto', maxWidth: '125px' }}
            className="h-4 sm:h-5 w-auto max-w-[80px] sm:max-w-[95px] object-contain transition-all hover:scale-105 shrink-0 my-auto" 
          />

          {onToggleAirGappedMode && (
            <div className="hidden lg:flex items-center">
              <LiquidButton
                onClick={onToggleAirGappedMode}
                glassClassName={
                  airGappedMode
                    ? "bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 border-2 border-amber-200/90 shadow-[0_0_30px_rgba(245,100,2,0.85),0_0_12px_rgba(239,68,68,0.7),inset_0_2px_4px_rgba(255,255,255,0.95)] group-hover:brightness-125 group-hover:scale-105"
                    : "bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 border-2 border-emerald-200/90 shadow-[0_0_30px_rgba(16,185,129,0.85),0_0_12px_rgba(6,182,212,0.7),inset_0_2px_4px_rgba(255,255,255,0.95)] group-hover:brightness-125 group-hover:scale-105"
                }
                size="sm"
                className="flex items-center justify-center gap-1.5 py-1.5 px-4 text-[11px] font-mono font-bold text-white shadow-xl cursor-pointer"
              >
                <ShieldCheck className={`w-3.5 h-3.5 ${airGappedMode ? 'text-white animate-pulse drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]' : 'text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]'}`} />
                <span className="tracking-widest font-black uppercase text-[10px] text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]">
                  {airGappedMode ? 'OFFLINE' : 'ONLINE'}
                </span>
              </LiquidButton>
            </div>
          )}
        </div>

        {/* Right: How to Use Guide & Theme Toggle & GitHub & Sign In / User Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('interactive-user-guide');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-structure)] hover:border-orange-500/50 text-xs font-mono font-bold text-[var(--text-main)] transition cursor-pointer shadow-md whitespace-nowrap shrink-0"
          >
            <HelpCircle className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
            <span>How to Use Guide</span>
          </button>

          <ThemeToggle />

          <a
            href="https://github.com/arnab9957/RAG-ISRO.git"
            target="_blank"
            rel="noopener noreferrer"
            title="View Source Code on GitHub"
            className="hidden sm:inline-block shrink-0"
          >
            <LiquidButton
              size="sm"
              glassClassName="bg-gradient-to-r from-zinc-900/80 via-black/80 to-zinc-900/80 border border-white/40 shadow-[0_0_15px_rgba(255,255,255,0.2)] group-hover:border-white/80 group-hover:scale-105"
              className="flex items-center justify-center gap-1.5 py-1.5 px-3 text-[11px] font-mono font-bold text-white shadow-xl cursor-pointer whitespace-nowrap"
            >
              <Github className="w-3.5 h-3.5 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]" />
              <span className="tracking-wider font-extrabold text-[10px] text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]">
                GitHub
              </span>
            </LiquidButton>
          </a>

          {onAccessBaselineRag && (
            <button
              type="button"
              onClick={onAccessBaselineRag}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-red-950/60 hover:bg-red-900/60 border border-red-500/40 text-red-300 font-mono text-[11px] sm:text-xs font-bold transition shadow-lg cursor-pointer whitespace-nowrap shrink-0"
            >
              <Layers className="w-3.5 h-3.5 text-red-400" />
              <span>Baseline RAG</span>
            </button>
          )}

          {!effectiveUser ? (
            <button
              type="button"
              onClick={onSignIn}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-mono text-xs font-bold transition shadow-lg shadow-orange-600/30 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Lock className="w-3.5 h-3.5" /> <span className="whitespace-nowrap">Sign In</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                type="button"
                onClick={() => onLaunchConsole()}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold transition shadow-lg shadow-cyan-600/30 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Terminal className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Launch Console</span>
              </button>
              <div className="flex items-center gap-2 border-l border-[var(--border-structure)] pl-2 sm:pl-4 h-9 sm:h-10 shrink-0">
                <div className="text-right hidden sm:block">
                  <p className="text-[11px] font-bold text-[var(--text-main)] tracking-wide">{effectiveUser.displayName}</p>
                  <p className="text-[8px] font-mono text-[var(--accent-cyan)] uppercase tracking-wider">{effectiveUser.role}</p>
                </div>
                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="p-1.5 bg-[var(--bg-surface)] border border-[var(--border-structure)] hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-[var(--text-muted)] transition cursor-pointer shrink-0"
                    title="Logout operator session"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </header>
      
      {/* 1. CONTINUOUS SEQUENTIAL VIDEO BACKGROUND ENGINE (FULL SCREEN & RESPONSIVE COVER) */}
      <div className="fixed inset-0 w-screen h-screen min-w-full min-h-screen h-[100dvh] z-0 overflow-hidden pointer-events-none opacity-70 dark:opacity-85 transition-opacity duration-300">
        {/* Video 1 Container */}
        <div 
          className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${
            activeVideo === 'lp1' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'
          }`}
        >
          <video
            ref={video1Ref}
            autoPlay
            muted
            playsInline
            onEnded={() => {
              setActiveVideo('lp2');
              if (video2Ref.current) {
                video2Ref.current.currentTime = 0;
                video2Ref.current.play().catch(() => {});
              }
            }}
            className="w-full h-full min-w-full min-h-full object-cover scale-110 filter brightness-90 contrast-105"
          >
            <source src="/videos/lp.mp4" type="video/mp4" />
            <source src="/datasets/lp.mp4" type="video/mp4" />
          </video>
        </div>

        {/* Video 2 Container */}
        <div 
          className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${
            activeVideo === 'lp2' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'
          }`}
        >
          <video
            ref={video2Ref}
            autoPlay
            muted
            playsInline
            onEnded={() => {
              setActiveVideo('lp1');
              if (video1Ref.current) {
                video1Ref.current.currentTime = 0;
                video1Ref.current.play().catch(() => {});
              }
            }}
            className="w-full h-full min-w-full min-h-full object-cover scale-110 filter brightness-90 hue-rotate-15"
          >
            <source src="/videos/lp2.mp4" type="video/mp4" />
            <source src="/datasets/lp2.mp4" type="video/mp4" />
          </video>
        </div>

        {/* Responsive Backdrop Overlays (Ensures video covers 100% of screen while maintaining high text readability) */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60 z-20 pointer-events-none" />
        <div className="absolute inset-0 bg-[var(--bg-base)]/40 dark:bg-[var(--bg-base)]/30 backdrop-brightness-95 z-20 pointer-events-none" />
        
        {/* Tech Grid Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none z-20"
          style={{
            backgroundImage: `radial-gradient(var(--border-structure) 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />
      </div>

      {/* 3. HERO CONTENT SECTION */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-20 flex flex-col items-center text-center">
        
        {/* Top ISRO Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-surface)] border border-[var(--border-structure)] shadow-lg backdrop-blur-xl mb-8 group hover:border-[var(--accent-cyan)] transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-orange-400 animate-pulse" />
          <span className="text-xs font-mono text-[var(--text-main)] tracking-wide">
            Multi-Agent SMT Formal Logic RAG Architecture
          </span>
          <ChevronRight className="w-4 h-4 text-[var(--text-subtle)] group-hover:translate-x-1 transition-transform" />
        </motion.div>

        {/* Hero Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight"
        >
          Zero-Trust Formal Logic <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-cyan-400 bg-clip-text text-transparent filter drop-shadow-lg">
            Space Mission RAG Engine
          </span>
        </motion.h1>

        {/* Hero Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-base sm:text-xl text-[var(--text-muted)] max-w-3xl mb-12 font-sans font-normal leading-relaxed"
        >
          Air-gapped offline RAG engine powered by local <span className="text-[var(--accent-cyan)] font-semibold">Ollama Moondream2 VLM</span> page parsing, <span className="text-orange-400 font-semibold">ChromaDB Vector Retrieval</span>, and Keycloak Enterprise Security.
        </motion.p>

        {/* Primary Call-to-Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-4 mb-16"
        >
          <LiquidButton
            onClick={() => onLaunchConsole()}
            glassClassName="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 border-2 border-amber-200/90 shadow-[0_0_40px_rgba(245,100,2,0.85),0_0_15px_rgba(239,68,68,0.7),inset_0_2px_4px_rgba(255,255,255,0.95)] group-hover:brightness-125 group-hover:scale-105"
            size="lg"
            className="px-8 py-4 text-base font-bold text-white shadow-2xl cursor-pointer"
          >
            <Rocket className="w-5 h-5 text-white animate-bounce drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]" />
            <span className="tracking-wide text-white font-extrabold drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]">
              Launch Intelligence Console
            </span>
            <ArrowRight className="w-5 h-5 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]" />
          </LiquidButton>

          {onAccessBaselineRag && (
            <LiquidButton
              onClick={onAccessBaselineRag}
              glassClassName="bg-gradient-to-r from-red-600 via-rose-500 to-pink-600 border-2 border-rose-200/90 shadow-[0_0_35px_rgba(225,29,72,0.8),inset_0_2px_4px_rgba(255,255,255,0.95)] group-hover:brightness-125 group-hover:scale-105"
              size="lg"
              className="px-7 py-4 text-sm font-mono font-bold text-white shadow-xl cursor-pointer"
            >
              <Layers className="w-5 h-5 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]" />
              <span className="tracking-wide text-white font-bold drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]">
                Access Baseline Naive RAG
              </span>
            </LiquidButton>
          )}

          <LiquidButton
            onClick={onExploreOllama}
            glassClassName="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 border-2 border-cyan-200/90 shadow-[0_0_35px_rgba(6,182,212,0.8),inset_0_2px_4px_rgba(255,255,255,0.95)] group-hover:brightness-125 group-hover:scale-105"
            size="lg"
            className="px-7 py-4 text-sm font-mono font-bold text-white shadow-xl cursor-pointer"
          >
            <Cpu className="w-5 h-5 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]" />
            <span className="tracking-wide text-white font-bold drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]">
              Inspect Ollama LLM Telemetry
            </span>
          </LiquidButton>

          <LiquidButton
            onClick={onViewDatabase}
            glassClassName="bg-gradient-to-r from-purple-500 via-indigo-500 to-violet-600 border-2 border-purple-200/90 shadow-[0_0_35px_rgba(168,85,247,0.8),inset_0_2px_4px_rgba(255,255,255,0.95)] group-hover:brightness-125 group-hover:scale-105"
            size="lg"
            className="px-7 py-4 text-sm font-mono font-bold text-white shadow-xl cursor-pointer"
          >
            <Database className="w-5 h-5 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]" />
            <span className="tracking-wide text-white font-bold drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]">
              Browse Knowledge Base
            </span>
          </LiquidButton>
        </motion.div>

        {/* 4. LIVE METRICS & TELEMETRY COUNTER BAR */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-4xl p-4 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-structure)] backdrop-blur-2xl panel-shadow-box mb-16"
        >
          <div className="p-4 rounded-2xl bg-[var(--bg-base)]/50 border border-[var(--border-structure)]/50 text-left">
            <span className="text-[var(--text-subtle)] font-mono text-[10px] uppercase block mb-1">RAG Precision</span>
            <span className="text-2xl font-extrabold text-orange-400 font-mono flex items-center gap-1">
              99.8% <Sparkles className="w-4 h-4 text-orange-400" />
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">Cryptographic Verification</span>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--bg-base)]/50 border border-[var(--border-structure)]/50 text-left">
            <span className="text-[var(--text-subtle)] font-mono text-[10px] uppercase block mb-1">Prompt Processing</span>
            <span className="text-2xl font-extrabold text-[var(--accent-cyan)] font-mono flex items-center gap-1">
              23.9 <span className="text-xs text-[var(--accent-cyan)]/70">tok/s</span>
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">llama.cpp Slot Server</span>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--bg-base)]/50 border border-[var(--border-structure)]/50 text-left">
            <span className="text-[var(--text-subtle)] font-mono text-[10px] uppercase block mb-1">Agent Swarm</span>
            <span className="text-2xl font-extrabold text-amber-400 font-mono flex items-center gap-1">
              4 Agents
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">Synchronous Reasoning</span>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--bg-base)]/50 border border-[var(--border-structure)]/50 text-left">
            <span className="text-[var(--text-subtle)] font-mono text-[10px] uppercase block mb-1">Security Standard</span>
            <span className="text-2xl font-extrabold text-emerald-400 font-mono flex items-center gap-1">
              Air-Gapped
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">Keycloak IAM Guardrails</span>
          </div>
        </motion.div>

        {/* 5. SAMPLE QUERIES QUICK-LAUNCH BAR */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="w-full max-w-4xl text-left bg-[var(--bg-surface)] border border-[var(--border-structure)] p-6 rounded-3xl backdrop-blur-2xl panel-shadow-box mb-16"
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-orange-400" />
            <h3 className="text-base font-bold text-[var(--text-main)]">Instant Telemetry Quick Queries</h3>
            <span className="text-[10px] font-mono text-[var(--text-subtle)] uppercase ml-auto">Click any query to execute</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sampleQueries.map((queryText, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onLaunchConsole(queryText)}
                className="group p-3.5 rounded-2xl bg-[var(--bg-base)]/60 hover:bg-[var(--bg-surface-hover)] border border-[var(--border-structure)]/80 hover:border-orange-500/50 text-left transition-all duration-300 cursor-pointer flex items-start justify-between gap-3"
              >
                <span className="text-xs text-[var(--text-main)] group-hover:text-orange-400 leading-snug">
                  "{queryText}"
                </span>
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-orange-400 group-hover:translate-x-1 transition-all shrink-0 mt-0.5" />
              </button>
            ))}
          </div>
        </motion.div>

        {/* 6. FEATURE SHOWCASE GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl text-left">
          {/* Feature 1 */}
          <motion.div
            whileHover={{ y: -5 }}
            className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-structure)] backdrop-blur-xl panel-shadow-box hover:border-orange-500/40 transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-4">
              <Cpu className="w-6 h-6 text-orange-400" />
            </div>
            <h4 className="text-lg font-bold text-[var(--text-main)] mb-2">4-Agent Swarm Orchestrator</h4>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Synchronized parallel agents (Query Reformulator, Chroma Retriever, Guardrail Auditor, and Synthesizer) coordinate step-by-step reasoning for complex space missions.
            </p>
          </motion.div>

          {/* Feature 2 */}
          <motion.div
            whileHover={{ y: -5 }}
            className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-structure)] backdrop-blur-xl panel-shadow-box hover:border-[var(--accent-cyan)]/40 transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent-cyan)]/10 border border-[var(--accent-cyan)]/20 flex items-center justify-center mb-4">
              <Globe className="w-6 h-6 text-[var(--accent-cyan)]" />
            </div>
            <h4 className="text-lg font-bold text-[var(--text-main)] mb-2">Offline Multimodal VLM Parsing</h4>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Local Moondream2 vision-language model transcribes complex satellite layout diagrams, thermal charts, and PDF tables without relying on external internet APIs.
            </p>
          </motion.div>

          {/* Feature 3 */}
          <motion.div
            whileHover={{ y: -5 }}
            className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-structure)] backdrop-blur-xl panel-shadow-box hover:border-purple-500/40 transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6 text-purple-400" />
            </div>
            <h4 className="text-lg font-bold text-[var(--text-main)] mb-2">Keycloak Enterprise Security</h4>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Role-based access control (RBAC), OpenLDAP integration, cryptographic hash auditing, and strict anti-data exfiltration output guardrails protect classified datasets.
            </p>
          </motion.div>
        </div>

        {/* 7. UNIQUE INTERACTIVE SYSTEM OPERATOR GUIDE */}
        <motion.div
          id="interactive-user-guide"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-6xl mt-20 text-left space-y-8 scroll-mt-24"
        >
          {/* Section Title Banner */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-mono font-bold uppercase tracking-widest">
              <HelpCircle className="w-4 h-4 animate-bounce" />
              <span>Interactive System Operator Guide</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-main)] tracking-tight">
              How to Operate <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-cyan-400 bg-clip-text text-transparent">IRSARGO Engine</span>
            </h2>
            <p className="text-sm text-[var(--text-muted)] max-w-2xl font-sans">
              Follow this 4-step workflow to execute formal logic RAG queries, audit multi-agent swarm telemetry, and enforce air-gapped security.
            </p>
          </div>

          {/* Interactive Step Switcher Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 p-2 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-structure)] backdrop-blur-2xl shadow-xl">
            {[
              { num: '01', title: 'Execution Mode', icon: Globe, color: 'text-orange-400' },
              { num: '02', title: 'IAM Clearance', icon: Lock, color: 'text-[var(--accent-cyan)]' },
              { num: '03', title: 'Query & 3D Globe', icon: Rocket, color: 'text-amber-400' },
              { num: '04', title: 'Trace & Baseline', icon: Activity, color: 'text-purple-400' },
            ].map((step, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveGuideStep(idx)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all duration-300 cursor-pointer ${
                  activeGuideStep === idx
                    ? 'bg-gradient-to-r from-orange-500/20 to-cyan-500/20 border border-orange-500/50 text-white shadow-lg shadow-orange-500/10 scale-105'
                    : 'bg-transparent text-[var(--text-subtle)] hover:text-[var(--text-main)] hover:bg-[var(--bg-base)]/40'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  activeGuideStep === idx ? 'bg-orange-500 text-white font-extrabold' : 'bg-[var(--border-structure)] text-[var(--text-muted)]'
                }`}>
                  {step.num}
                </span>
                <step.icon className={`w-4 h-4 ${step.color}`} />
                <span>{step.title}</span>
              </button>
            ))}
          </div>

          {/* Active Step Detailed Card Display */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeGuideStep}
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="p-6 md:p-8 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-structure)] backdrop-blur-2xl shadow-2xl relative overflow-hidden grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Background Accent Glow */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full filter blur-3xl pointer-events-none" />

              {/* Left Column: Step Overview & Visual Indicator */}
              <div className="lg:col-span-2 space-y-5">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 font-mono text-[10px] font-bold text-orange-400 uppercase tracking-widest">
                    STEP {guideSteps[activeGuideStep].stepNumber} // {guideSteps[activeGuideStep].badge}
                  </span>
                </div>

                <h3 className="text-2xl font-extrabold text-[var(--text-main)] flex items-center gap-3">
                  {React.createElement(guideSteps[activeGuideStep].icon, { className: "w-7 h-7 text-orange-400" })}
                  <span>{guideSteps[activeGuideStep].title}</span>
                </h3>

                <p className="text-sm text-[var(--text-muted)] leading-relaxed font-sans font-normal">
                  {guideSteps[activeGuideStep].description}
                </p>

                {/* Key Instructions List */}
                <div className="space-y-3 pt-2">
                  {guideSteps[activeGuideStep].bulletPoints.map((point, bIdx) => (
                    <div key={bIdx} className="flex items-start gap-3 p-3 rounded-2xl bg-[var(--bg-base)]/60 border border-[var(--border-structure)]/60">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-xs text-[var(--text-main)] font-medium leading-relaxed">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Interactive Action Box & Quick Launch */}
              <div className="flex flex-col justify-between p-6 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-structure)] shadow-inner space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-[var(--text-subtle)] uppercase tracking-wider block">PRO TIP & OPERATOR NOTE</span>
                  <p className="text-xs text-[var(--text-muted)] italic leading-relaxed">
                    "{guideSteps[activeGuideStep].tip}"
                  </p>
                </div>

                <div className="pt-4 border-t border-[var(--border-structure)] space-y-3">
                  <span className="text-[10px] font-mono text-orange-400 font-bold uppercase tracking-wider block">TEST THIS STEP NOW</span>
                  <button
                    type="button"
                    onClick={() => guideSteps[activeGuideStep].action(onLaunchConsole, onAccessBaselineRag, onSignIn, onToggleAirGappedMode)}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-mono text-xs font-bold transition-all shadow-lg shadow-orange-500/20 cursor-pointer flex items-center justify-center gap-2 group"
                  >
                    <span>{guideSteps[activeGuideStep].actionLabel}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* 4-Step Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            {guideSteps.map((step, sIdx) => (
              <motion.div
                key={sIdx}
                whileHover={{ y: -4 }}
                onClick={() => setActiveGuideStep(sIdx)}
                className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer text-left ${
                  activeGuideStep === sIdx
                    ? 'bg-[var(--bg-surface)] border-orange-500/60 shadow-lg shadow-orange-500/10 ring-1 ring-orange-500/30'
                    : 'bg-[var(--bg-surface)]/60 border-[var(--border-structure)] hover:border-[var(--accent-cyan)]/40'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono font-extrabold text-orange-400">STEP {step.stepNumber}</span>
                  {React.createElement(step.icon, { className: "w-4 h-4 text-[var(--text-muted)]" })}
                </div>
                <h4 className="text-sm font-bold text-[var(--text-main)] mb-1">{step.title}</h4>
                <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed">{step.shortDesc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
};
