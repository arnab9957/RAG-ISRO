/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SecurityTrace } from '../types';

/**
 * Simulates the CAPRISE (Conditional Approximate Distance-Comparison-Preserving Symmetric Encryption)
 * and ZKP (Zero-Knowledge Proof) verification.
 */
export function verifyZKP(nodeId: string): 'verified' | 'failed' {
  // In a real system, this would execute cryptographic proofs.
  // We simulate success based on node existence.
  return nodeId ? 'verified' : 'failed';
}

/**
 * Extracts key technical terms/keywords from text to represent domain constraints.
 */
export function extractKeyTerms(text: string): string[] {
  if (!text) return [];
  const words = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .split(/\s+/);

  const stopWords = new Set([
    'the', 'and', 'a', 'of', 'to', 'in', 'is', 'that', 'it', 'for', 'on', 'with',
    'as', 'this', 'by', 'an', 'be', 'are', 'from', 'at', 'or', 'your', 'will',
    'have', 'has', 'had', 'been', 'were', 'was', 'should', 'would', 'could',
    'which', 'from', 'this', 'that', 'these', 'those', 'their', 'there', 'about',
    'more', 'some', 'any', 'other', 'into', 'only', 'than', 'then', 'also', 'consists'
  ]);

  // Keep unique words longer than 4 characters that are not stop words
  const terms = Array.from(new Set(words))
    .filter(word => word.length >= 5 && !stopWords.has(word));

  return terms.slice(0, 8); // Return up to 8 key terms
}

/**
 * Simulates SMT-based (Satisfiability Modulo Theories) formal verification.
 * Checks if the answer satisfies domain constraints by verifying if a reasonable
 * threshold of extracted key concepts are mentioned.
 */
export function formalVerification(answer: string, constraints: string[]): boolean {
  if (constraints.length === 0) return true;
  const lowerAnswer = answer.toLowerCase();

  let matches = 0;
  for (const constraint of constraints) {
    if (lowerAnswer.includes(constraint.toLowerCase())) {
      matches++;
    }
  }

  // Pass if we match at least 40% of the key constraints (or at least 1 if constraints count is small)
  const requiredMatches = Math.max(1, Math.ceil(constraints.length * 0.4));
  return matches >= requiredMatches;
}

/**
 * Generates a mock C2PA provenance hash.
 */
export function generateC2PAHash(content: string): string {
  // Simple hash simulation
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `sha256:isro_provenance_${Math.abs(hash).toString(16)}`;
}

/**
 * Simulates a ZK-STARK proof generation for query integrity using RISC Zero zkVM pattern.
 */
export function generateQueryProof(query: string): string {
  const timestamp = Date.now();
  const queryDigest = query.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
  return `zkstark_${timestamp}_${Math.abs(queryDigest).toString(16)}_risc0_v2`;
}

export function calculateConfidence(traces: SecurityTrace[], answer: string, queryText: string = ''): { metrics: any, sources: string[] } {
  const totalTraces = traces.length || 1;
  const verifiedTracesCount = traces.filter(t => t.zkpStatus === 'verified' && t.smtApproval).length;
  const avgRelevance = traces.reduce((acc, t) => acc + t.relevanceScore, 0) / totalTraces;

  // 1. Context Relevance: Average similarity score of retrieved nodes
  const contextRelevance = avgRelevance;

  // 2. Groundedness: Ratio of traces that passed formal SMT constraints
  const groundedness = verifiedTracesCount / totalTraces;

  // 3. Answer Relevance: overlap between answer and original query key terms
  const queryTerms = queryText ? extractKeyTerms(queryText) : [];
  let matchedQueryTerms = 0;
  if (queryTerms.length > 0) {
    const lowerAnswer = answer.toLowerCase();
    for (const term of queryTerms) {
      if (lowerAnswer.includes(term.toLowerCase())) {
        matchedQueryTerms++;
      }
    }
  }
  const answerRelevance = queryTerms.length > 0 ? (matchedQueryTerms / queryTerms.length) : 0.85;

  // Calculate overall confidence based on RAG Triad average
  const overallConfidence = (contextRelevance + groundedness + answerRelevance) / 3;
  const hallucinationRisk = 1.0 - groundedness;

  return {
    metrics: {
      retrievalAccuracy: Math.min(contextRelevance, 1.0),
      groundingFidelity: Math.min(groundedness, 1.0),
      hallucinationRisk: Math.max(hallucinationRisk, 0.0),
      overallConfidence: Math.min(overallConfidence, 1.0)
    },
    sources: traces.map(t => t.nodeId)
  };
}

export function createTrace(nodeId: string, content: string, constraints: string[]): SecurityTrace {
  const relevanceScore = 0.85 + (Math.random() * 0.15); // Simulated relevance re-ranking score
  return {
    nodeId,
    zkpStatus: verifyZKP(nodeId),
    provenanceHash: generateC2PAHash(content),
    smtApproval: formalVerification(content, constraints),
    timestamp: new Date().toISOString(),
    relevanceScore
  };
}

/**
 * Simple rule-based/heuristic generator when LLM backend/API is unavailable.
 */
export function mockGenerate(contents: string): string {
  const lower = contents.toLowerCase();

  // 1. Paraphrase Prompt
  if (lower.includes("paraphrased query:") || lower.includes("paraphrase")) {
    const userQueryMatch = contents.match(/User Query:\s*(.*)/i);
    if (userQueryMatch) {
      return userQueryMatch[1].trim();
    }
    return "CCSDS telemetry frame structure";
  }

  // 2. Critic/Audit Prompt
  if (lower.includes("IRSARGO critic") || lower.includes("hallucination")) {
    return "CRITIQUE: Checked draft answer against retrieved context. The response is strictly grounded in the source documentation. No security violations or hallucinations detected.";
  }

  // 3. Grounded Generation
  if (contents.includes("<grounding_context>")) {
    const chunks: string[] = [];
    const rx = /<context_chunk[^>]*>([\s\S]*?)<\/context_chunk>/g;
    let match;
    while ((match = rx.exec(contents)) !== null) {
      chunks.push(match[1].trim());
    }

    if (chunks.length > 0 && !contents.includes("No matching pages found.")) {
      let answer = "According to the retrieved technical documentation:\n\n";
      chunks.forEach((chunk) => {
        const cleanChunk = chunk.split('\n').map(line => line.trim()).filter(Boolean).join(' ');
        answer += `• ${cleanChunk}\n\n`;
      });
      return answer.trim();
    } else {
      return "I apologize, but no relevant grounding pages or documents were found in the secure database to answer your request.";
    }
  }

  return "Response generated successfully under local air-gapped simulation constraints.";
}

