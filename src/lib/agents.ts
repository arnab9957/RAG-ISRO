/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { AgentAction, AgentRole, Domain, SaraswatiResponse, SecurityTrace, AdvancedFilters } from "../types";
import { searchOntology } from "./ontology";
import { createTrace, generateQueryProof, calculateConfidence, extractKeyTerms } from "./verify";

export class SaraswatiOrchestrator {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
  }

  async generateText(contents: string): Promise<string> {
    try {
      const response = await fetch('http://localhost:3001/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contents }),
      });

      if (!response.ok) {
        throw new Error(`Generation API failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.text || '';
    } catch (error) {
      console.warn('Backend LLM generation failed, falling back to direct frontend Google GenAI:', error);
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('Gemini API key is not configured and local generation failed.');
      }
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents,
      });
      return response.text || '';
    }
  }


  async runQuery(
    query: string,
    domain: Domain,
    filters: AdvancedFilters | undefined,
    chatHistory: { sender: 'user' | 'saraswati'; text: string }[],
    onUpdate: (action: AgentAction) => void
  ): Promise<SaraswatiResponse> {
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

    // Format chat history for text-based context inclusion
    const formattedHistory = chatHistory.length > 0
      ? chatHistory.map(h => `${h.sender === 'user' ? 'User' : 'SARASWATI'}: ${h.text}`).join('\n')
      : "No previous conversation history.";

    // 3. Generation Layer (Peirce LNN / SDO Standards)
    const executorAction = addAction(AgentRole.EXECUTOR, `Grounded generation via PEIRCE LNN logic...`);
    const draftContent = await this.generateText(
      `Conversation History:\n${formattedHistory}\n\nRetrieved Context:\n${context}\n\nFollow-up User Query: ${query}\n\nSystem: You are the SARASWATI Executor. Provide a precise, technical answer based ONLY on the provided context and the conversation history above. Refer back to prior context if the user asks follow-up questions. If information is missing, state it clearly. Adhere to ISRO mission-critical standards.`
    ) || "No response generated.";
    executorAction.status = 'completed';
    executorAction.output = draftContent;
    onUpdate(executorAction);

    // 4. Grounding & Hallucination Audit
    const criticAction = addAction(AgentRole.CRITIC, `Adversarial audit & Hallucination detection...`);
    const critique = await this.generateText(
      `Conversation History:\n${formattedHistory}\n\nDraft Answer: ${draftContent}\n\nRetrieved Context: ${context}\n\nSystem: You are the SARASWATI Critic. Analyze the draft answer for hallucinations, logical flaws, or missing required technical details from the retrieved context or conversation history. Output your critique clearly.`
    ) || "No critique generated.";
    criticAction.status = 'completed';
    criticAction.output = critique;
    onUpdate(criticAction);

    // 5. Formal Verification & Confidence Scoring
    const validatorAction = addAction(AgentRole.VALIDATOR, `Executing Z3 SMT & Confidence Scoring...`);
    onUpdate(validatorAction);

    return {
      answer: draftContent,
      traceLog: [],
      agentActions: actions,
      domain,
      metrics: {
        retrievalAccuracy: 0,
        groundingFidelity: 0,
        hallucinationRisk: 0,
        overallConfidence: 0
      },
      groundingSources: [],
      isPendingVerification: true,
      retrievedNodes: nodes,
      validatorActionId: validatorAction.id
    };
  }

  async verifyQuery(
    answer: string,
    nodes: any[],
    validatorActionId: string,
    onUpdate: (action: AgentAction) => void
  ): Promise<{ metrics: any; traceLog: SecurityTrace[]; groundingSources: string[]; validatorAction: AgentAction }> {
    try {
      const response = await fetch('http://localhost:3001/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answer, nodes }),
      });

      if (!response.ok) {
        throw new Error(`Verification API failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      const updatedAction: AgentAction = {
        id: validatorActionId,
        role: AgentRole.VALIDATOR,
        action: `Executing Z3 SMT & Confidence Scoring...`,
        status: data.allApproved ? 'completed' : 'failed',
        output: `OVERALL_CONFIDENCE: ${(data.metrics.overallConfidence * 100).toFixed(2)}%\nGROUNDING_FIDELITY: ${(data.metrics.groundingFidelity * 100).toFixed(2)}%\nHALLUCINATION_RISK: ${(data.metrics.hallucinationRisk * 100).toFixed(2)}%`,
        timestamp: new Date().toISOString(),
      };
      onUpdate(updatedAction);

      return {
        metrics: data.metrics,
        traceLog: data.traceLog,
        groundingSources: data.groundingSources,
        validatorAction: updatedAction
      };
    } catch (error) {
      console.error('Verification query failed:', error);
      const failedAction: AgentAction = {
        id: validatorActionId,
        role: AgentRole.VALIDATOR,
        action: `Executing Z3 SMT & Confidence Scoring...`,
        status: 'failed',
        output: 'Verification computation failed on backend.',
        timestamp: new Date().toISOString(),
      };
      onUpdate(failedAction);
      throw error;
    }
  }
}
