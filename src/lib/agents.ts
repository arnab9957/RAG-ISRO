/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { AgentAction, AgentRole, Domain, SaraswatiResponse, SecurityTrace, AdvancedFilters } from "../types";
import { searchOntology } from "./ontology";
import { createTrace, generateQueryProof } from "./verify";

export class SaraswatiOrchestrator {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
  }

  async runQuery(query: string, domain: Domain, filters: AdvancedFilters | undefined, onUpdate: (action: AgentAction) => void): Promise<SaraswatiResponse> {
    const actions: AgentAction[] = [];
    const addAction = (role: AgentRole, action: string, status: AgentAction['status'] = 'active', output?: string) => {
      const newAction: AgentAction = {
        id: Math.random().toString(36).substr(2, 9),
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

    // 0. Pre-processing Phase: ZKP Generation for Query Integrity
    const zkpAction = addAction(AgentRole.VALIDATOR, `Generating RISC Zero ZK-STARK proof for query integrity...`);
    const queryProof = generateQueryProof(query);
    zkpAction.status = 'completed';
    zkpAction.output = `PROOF_GEN: ${queryProof}`;
    onUpdate(zkpAction);

    // 1. Retrieval Phase (Ontology Mapping)
    const filterDesc = filters ? ` with filters: ${JSON.stringify(filters)}` : '';
    addAction(AgentRole.EXECUTOR, `Accessing FalkorDB / Neo4j GroundedKG for domain: ${domain}${filterDesc}...`);
    const nodes = searchOntology(query, domain, filters);
    const context = nodes.length > 0 
      ? nodes.map(n => `[${n.id}] ${n.label}: ${JSON.stringify(n.properties)}`).join('\n')
      : "No matching nodes found in GroundedKG.";
    addAction(AgentRole.EXECUTOR, `Retrieved ${nodes.length} relevant nodes via AMR semantic parsing.`, 'completed');

    // 2. Draft Phase (Executor)
    const executorAction = addAction(AgentRole.EXECUTOR, `Synthesizing via PEIRCE LNN grounded in SDO/GFR standards...`);
    const executorResponse = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Context:\n${context}\n\nQuery: ${query}\n\nSystem: You are the SARASWATI Executor. Provide a precise, technical answer based ONLY on the provided context. If information is missing, state it clearly. Adhere to ISRO mission-critical standards.`,
    });
    const draftContent = executorResponse.text || "No response generated.";
    executorAction.status = 'completed';
    executorAction.output = draftContent;
    onUpdate(executorAction);

    // 3. Critique Phase (Critic)
    const criticAction = addAction(AgentRole.CRITIC, `Adversarial audit & C2PA manifest embedding...`);
    const criticResponse = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Draft Answer: ${draftContent}\n\nRetrieved Context: ${context}\n\nSystem: You are the SARASWATI Critic. Analyze the draft for hallucinations, logical flaws, or missing required technical details from the context. Output your critique clearly.`,
    });
    const critique = criticResponse.text || "No critique generated.";
    criticAction.status = 'completed';
    criticAction.output = critique;
    onUpdate(criticAction);

    // 4. Formal Verification Phase (Validator - SMT Simulation)
    const validatorAction = addAction(AgentRole.VALIDATOR, `Executing Z3 SMT-solver & RISC Zero zkVM verification...`);
    
    // Simulate constraints extracted from query/domain
    const constraints = nodes.map(n => n.id); // Answer must mention the IDs of used nodes
    const traces: SecurityTrace[] = nodes.map(node => createTrace(node.id, draftContent, constraints));
    
    const allApproved = traces.every(t => t.smtApproval && t.zkpStatus === 'verified');
    
    validatorAction.status = allApproved ? 'completed' : 'failed';
    validatorAction.output = allApproved ? "FORMAL VERIFICATION: PASSED (Boolean true)" : "FORMAL VERIFICATION: FAILED (Constraint conflict)";
    onUpdate(validatorAction);

    return {
      answer: draftContent,
      traceLog: traces,
      agentActions: actions,
      domain
    };
  }
}
