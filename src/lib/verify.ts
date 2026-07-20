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

  // Pass if we match at least 25% of the key constraints (or at least 1 if constraints count is small)
  const requiredMatches = Math.max(1, Math.ceil(constraints.length * 0.25));
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
  // Generate a deterministic relevance score based on nodeId hash (between 0.85 and 0.99)
  let hash = 0;
  for (let i = 0; i < nodeId.length; i++) {
    hash = (hash << 5) - hash + nodeId.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  const normHash = Math.abs(hash) % 100;
  const relevanceScore = 0.85 + (normHash / 100) * 0.14;

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
      // Clean up chunks
      const cleanChunks = chunks.map(chunk => 
        chunk.split('\n').map(line => line.trim()).filter(Boolean).join(' ')
      );

      // Extract query to customize mock synthesis
      const queryMatch = contents.match(/User Query:\s*(.*)/i);
      const query = queryMatch ? queryMatch[1].trim() : '';
      const queryLower = query.toLowerCase();

      let answer = '';

      if (queryLower.includes('asset') || queryLower.includes('gfr') || queryLower.includes('record') || queryLower.includes('rule')) {
        answer = `Based on the General Financial Rules (GFR) retrieved from the technical database, here is the synthesis of rules regarding asset management and stock accounts:\n\n`;
        
        // Find and structure specific rules if present
        const hasGfr22 = cleanChunks.some(c => c.includes('GFR-22'));
        const hasGfr23 = cleanChunks.some(c => c.includes('GFR-23'));
        const hasRule212 = cleanChunks.some(c => c.includes('Rule 212'));

        if (hasGfr22 || hasGfr23) {
          answer += `1. **Stock Accounts & Forms Requirements:**\n`;
          answer += `   - **Fixed Assets:** Must be maintained in Form GFR-22 (covering plant, machinery, equipment, furniture, fixtures, etc.).\n`;
          answer += `   - **Consumables:** Must be maintained in Form GFR-23 (covering stationery, chemicals, spare parts, etc.).\n`;
          answer += `   - **Library Books:** Maintained in Form GFR-18.\n`;
          answer += `   - **Assets of Historical/Artistic Value:** Maintained in Form GFR-24.\n\n`;
        }

        if (hasRule212) {
          answer += `2. **Rule 212 (Hiring out of Fixed Assets):**\n`;
          answer += `   - When a fixed asset is hired out to local bodies, contractors, or others, a proper record of the assets and the hire charges must be kept.\n`;
          answer += `   - The hire and other charges, as prescribed by the competent authority, must be recovered regularly.\n\n`;
        }

        // Fallback or additional info
        const otherInfo = cleanChunks.filter(c => !c.includes('GFR-22') && !c.includes('Rule 212'));
        if (otherInfo.length > 0) {
          answer += `3. **Additional Operational Guidelines:**\n`;
          otherInfo.forEach(info => {
            const shortInfo = info.substring(0, 150) + (info.length > 150 ? '...' : '');
            answer += `   - ${shortInfo}\n`;
          });
        }
      } else {
        // Generic synthesized summary
        answer = `Based on the retrieved operational and technical documentation, here is a synthesized summary:\n\n`;
        cleanChunks.forEach((chunk, index) => {
          // Try to split into sentences and take the first two sentences for a clean summary
          const sentences = chunk.match(/[^.!?]+[.!?]+(\s|$)/g) || [chunk];
          const summarySentences = sentences.slice(0, 2).map(s => s.trim()).join(' ');
          answer += `- **Document Source [Node #${index + 1}]:** ${summarySentences}\n\n`;
        });
      }

      return answer.trim();
    } else {
      return "I apologize, but no relevant grounding pages or documents were found in the secure database to answer your request.";
    }
  }

  return "Response generated successfully under local air-gapped simulation constraints.";
}

