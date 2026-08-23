/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * IRSARGO Real-Time Dynamic Translation Engine
 * Uses high-speed dynamic translation (Google Translate GTX & MyMemory fallback)
 * with zero static dictionary maintenance, instant LRU memory caching, STT locale mapping,
 * and Text-to-Speech (TTS) audio synthesis.
 */

import { useState, useEffect } from 'react';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
];

const translationCache = new Map<string, string>();
const MAX_CACHE_SIZE = 1000;

function getCacheKey(text: string, targetLang: string): string {
  return `${targetLang}:${text.trim()}`;
}

function unescapeHtml(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

/**
 * Maps language code to Web Speech API locale tag (BCP-47)
 */
export function getSpeechLangCode(langCode: string): string {
  const map: Record<string, string> = {
    hi: 'hi-IN',
    bn: 'bn-IN',
    ta: 'ta-IN',
    te: 'te-IN',
    kn: 'kn-IN',
    mr: 'mr-IN',
    gu: 'gu-IN',
    en: 'en-US'
  };
  return map[langCode] || 'en-US';
}

/**
 * Text-to-Speech (TTS) Speech Synthesis helper
 */
export function speakText(text: string, langCode: string, onEnd?: () => void): boolean {
  if (!('speechSynthesis' in window)) {
    return false;
  }

  window.speechSynthesis.cancel();

  const cleanText = text
    .replace(/[#*`_~[\]()]/g, '')
    .replace(/ID:\s*[\w_-]+/gi, '')
    .trim();

  if (!cleanText) return false;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = getSpeechLangCode(langCode);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Helper to translate a small single chunk of text (up to 400 chars) via backend proxy or direct endpoints.
 */
async function translateChunk(chunk: string, targetLangCode: string): Promise<string> {
  if (!chunk || !chunk.trim()) return chunk;

  // 1. Try backend server endpoint (/api/v1/translate)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const apiUrl = window.location.origin.includes(':5173') || window.location.origin.includes(':3000') 
      ? 'http://localhost:3001/api/v1/translate' 
      : '/api/v1/translate';

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: chunk, targetLangCode }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data?.translatedText && !data.translatedText.includes('MYMEMORY WARNING')) {
        return unescapeHtml(data.translatedText);
      }
    }
  } catch (err) {}

  // 2. Try Google Translate GTX API (client-side)
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLangCode}&dt=t&q=${encodeURIComponent(chunk)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translatedStr = unescapeHtml(data[0].map((c: any) => c[0]).join(''));
        if (translatedStr && translatedStr.trim()) {
          return translatedStr;
        }
      }
    }
  } catch (err) {}

  // 3. Fallback: MyMemory API with strict quota warning filtering
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk.substring(0, 450))}&langpair=en|${targetLangCode}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const textResult = data?.responseData?.translatedText;
      if (
        textResult && 
        typeof textResult === 'string' &&
        !textResult.includes('MYMEMORY WARNING') && 
        !textResult.includes('INVALID LANGUAGE PAIR') &&
        !textResult.includes('IS AN INVALID TARGET LANGUAGE')
      ) {
        return unescapeHtml(textResult);
      }
    }
  } catch (err) {}

  return chunk;
}

/**
 * High-speed dynamic real-time translator with code block protection and paragraph chunking.
 */
export async function translateDynamicRealtime(text: string, targetLangCode: string): Promise<string> {
  if (!text || !text.trim() || targetLangCode === 'en') return text;

  const cacheKey = getCacheKey(text, targetLangCode);
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  // Preserve markdown code blocks (```...```) by replacing them with temporary tokens
  const codeBlocks: string[] = [];
  const tokenizedText = text.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match);
    return `___CODE_BLOCK_${codeBlocks.length - 1}___`;
  });

  // Split text by lines/paragraphs so chunks stay under API limits
  const lines = tokenizedText.split('\n');
  const translatedLines: string[] = [];

  for (const line of lines) {
    if (!line.trim() || line.includes('___CODE_BLOCK_')) {
      translatedLines.push(line);
      continue;
    }

    // Split long lines into ~350 char sub-chunks if necessary
    if (line.length > 400) {
      const parts = line.match(/.{1,350}(?:\s+|$)/g) || [line];
      const translatedParts = await Promise.all(parts.map(p => translateChunk(p, targetLangCode)));
      translatedLines.push(translatedParts.join(''));
    } else {
      const translatedLine = await translateChunk(line, targetLangCode);
      translatedLines.push(translatedLine);
    }
  }

  // Re-insert code blocks
  let finalResult = translatedLines.join('\n');
  codeBlocks.forEach((block, idx) => {
    finalResult = finalResult.replace(`___CODE_BLOCK_${idx}___`, block);
  });

  if (finalResult && finalResult.trim()) {
    if (translationCache.size >= MAX_CACHE_SIZE) {
      const firstKey = translationCache.keys().next().value;
      if (firstKey) translationCache.delete(firstKey);
    }
    translationCache.set(cacheKey, finalResult);
    return finalResult;
  }

  return text;
}

/**
 * Synchronous cache lookup helper.
 */
export function getCachedOrOriginal(text: string, targetLangCode: string): string {
  if (!text || targetLangCode === 'en') return text;
  const cacheKey = getCacheKey(text, targetLangCode);
  return translationCache.get(cacheKey) || text;
}

/**
 * Custom React Hook: Translates any string dynamically in real-time when target language changes.
 */
export function useTranslatedText(text: string, targetLangCode: string): string {
  const [translated, setTranslated] = useState<string>(() => getCachedOrOriginal(text, targetLangCode));

  useEffect(() => {
    let isMounted = true;

    if (!text || targetLangCode === 'en') {
      setTranslated(text);
      return;
    }

    const cached = getCachedOrOriginal(text, targetLangCode);
    if (cached !== text) {
      setTranslated(cached);
    } else {
      setTranslated(text);
    }

    translateDynamicRealtime(text, targetLangCode).then((result) => {
      if (isMounted && result) {
        setTranslated(result);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [text, targetLangCode]);

  return translated;
}

