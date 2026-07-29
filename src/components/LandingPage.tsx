import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, Search, Cpu, ShieldCheck, Terminal, Database, Activity, 
  ArrowRight, Shield, Layers, Zap, Globe, Sparkles, Video, Play, Pause, 
  Volume2, VolumeX, CheckCircle2, ChevronRight, HelpCircle, Lock, Gauge
} from 'lucide-react';

interface LandingPageProps {
  onLaunchConsole: (initialQuery?: string) => void;
  onExploreOllama: () => void;
  onViewDatabase: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLaunchConsole,
  onExploreOllama,
  onViewDatabase
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
    <div className="relative min-h-[calc(100vh-5rem)] w-full text-white selection:bg-orange-500 selection:text-white">
      
      {/* 1. CONTINUOUS SEQUENTIAL VIDEO BACKGROUND ENGINE (FULL SCREEN) */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
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

        {/* Dark Radial Gradient Overlay for High Readability & Visual Elegance */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/40 z-20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.85)_100%)] z-20" />
        
        {/* Tech Grid Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none z-20"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.25) 1px, transparent 1px)`,
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
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-950/40 border border-orange-500/30 text-orange-300 text-xs font-mono uppercase tracking-widest mb-8 backdrop-blur-md shadow-[0_0_20px_rgba(249,115,22,0.2)]"
        >
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
          <Rocket className="w-4 h-4 text-orange-400" /> IRSARGO • ISRO Multi-Agent RAG Intelligence Platform
        </motion.div>

        {/* Hero Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight max-w-5xl leading-tight mb-6"
        >
          Autonomous Space Intelligence & <br />
          <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(249,115,22,0.4)]">
            Multi-Agent Swarm Reasoning
          </span>
        </motion.h1>

        {/* Hero Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-base sm:text-xl text-zinc-300 max-w-3xl font-light leading-relaxed mb-10 text-balance"
        >
          Air-gapped offline RAG engine powered by local <span className="text-cyan-300 font-semibold">Ollama Moondream2 VLM</span> page parsing, <span className="text-orange-300 font-semibold">ChromaDB Vector Retrieval</span>, and Keycloak Enterprise Security.
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
            className="px-7 py-4 rounded-2xl bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-800 hover:border-cyan-500/50 text-cyan-300 font-mono text-sm flex items-center gap-2.5 backdrop-blur-xl transition-all duration-300 hover:scale-105 cursor-pointer shadow-lg"
          >
            <Cpu className="w-5 h-5 text-cyan-400" />
            Inspect Ollama LLM Telemetry
          </button>

          <button
            type="button"
            onClick={onViewDatabase}
            className="px-7 py-4 rounded-2xl bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-800 hover:border-purple-500/50 text-purple-300 font-mono text-sm flex items-center gap-2.5 backdrop-blur-xl transition-all duration-300 hover:scale-105 cursor-pointer shadow-lg"
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
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-4xl p-4 rounded-3xl bg-zinc-950/70 border border-zinc-800/80 backdrop-blur-2xl shadow-2xl mb-16"
        >
          <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/50 text-left">
            <span className="text-zinc-500 font-mono text-[10px] uppercase block mb-1">RAG Precision</span>
            <span className="text-2xl font-extrabold text-orange-400 font-mono flex items-center gap-1">
              99.8% <Sparkles className="w-4 h-4 text-orange-400" />
            </span>
            <span className="text-[10px] text-zinc-400">Cryptographic Verification</span>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/50 text-left">
            <span className="text-zinc-500 font-mono text-[10px] uppercase block mb-1">Prompt Processing</span>
            <span className="text-2xl font-extrabold text-cyan-300 font-mono flex items-center gap-1">
              23.9 <span className="text-xs text-cyan-500">tok/s</span>
            </span>
            <span className="text-[10px] text-zinc-400">llama.cpp Slot Server</span>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/50 text-left">
            <span className="text-zinc-500 font-mono text-[10px] uppercase block mb-1">Agent Swarm</span>
            <span className="text-2xl font-extrabold text-amber-300 font-mono flex items-center gap-1">
              4 Agents
            </span>
            <span className="text-[10px] text-zinc-400">Synchronous Reasoning</span>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/50 text-left">
            <span className="text-zinc-500 font-mono text-[10px] uppercase block mb-1">Security Standard</span>
            <span className="text-2xl font-extrabold text-emerald-400 font-mono flex items-center gap-1">
              Air-Gapped
            </span>
            <span className="text-[10px] text-zinc-400">Keycloak IAM Guardrails</span>
          </div>
        </motion.div>

        {/* 5. SAMPLE QUERIES QUICK-LAUNCH BAR */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="w-full max-w-4xl text-left bg-zinc-950/80 border border-zinc-800 p-6 rounded-3xl backdrop-blur-2xl shadow-2xl mb-16"
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-orange-400" />
            <h3 className="text-base font-bold text-white">Instant Telemetry Quick Queries</h3>
            <span className="text-[10px] font-mono text-zinc-500 uppercase ml-auto">Click any query to execute</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sampleQueries.map((queryText, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onLaunchConsole(queryText)}
                className="group p-3.5 rounded-2xl bg-zinc-900/60 hover:bg-orange-950/30 border border-zinc-800/80 hover:border-orange-500/50 text-left transition-all duration-300 cursor-pointer flex items-start justify-between gap-3"
              >
                <span className="text-xs text-zinc-300 group-hover:text-orange-200 leading-snug">
                  "{queryText}"
                </span>
                <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-orange-400 group-hover:translate-x-1 transition-all shrink-0 mt-0.5" />
              </button>
            ))}
          </div>
        </motion.div>

        {/* 6. FEATURE SHOWCASE GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl text-left">
          {/* Feature 1 */}
          <motion.div
            whileHover={{ y: -5 }}
            className="p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800/90 backdrop-blur-xl shadow-xl hover:border-orange-500/40 transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-4">
              <Cpu className="w-6 h-6 text-orange-400" />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">4-Agent Swarm Orchestrator</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Synchronized parallel agents (Query Reformulator, Chroma Retriever, Guardrail Auditor, and Synthesizer) coordinate step-by-step reasoning for complex space missions.
            </p>
          </motion.div>

          {/* Feature 2 */}
          <motion.div
            whileHover={{ y: -5 }}
            className="p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800/90 backdrop-blur-xl shadow-xl hover:border-cyan-500/40 transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4">
              <Globe className="w-6 h-6 text-cyan-400" />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Offline Multimodal VLM Parsing</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Local Moondream2 vision-language model transcribes complex satellite layout diagrams, thermal charts, and PDF tables without relying on external internet APIs.
            </p>
          </motion.div>

          {/* Feature 3 */}
          <motion.div
            whileHover={{ y: -5 }}
            className="p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800/90 backdrop-blur-xl shadow-xl hover:border-purple-500/40 transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6 text-purple-400" />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Keycloak Enterprise Security</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Role-based access control (RBAC), OpenLDAP integration, cryptographic hash auditing, and strict anti-data exfiltration output guardrails protect classified datasets.
            </p>
          </motion.div>
        </div>

      </div>
    </div>
  );
};
