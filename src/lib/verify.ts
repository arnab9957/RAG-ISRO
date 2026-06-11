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

export function calculateConfidence(traces: SecurityTrace[], answer: string): { metrics: any, sources: string[] } {
  const verifiedTracesCount = traces.filter(t => t.zkpStatus === 'verified' && t.smtApproval).length;
  const avgRelevance = traces.reduce((acc, t) => acc + t.relevanceScore, 0) / (traces.length || 1);
  
  // Simulated grounding metrics
  const retrievalAccuracy = avgRelevance * 0.95;
  const groundingFidelity = (verifiedTracesCount / (traces.length || 1)) * 0.98;
  const hallucinationRisk = 1.0 - (groundingFidelity * 0.9);
  
  return {
    metrics: {
      retrievalAccuracy: Math.min(retrievalAccuracy, 1.0),
      groundingFidelity: Math.min(groundingFidelity, 1.0),
      hallucinationRisk: Math.max(hallucinationRisk, 0.0),
      overallConfidence: (retrievalAccuracy + groundingFidelity) / 2
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
