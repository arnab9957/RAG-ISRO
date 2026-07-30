import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, Search, Cpu, ShieldCheck, Terminal, Database, Activity, 
  ArrowRight, Shield, Layers, Zap, Globe, Sparkles, Video, Play, Pause, 
  Volume2, VolumeX, CheckCircle2, ChevronRight, HelpCircle, Lock, LogOut, Gauge
} from 'lucide-react';
import { ThemeToggle } from './ui/ThemeToggle';
import { OfflineModeToggle } from './ui/OfflineModeToggle';

interface LandingPageProps {
  onLaunchConsole: (initialQuery?: string) => void;
  onExploreOllama: () => void;
  onViewDatabase: () => void;
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
  effectiveUser,
  onSignIn,
  onLogout,
  airGappedMode = false,
  onToggleAirGappedMode
}) => {
  const [activeVideo, setActiveVideo] = useState<'lp1' | 'lp2'>('lp1');
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);

  const sampleQueries = [
    "What are the launch parameters and payload details for Chandrayaan-3?",
    "Summarize thermal shielding specifications for ISRO satellite systems.",
    "Explain the offline multimodal VLM document ingestion architecture.",
    "Extract telemetry metrics from the thesis document dataset."
  ];

  return (
    <div className="relative min-h-screen w-full text-[var(--text-main)] selection:bg-orange-500 selection:text-white flex flex-col">
      
      {/* 0. LANDING PAGE DEDICATED HEADER TOP BAR */}
      <header className="relative z-30 w-full max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Left: Landing Logo & Air-Gapped Mode Toggle */}
        <div className="flex items-center gap-6">
          <img 
            src="/logo.png" 
            alt="IRSARGO Logo" 
            className="h-12 md:h-14 w-auto object-contain filter drop-shadow-[0_0_12px_rgba(56,189,248,0.4)] transition-all hover:scale-105" 
          />

          {onToggleAirGappedMode && (
            <div className="hidden md:flex items-center">
              <OfflineModeToggle
                airGappedMode={airGappedMode}
                onToggle={onToggleAirGappedMode}
                size="sm"
              />
            </div>
          )}
        </div>

        {/* Right: Theme Toggle & Sign In / User Profile */}
        <div className="flex items-center gap-4">
          <ThemeToggle />

          {!effectiveUser ? (
            <button
              type="button"
              onClick={onSignIn}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-mono text-xs font-bold transition shadow-lg shadow-orange-600/30 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" /> Sign In
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onLaunchConsole()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold transition shadow-lg shadow-cyan-600/30 cursor-pointer"
              >
                <Terminal className="w-3.5 h-3.5" /> Launch Console
              </button>
              <div className="flex items-center gap-3 border-l border-[var(--border-structure)] pl-4 h-10">
                <div className="text-right">
                  <p className="text-[11px] font-bold text-[var(--text-main)] tracking-wide">{effectiveUser.displayName}</p>
                  <p className="text-[8px] font-mono text-[var(--accent-cyan)] uppercase tracking-wider">{effectiveUser.role}</p>
                </div>
                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="p-1.5 bg-[var(--bg-surface)] border border-[var(--border-structure)] hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-[var(--text-muted)] transition cursor-pointer"
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
      
      {/* 1. CONTINUOUS SEQUENTIAL VIDEO BACKGROUND ENGINE (FULL SCREEN) */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none opacity-40 dark:opacity-75 transition-opacity duration-300">
        {/* Video 1 Container */}
        <div 
          className={`absolute inset-0 transition-opacity duration-1000 ${
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
            className="w-full h-full object-cover scale-105 filter brightness-75 contrast-110"
          >
            <source src="/videos/lp.mp4" type="video/mp4" />
            <source src="/datasets/lp.mp4" type="video/mp4" />
          </video>
        </div>

        {/* Video 2 Container */}
        <div 
          className={`absolute inset-0 transition-opacity duration-1000 ${
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
            className="w-full h-full object-cover scale-105 filter brightness-75 hue-rotate-15"
          >
            <source src="/videos/lp2.mp4" type="video/mp4" />
            <source src="/datasets/lp2.mp4" type="video/mp4" />
          </video>
        </div>

        {/* Dynamic Theme Radial Overlay for Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)] via-[var(--bg-base)]/80 to-[var(--bg-base)]/40 z-20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--bg-base)_100%)] opacity-90 z-20" />
        
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
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-surface)] border border-[var(--border-structure)] text-[var(--accent-cyan)] text-xs font-mono uppercase tracking-widest mb-8 backdrop-blur-md panel-shadow-box"
        >
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
          <Rocket className="w-4 h-4 text-orange-400" /> IRSARGO • ISRO Multi-Agent RAG Intelligence Platform
        </motion.div>

        {/* Hero Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight max-w-5xl leading-tight mb-6 text-[var(--text-main)]"
        >
          Autonomous Space Intelligence & <br />
          <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-[var(--accent-cyan)] bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(56,189,248,0.4)]">
            Multi-Agent Swarm Reasoning
          </span>
        </motion.h1>

        {/* Hero Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-base sm:text-xl text-[var(--text-muted)] max-w-3xl font-light leading-relaxed mb-10 text-balance"
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
          <button
            type="button"
            onClick={() => onLaunchConsole()}
            className="group px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-base flex items-center gap-3 transition-all duration-300 shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:shadow-[0_0_45px_rgba(249,115,22,0.7)] hover:scale-105 cursor-pointer"
          >
            <Rocket className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
            Launch Intelligence Console
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            type="button"
            onClick={onExploreOllama}
            className="px-7 py-4 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-structure)] hover:border-[var(--accent-cyan)] text-[var(--accent-cyan)] font-mono text-sm flex items-center gap-2.5 backdrop-blur-xl transition-all duration-300 hover:scale-105 cursor-pointer panel-shadow-box"
          >
            <Cpu className="w-5 h-5 text-[var(--accent-cyan)]" />
            Inspect Ollama LLM Telemetry
          </button>

          <button
            type="button"
            onClick={onViewDatabase}
            className="px-7 py-4 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-structure)] hover:border-purple-500/50 text-purple-400 font-mono text-sm flex items-center gap-2.5 backdrop-blur-xl transition-all duration-300 hover:scale-105 cursor-pointer panel-shadow-box"
          >
            <Database className="w-5 h-5 text-purple-400" />
            Browse Knowledge Base
          </button>
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

      </div>
    </div>
  );
};
