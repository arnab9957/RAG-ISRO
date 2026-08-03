/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum AgentRole {
  EXECUTOR = 'Executor',
  CRITIC = 'Critic',
  VALIDATOR = 'Validator',
}

export enum Domain {
  AEROSPACE = 'Aerospace Technical Operations',
  GOVERNMENT = 'Government Compliance (GFR)',
}

export interface GroundedNode {
  id: string;
  label: string;
  type: string;
  content: string;
  metadata: {
    filename: string;
    page: number;
    section: string;
    chunkId: string;
    subsystem?: string;
    timestamp?: string;
    domain?: string;
    source?: string;
    chunk_index?: number;
    uploaded_at?: string;
    label?: string;
    type?: string;
  };
  score?: number;
  neighborIds?: string[];
}

export interface SecurityTrace {
  nodeId: string;
  zkpStatus: 'verified' | 'failed';
  provenanceHash: string;
  smtApproval: boolean;
  smtStatus?: 'SAT' | 'UNSAT' | 'UNKNOWN';
  smtLatencyMs?: number;
  smtConstraintsCount?: number;
  smtConflicts?: string[];
  smtProofTrace?: string;
  timestamp: string;
  relevanceScore: number;
}

export interface ConfidenceMetrics {
  retrievalAccuracy: number;
  groundingFidelity: number;
  hallucinationRisk: number;
  overallConfidence: number;
}

export interface AgentAction {
  id: string;
  role: AgentRole;
  action: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  output?: string;
  timestamp: string;
}

export interface AdvancedFilters {
  subsystem?: string;
  dataType?: string;
  dateStart?: string;
  dateEnd?: string;
}

export interface HistoryItem {
  id: string;
  query: string;
  domain: Domain;
  timestamp: string;
  response: IRSARGOResponse;
}

export interface IRSARGOResponse {
  answer: string;
  traceLog: SecurityTrace[];
  agentActions: AgentAction[];
  domain: Domain;
  metrics: ConfidenceMetrics;
  groundingSources: string[];
  isPendingVerification?: boolean;
  retrievedNodes?: GroundedNode[];
  validatorActionId?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'IRSARGO';
  text: string;
  timestamp: string;
  response?: IRSARGOResponse;
}

