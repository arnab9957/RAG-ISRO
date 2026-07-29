import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, CloudOff, Cloud, CloudUpload, ShieldCheck, RefreshCw, Globe, Database } from 'lucide-react';

interface OfflineModeToggleProps {
  airGappedMode: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md' | 'lg';
  showStatusBadges?: boolean;
  className?: string;
}

export const OfflineModeToggle: React.FC<OfflineModeToggleProps> = ({
  airGappedMode,
  onToggle,
  size = 'md',
  showStatusBadges = false,
  className = '',
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Responsive scale parameters based on size prop
  const isSm = size === 'sm';
  const trackHeight = isSm ? 'h-9' : 'h-13';
  const trackWidth = isSm ? 'w-48 md:w-52' : 'w-64 md:w-72';
  const knobSize = isSm ? 'w-7 h-7' : 'w-11 h-11';
  const knobOffsetRight = isSm ? 'calc(100% - 32px)' : 'calc(100% - 48px)';
  const knobOffsetLeft = isSm ? '4px' : '4px';

  return (
    <div className={`relative inline-flex flex-col items-center select-none ${className}`}>
      {/* Tooltip Popup on Hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full mb-3 z-50 pointer-events-none w-64 p-3 rounded-xl backdrop-blur-xl border bg-black/90 text-xs font-mono shadow-2xl"
            style={{
              borderColor: airGappedMode ? '#38bdf8' : '#64748b',
              boxShadow: airGappedMode
                ? '0 0 25px rgba(56, 189, 248, 0.3)'
                : '0 0 25px rgba(100, 116, 139, 0.2)',
            }}
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800">
              <div className="flex items-center gap-1.5 font-bold">
                {airGappedMode ? (
                  <>
                    <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    <span className="text-cyan-300">OFFLINE MODE: ON</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-3.5 h-3.5 text-slate-300" />
                    <span className="text-slate-200">CLOUD MODE: ON</span>
                  </>
                )}
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-bold uppercase">
                {airGappedMode ? 'Air-Gapped' : 'Online'}
              </span>
            </div>

            {airGappedMode ? (
              <ul className="space-y-1 text-[10px] text-cyan-200/90">
                <li className="flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span>Works without internet</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Database className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span>Local data active (100% Private)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span>Fast & Secure zero-leak protection</span>
                </li>
              </ul>
            ) : (
              <ul className="space-y-1 text-[10px] text-slate-300">
                <li className="flex items-center gap-1.5">
                  <Cloud className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>Connect to Groq / Gemini cloud</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>Sync data in real-time</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Globe className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>Access anywhere globally</span>
                </li>
              </ul>
            )}

            <div className="mt-2.5 pt-1.5 border-t border-zinc-800/80 text-[8px] text-zinc-500 italic text-center">
              Click or slide the toggle to switch operating security modes
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Outer Glow & Particle Container */}
      <div
        className="relative group cursor-pointer"
        onClick={onToggle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="button"
        tabIndex={0}
        aria-label={airGappedMode ? 'Switch to Cloud Mode' : 'Switch to Offline Mode'}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        {/* Thunder Aura & Lightning Glow (OFFLINE MODE) */}
        {airGappedMode && (
          <>
            <motion.div
              animate={{
                opacity: [0.6, 0.9, 0.6],
                scale: [0.98, 1.03, 0.98],
              }}
              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
              className="absolute -inset-2 rounded-full blur-md bg-linear-to-r from-cyan-500/40 via-blue-600/50 to-indigo-500/40 pointer-events-none"
            />
            
            {/* Animated SVG Electric Bolts background overflow */}
            <svg
              className="absolute -inset-4 w-[calc(100%+32px)] h-[calc(100%+32px)] pointer-events-none z-0 overflow-visible"
              viewBox="0 0 300 80"
              fill="none"
            >
              {/* Top Electric Arc */}
              <motion.path
                d="M 20,40 Q 80,5 150,5 T 280,40"
                stroke="#00f0ff"
                strokeWidth="1.5"
                strokeDasharray="8 12"
                animate={{ strokeDashoffset: [0, -40] }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                style={{ filter: 'drop-shadow(0 0 6px #00f0ff)' }}
              />
              {/* Bottom Electric Arc */}
              <motion.path
                d="M 20,40 Q 80,75 150,75 T 280,40"
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="6 10"
                animate={{ strokeDashoffset: [0, 32] }}
                transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                style={{ filter: 'drop-shadow(0 0 6px #38bdf8)' }}
              />
            </svg>
          </>
        )}

        {/* Smoke / Dissolve Particle Aura (CLOUD MODE) */}
        {!airGappedMode && (
          <motion.div
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="absolute -inset-1 rounded-full blur-sm bg-linear-to-r from-slate-200/30 via-slate-400/20 to-zinc-400/30 pointer-events-none"
          />
        )}

        {/* Main Track Pill Capsule */}
        <div
          className={`relative z-10 ${trackHeight} ${trackWidth} rounded-full p-1 transition-all duration-500 flex items-center justify-between border shadow-2xl overflow-hidden ${
            airGappedMode
              ? 'bg-linear-to-r from-blue-950 via-cyan-950 to-indigo-950 border-cyan-400/80 shadow-[0_0_30px_rgba(6,182,212,0.4)]'
              : 'bg-linear-to-r from-slate-100 via-slate-200 to-slate-300 border-slate-300/90 shadow-[0_10px_25px_rgba(0,0,0,0.25)]'
          }`}
        >
          {/* Internal Track Lighting Grid Effect */}
          {airGappedMode ? (
            <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] opacity-20 [background-size:8px_8px] pointer-events-none" />
          ) : (
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff15_1px,transparent_1px)] opacity-40 [background-size:6px_6px] pointer-events-none" />
          )}

          {/* Left Text / Icon Label (OFFLINE MODE) */}
          <div
            className={`flex items-center gap-1.5 pl-2.5 z-10 transition-all duration-300 ${
              airGappedMode ? 'opacity-100 scale-100' : 'opacity-40 scale-95'
            }`}
          >
            <CloudOff className={`${isSm ? 'w-3.5 h-3.5' : 'w-5 h-5'} ${airGappedMode ? 'text-cyan-300 animate-pulse' : 'text-slate-600'}`} />
            <span
              className={`font-sans font-black uppercase tracking-wider ${
                isSm ? 'text-[9px]' : 'text-xs'
              } ${
                airGappedMode
                  ? 'text-cyan-100 drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]'
                  : 'text-slate-600 font-bold'
              }`}
            >
              OFFLINE MODE
            </span>
          </div>

          {/* Right Text / Icon Label (CLOUD MODE) */}
          <div
            className={`flex items-center gap-1.5 pr-2.5 z-10 transition-all duration-300 ${
              !airGappedMode ? 'opacity-100 scale-100' : 'opacity-40 scale-95'
            }`}
          >
            <span
              className={`font-sans font-black uppercase tracking-wider ${
                isSm ? 'text-[9px]' : 'text-xs'
              } ${
                !airGappedMode
                  ? 'text-slate-800 drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]'
                  : 'text-cyan-400/60 font-bold'
              }`}
            >
              CLOUD MODE
            </span>
            <Cloud className={`${isSm ? 'w-3.5 h-3.5' : 'w-5 h-5'} ${!airGappedMode ? 'text-slate-800' : 'text-cyan-400/60'}`} />
          </div>

          {/* Sliding Circular Thumb Knob (The Orb) */}
          <motion.div
            layout
            transition={{
              type: 'spring',
              stiffness: 500,
              damping: 30,
            }}
            style={{
              position: 'absolute',
              left: airGappedMode ? knobOffsetRight : knobOffsetLeft,
            }}
            className={`z-20 ${knobSize} rounded-full flex items-center justify-center transition-all duration-300 ${
              airGappedMode
                ? 'bg-linear-to-br from-cyan-300 via-blue-500 to-indigo-600 text-white shadow-[0_0_20px_rgba(56,189,248,0.9)] border-2 border-white ring-2 ring-cyan-400/60'
                : 'bg-linear-to-br from-white via-slate-100 to-slate-300 text-slate-700 shadow-[0_4px_12px_rgba(0,0,0,0.3)] border-2 border-slate-200 ring-1 ring-slate-400/30'
            }`}
          >
            {/* Animated Inner Icon */}
            <AnimatePresence mode="wait">
              {airGappedMode ? (
                <motion.div
                  key="lightning-icon"
                  initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
                  animate={{ rotate: 0, scale: 1, opacity: 1 }}
                  exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center"
                >
                  <Zap
                    className={`${isSm ? 'w-3.5 h-3.5' : 'w-6 h-6'} text-white fill-cyan-100 drop-shadow-[0_0_8px_rgba(255,255,255,0.9)] animate-pulse`}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="cloud-icon"
                  initial={{ rotate: 90, scale: 0.5, opacity: 0 }}
                  animate={{ rotate: 0, scale: 1, opacity: 1 }}
                  exit={{ rotate: -90, scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center"
                >
                  <CloudUpload className={`${isSm ? 'w-3.5 h-3.5' : 'w-6 h-6'} text-slate-700`} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Optional Status Badges beneath the button (as seen on left side of image) */}
      {showStatusBadges && (
        <div className="mt-4 grid grid-cols-3 gap-2 w-full max-w-xs text-[9px] font-mono">
          {airGappedMode ? (
            <>
              <div className="flex items-center gap-1 p-1.5 rounded-lg bg-cyan-950/40 border border-cyan-800/60 text-cyan-300">
                <Zap className="w-3 h-3 text-cyan-400 shrink-0" />
                <span className="truncate">No Internet</span>
              </div>
              <div className="flex items-center gap-1 p-1.5 rounded-lg bg-cyan-950/40 border border-cyan-800/60 text-cyan-300">
                <Database className="w-3 h-3 text-cyan-400 shrink-0" />
                <span className="truncate">Local Data</span>
              </div>
              <div className="flex items-center gap-1 p-1.5 rounded-lg bg-cyan-950/40 border border-cyan-800/60 text-cyan-300">
                <ShieldCheck className="w-3 h-3 text-cyan-400 shrink-0" />
                <span className="truncate">Fast & Secure</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1 p-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-400">
                <Cloud className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">Cloud Active</span>
              </div>
              <div className="flex items-center gap-1 p-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-400">
                <RefreshCw className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">Real-time Sync</span>
              </div>
              <div className="flex items-center gap-1 p-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-400">
                <Globe className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">Global Access</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
