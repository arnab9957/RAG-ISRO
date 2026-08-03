import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface IngestionLoaderProps {
  /** Optional custom progress percentage (0 - 100) */
  progress?: number;
  /** Optional current status text (e.g. "uploading", "processing", "finalizing") */
  statusText?: string;
  /** Custom status steps list */
  steps?: string[];
  /** Flag indicating if ingestion process is active */
  isIngesting?: boolean;
}

export const IngestionLoader: React.FC<IngestionLoaderProps> = ({
  progress: externalProgress,
  statusText: externalStatusText,
  steps = ["uploading", "processing", "finalizing"],
  isIngesting = true,
}) => {
  const [currentProgress, setCurrentProgress] = useState(externalProgress ?? 5);

  useEffect(() => {
    if (externalProgress !== undefined) {
      setCurrentProgress(externalProgress);
      return;
    }

    if (!isIngesting) {
      setCurrentProgress(100);
      return;
    }

    // Reset progress when ingestion starts
    setCurrentProgress(5);

    // Continuous asymptotic slow crawl towards 95% while isIngesting is true
    const interval = setInterval(() => {
      setCurrentProgress((prev) => {
        if (prev >= 95) return 95; // Hold at 95% until backend completes
        const remaining = 95 - prev;
        const increment = Math.max(0.12, remaining * 0.03);
        return parseFloat((prev + increment).toFixed(2));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [externalProgress, isIngesting]);

  // Determine status text dynamically based on currentProgress
  let currentStatus = externalStatusText;
  if (!currentStatus) {
    if (currentProgress < 30) {
      currentStatus = steps[0] || "uploading";
    } else if (currentProgress < 82) {
      currentStatus = steps[1] || "processing";
    } else if (currentProgress < 100) {
      currentStatus = steps[2] || "finalizing";
    } else {
      currentStatus = "complete";
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center justify-center p-8 space-y-6 select-none font-sans bg-black/40 rounded-2xl border border-zinc-800/80 backdrop-blur-md">
      {/* Dynamic Status Text with Blur-Fade Transition (matching loding.mp4) */}
      <div className="h-8 flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.span
            key={currentStatus}
            initial={{ opacity: 0, filter: "blur(10px)", scale: 0.95 }}
            animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
            exit={{ opacity: 0, filter: "blur(10px)", scale: 1.05 }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
            className="text-xl sm:text-2xl text-neutral-300 font-medium tracking-wide font-sans"
          >
            {currentStatus}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Glowing Neon Blue Pill Progress Bar */}
      <div className="w-full px-2">
        <div className="w-full h-3.5 bg-zinc-900/90 border border-zinc-800/90 rounded-full p-0.5 relative overflow-hidden shadow-inner">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-sky-500 via-blue-500 to-cyan-400 relative shadow-[0_0_18px_rgba(56,189,248,0.7)]"
            initial={{ width: "3%" }}
            animate={{ width: `${Math.min(100, Math.max(3, currentProgress))}%` }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* Bright Cyan-White Glowing Leading Cap */}
            <div className="absolute right-0 top-0 bottom-0 w-3 bg-white rounded-full shadow-[0_0_12px_#ffffff,0_0_16px_#38bdf8] opacity-90" />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default IngestionLoader;
