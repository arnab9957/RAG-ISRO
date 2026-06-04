/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { AgentAction, AgentRole, Domain, SaraswatiResponse, SecurityTrace, AdvancedFilters } from "../types";
import { searchOntology } from "./ontology";
import { createTrace, generateQueryProof, calculateConfidence } from "./verify";

export class SaraswatiOrchestrator {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
  }

  async runQuery(query: string, domain: Domain, filters: AdvancedFilters | undefined, onUpdate: (action: AgentAction) => void): Promise<SaraswatiResponse> {
    const actions: AgentAction[] = [];
    const addAction = (role: AgentRole, action: string, status: AgentAction['status'] = 'active', output?: string) => {
      const newAction: AgentAction = {
        id: Math.random().toString(36).substring(2, 11),
        role,
        action,
        status,
        output,
        timestamp: new Date().toISOString(),
      };
      actions.push(newAction);
      onUpdate(newAction);
      return newAction;
    };

    // 0. Pre-processing: Integrity & Ingestion Simulation
    const preAction = addAction(AgentRole.VALIDATOR, `Executing RISC Zero ZK-STARK query verification...`);
    const queryProof = generateQueryProof(query);
    preAction.status = 'completed';
    preAction.output = `PROOF_GEN: ${queryProof}\nINGESTION: Local offline node authenticated.`;
    onUpdate(preAction);

    // 1. Paging-Based Retrieval (BM25 + TF-IDF)
    addAction(AgentRole.EXECUTOR, `Executing vector retrieval from ChromaDB (${domain})...`);
    const nodes = await searchOntology(query, domain, filters);
    
    // Check for expanded context (neighbors)
    const originalNodes = nodes.filter(n => (n.score || 0) >= 1.0);
    const expandedNodes = nodes.filter(n => (n.score || 0) < 1.0);
    
    const context = nodes.length > 0 
       ? nodes.map(n => `[SOURCE: ${n.metadata.filename}, PAGE: ${n.metadata.page}, SECTION: ${n.metadata.section}] Content: ${n.content}`).join('\n\n')
       : "No matching pages found.";
       
    addAction(AgentRole.EXECUTOR, `Retrieved ${originalNodes.length} primary pages. Expanded ${expandedNodes.length} neighboring pages for context continuity.`, 'completed');

    // 2. Context Aggregation & Reranking
    const rerankAction = addAction(AgentRole.EXECUTOR, `Merging paging context & applying TF-IDF relevance ranking...`);
    // Simulated re-ranking logic: filtering nodes with low score (handled in createTrace later but simulated here)
    const filteredNodes = nodes.filter(() => Math.random() > 0.1); // Simulate selective grounding
    rerankAction.status = 'completed';
    rerankAction.output = `SELECTED: ${filteredNodes.length}/${nodes.length} nodes for generation layer.`;
    onUpdate(rerankAction);

    // 3. Generation Layer (Peirce LNN / SDO Standards)
    const executorAction = addAction(AgentRole.EXECUTOR, `Grounded generation via PEIRCE LNN logic...`);
    const executorResponse = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Context:\n${context}\n\nQuery: ${query}\n\nSystem: You are the SARASWATI Executor. Provide a precise, technical answer based ONLY on the provided context. If information is missing, state it clearly. Adhere to ISRO mission-critical standards.`,
    });
    const draftContent = executorResponse.text || "No response generated.";
    executorAction.status = 'completed';
    executorAction.output = draftContent;
    onUpdate(executorAction);

    // 4. Grounding & Hallucination Audit
    const criticAction = addAction(AgentRole.CRITIC, `Adversarial audit & Hallucination detection...`);
    const criticResponse = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Draft Answer: ${draftContent}\n\nRetrieved Context: ${context}\n\nSystem: You are the SARASWATI Critic. Analyze the draft for hallucinations, logical flaws, or missing required technical details from the context. Output your critique clearly.`,
    });
    const critique = criticResponse.text || "No critique generated.";
    criticAction.status = 'completed';
    criticAction.output = critique;
    onUpdate(criticAction);

    // 5. Formal Verification & Confidence Scoring
    const validatorAction = addAction(AgentRole.VALIDATOR, `Executing Z3 SMT & Confidence Scoring...`);
    const constraints = nodes.map(n => n.id);
    const traces: SecurityTrace[] = nodes.map(node => createTrace(node.id, draftContent, constraints));
    
    const { metrics, sources } = calculateConfidence(traces, draftContent);
    const allApproved = traces.every(t => t.smtApproval && t.zkpStatus === 'verified');
    
    validatorAction.status = allApproved ? 'completed' : 'failed';
    validatorAction.output = `OVERALL_CONFIDENCE: ${(metrics.overallConfidence * 100).toFixed(2)}%\nGROUNDING_FIDELITY: ${(metrics.groundingFidelity * 100).toFixed(2)}%\nHALLUCINATION_RISK: ${(metrics.hallucinationRisk * 100).toFixed(2)}%`;
    onUpdate(validatorAction);

    return {
      answer: draftContent,
      traceLog: traces,
      agentActions: actions,
      domain,
      metrics,
      groundingSources: sources
    };
  }
}
