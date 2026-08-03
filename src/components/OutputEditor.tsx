/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Crepe } from "@milkdown/crepe";
import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame-dark.css";

interface Props {
  content: string;
}

export default function OutputEditor({ content }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;
    let crepeInstance: Crepe | null = null;
    let editorDiv: HTMLDivElement | null = null;

    const initEditor = async () => {
      if (!containerRef.current || !content) return;

      try {
        // Create a dedicated child container for Milkdown
        editorDiv = document.createElement("div");
        editorDiv.className = "milkdown markdown-content text-zinc-300 font-sans w-full";
        containerRef.current.appendChild(editorDiv);

        const crepe = new Crepe({
          root: editorDiv,
          defaultValue: content,
        });

        await crepe.create();

        if (!active) {
          try {
            await crepe.destroy();
          } catch (e) {
            // Ignore unmount destroy warnings
          }
          if (editorDiv && containerRef.current?.contains(editorDiv)) {
            containerRef.current.removeChild(editorDiv);
          }
          return;
        }

        crepeInstance = crepe;
      } catch (err) {
        console.warn("Milkdown Crepe editor fallback active:", err);
        if (active) {
          setHasError(true);
        }
      }
    };

    initEditor();

    return () => {
      active = false;
      if (crepeInstance) {
        try {
          crepeInstance.destroy().catch(() => {});
        } catch (e) {
          // Ignore destruction race conditions
        }
      }
      if (editorDiv && containerRef.current?.contains(editorDiv)) {
        try {
          containerRef.current.removeChild(editorDiv);
        } catch (e) {}
      }
    };
  }, [content]);

  if (hasError) {
    return (
      <div className="relative border border-zinc-800 bg-zinc-950/40 rounded-xl p-6 min-h-[200px] max-h-[550px] overflow-y-auto isro-glass">
        <div className="prose prose-invert max-w-none text-zinc-300 font-sans text-sm leading-relaxed">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    );
  }

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
