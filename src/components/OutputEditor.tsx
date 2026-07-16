/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from "react";
import { Crepe } from "@milkdown/crepe";
import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame-dark.css";

interface Props {
  content: string;
}

export default function OutputEditor({ content }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let active = true;
    let crepeInstance: Crepe | null = null;
    let editorDiv: HTMLDivElement | null = null;

    const initEditor = async () => {
      if (!containerRef.current) return;

      // Create a unique child div for this specific Crepe instance
      editorDiv = document.createElement("div");
      editorDiv.className = "milkdown markdown-content text-zinc-300 font-sans w-full";
      containerRef.current.appendChild(editorDiv);

      console.log("IMPORTED Crepe is:", Crepe);
      const crepe = new Crepe({
        root: editorDiv,
        defaultValue: content,
      });

      try {
        await crepe.create();
        
        if (!active) {
          // If the effect was cleaned up while initializing, destroy it immediately
          await crepe.destroy();
          if (editorDiv && containerRef.current?.contains(editorDiv)) {
            containerRef.current.removeChild(editorDiv);
          }
          return;
        }
        
        crepeInstance = crepe;
      } catch (err) {
        console.error("Failed to initialize Milkdown Crepe editor:", err);
      }
    };

    initEditor();

    return () => {
      active = false;
      if (crepeInstance) {
        crepeInstance.destroy().catch((err) => {
          console.warn("Cleaned up Milkdown Crepe editor during unmount:", err);
        });
      }
      if (editorDiv && containerRef.current?.contains(editorDiv)) {
        containerRef.current.removeChild(editorDiv);
      }
    };
  }, []);

  return (
    <div className="relative border border-zinc-800 bg-zinc-950/40 rounded-xl p-6 min-h-[250px] max-h-[550px] overflow-y-auto isro-glass">
      <div className="absolute top-3 right-4 flex items-center gap-1.5 text-[8px] font-mono text-zinc-500 uppercase tracking-widest pointer-events-none z-10">
        <span className="w-1.5 h-1.5 rounded-full bg-isro-orange animate-pulse" />
        Interactive Synthesis Editor
      </div>
      <div ref={containerRef} className="milkdown markdown-content text-zinc-300 font-sans" />
    </div>
  );
}
