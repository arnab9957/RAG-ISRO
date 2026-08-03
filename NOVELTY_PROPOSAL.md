# IRSARGO: Novelty Enhancements & Advanced Research Roadmap

This document outlines concrete, publication-grade architectural and algorithmic enhancements to introduce breakthrough novelty into the **IRSARGO** (Secure & Accurate RAG Engine for Aerospace & Government Compliance) framework.

---

## Executive Summary & Motivation

While the current IRSARGO system synthesizes multiple advanced Retrieval-Augmented Generation (RAG) methodologies—such as **RAPTOR**, **ColBERT MaxSim Late-Interaction**, **GraphRAG**, and **Zero-Trust Access Control (DACL)**—several core verification mechanisms (e.g., Z3 SMT formal proving, ZK-STARK query verification, C2PA provenance) currently operate as heuristic or simulated functions.

By upgrading these components from simulations to **real cryptographic proofs, mathematical solvers, and graph-guided retrieval algorithms**, IRSARGO can establish a novel benchmark for mission-critical, air-gapped RAG implementations.

---

## 🔬 Key Novelty Proposals

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                               IRSARGO NOVELTY ROADMAP                                    │
└───────────────────────────────────────────┬──────────────────────────────────────────────┘
                                            │
        ┌───────────────────┬───────────────┴───────────────┬───────────────────┐
        ▼                   ▼                               ▼                   ▼
┌─────────────────┐ ┌─────────────────┐             ┌─────────────────┐ ┌─────────────────┐
│ 1. Real Z3 SMT  │ │ 2. True ZK-     │             │ 3. Graph-Guided │ │ 4. Entropy-     │
│   Solver WASM   │ │   SNARK DACL    │             │   ColBERT Rerank│ │   Driven Active │
│   Verification  │ │   Proof Engine  │             │   MaxSim Fusion │ │   Self-RAG Loop │
└─────────────────┘ └─────────────────┘             └─────────────────┘ └─────────────────┘
```

---

### 1. Real Z3 SMT Solver WASM Constraint Verification

#### Current Limitation
`formalVerification()` in `src/lib/verify.ts` evaluates candidate answers using keyword overlap (>25% threshold).

#### Proposed Innovation
Integrate a real WebAssembly-compiled Z3 SMT solver (`z3-solver` WASM npm package) directly into the Node.js backend. The system translates document rules and numerical ranges into formal SMT formulas, checking output satisfiability deterministically.

#### Architecture & Mathematical Formulation
For any retrieved aerospace technical spec document $D$, extract a set of first-order logic constraints $\mathcal{C}_D$:

$$\mathcal{C}_D = \{ v_{\text{thrust}} \ge 180.0 \land v_{\text{thrust}} \le 200.0, \; v_{\text{Isp}} \ge 440.0 \}$$

When an LLM generates candidate text $Y$, an entity extractor parses numerical assertions $A_Y$:

$$A_Y = \{ v_{\text{thrust}} = 175.0 \}$$

The Z3 solver evaluates $\text{Check}(\mathcal{C}_D \land A_Y)$:
* If **SAT** (Satisfiable): Response is validated and assigned 100% Grounding Fidelity.
* If **UNSAT** (Unsatisfiable): Response is rejected as a hard hallucination violation.

```typescript
// Architectural Blueprint: Real Z3 WASM Verification Tool
import { initZ3 } from 'z3-solver';

export async function verifySMTConstraints(candidateAnswer: string, docConstraints: Array<{ variable: string; op: string; value: number }>): Promise<boolean> {
  const { Context } = await initZ3();
  const { Real, Solver } = Context('main');
  const solver = new Solver();

  // 1. Declare domain variables and add document constraints
  for (const c of docConstraints) {
    const v = Real.const(c.variable);
    if (c.op === '>=') solver.add(v.ge(c.value));
    if (c.op === '<=') solver.add(v.le(c.value));
    if (c.op === '==') solver.add(v.eq(c.value));
  }

  // 2. Parse candidate answer assertions and check satisfiability
  // Returns true (SAT) or false (UNSAT)
  const result = await solver.check();
  return result === 'sat';
}
```

---

### 2. True Zero-Knowledge (ZK-SNARK) DACL Proof Engine

#### Current Limitation
Query integrity proof `generateQueryProof()` generates a timestamped string digest (`zkstark_[timestamp]_[hash]`).

#### Proposed Innovation
Implement a client-side Zero-Knowledge circuit using **Circom** and **SnarkJS** (or Noir/RISC Zero WASM). The user proves they hold an authorized clearance key matching a Merkle root of valid security clearances **without revealing their identity or private token to the vector search engine**.

#### Architecture Flow
1. **Public Inputs**: Merkle root of clearance roles ($\mathbf{R}$), Document Security Group ID ($\mathbf{G}$).
2. **Private Inputs**: User identity secret key ($k_{\text{user}}$), Merkle path proof ($\pi_{\text{path}}$).
3. **Circuit Output**: Cryptographic proof $P_{\text{zk}}$ verifying $k_{\text{user}} \in \mathbf{R}$ for group $\mathbf{G}$.
4. **Backend Action**: ChromaDB executes vector search only after $P_{\text{zk}}$ is cryptographically verified by `snarkjs.groth16.verify()`.

```solidity
// Circom Circuit Concept: dacl_verifier.circom
pragma circom 2.1.6;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/smt.circom";

template DACLVerifier(nLevels) {
    signal input root;
    signal input secretKey;
    signal input pathElements[nLevels];
    signal input pathIndices[nLevels];
    signal output isValid;

    // Hashes secret key and verifies membership in Merkle tree root
    component hasher = Poseidon(1);
    hasher.inputs[0] <== secretKey;
    
    // ... Merkle tree membership proof computation ...
}
component main {public [root]} = DACLVerifier(10);
```

---

### 3. Graph-Guided Late-Interaction Reranking (ColBERT + Knowledge Graph Fusion)

#### Current Limitation
ColBERT MaxSim token reranking and GraphRAG run as isolated channels and concatenate context blocks independently.

#### Proposed Innovation
Formulate a novel **Graph-Guided Late-Interaction Reranking Score**. Weight token embeddings in the ColBERT MaxSim operator based on the topological centrality of entities in `knowledge_graph.json`.

#### Mathematical Formulation
Standard ColBERT MaxSim score between Query tokens $Q = (q_1, \dots, q_m)$ and Document tokens $D = (d_1, \dots, d_n)$:

$$S_{\text{ColBERT}}(Q, D) = \sum_{i=1}^m \max_{j=1}^n \left( E(q_i) \cdot E(d_j)^T \right)$$

**Graph-Guided MaxSim Score ($S_{\text{G-ColBERT}}$)**:

$$S_{\text{G-ColBERT}}(Q, D) = \sum_{i=1}^m \omega(q_i) \cdot \max_{j=1}^n \left( E(q_i) \cdot E(d_j)^T \right)$$

Where the token weight $\omega(q_i)$ is dynamically scaled by PageRank or Degree Centrality $C_g(q_i)$ in the entity knowledge graph:

$$\omega(q_i) = 1.0 + \alpha \cdot \log\left(1 + C_g(q_i)\right)$$

* High-centrality domain entities (e.g., `Cryogenic Engine`, `GFR Rule 149`) automatically receive higher retrieval weighting during late interaction token alignment.

---

### 4. Adaptive Entropy-Driven Self-Correction (Self-RAG / Active Retrieval)

#### Current Limitation
The ReAct agent executes a fixed retrieval sequence prior to generating text.

#### Proposed Innovation
Implement real-time predictive entropy monitoring during local LLM token generation (via Ollama / local HuggingFace endpoints).

#### Dynamic Execution Loop
1. As the local LLM generates tokens $w_1, w_2, \dots, w_t$, record log-probabilities $\log P(w_t)$.
2. Calculate token uncertainty / predictive entropy $H(w_t) = -\sum_{i} P(w_i) \log P(w_i)$.
3. If $H(w_t) > \tau_{\text{threshold}}$ (indicating model uncertainty or potential hallucination):
   * Pause generation mid-sentence.
   * Extract the last 10 generated tokens as an active search sub-query.
   * Trigger targeted GraphRAG lookup.
   * Inject fresh context into the prompt buffer and resume generation.

---

### 5. Automated Aerospace Hallucination & Security Benchmark Suite

#### Current Limitation
Existing benchmarks measure standard Precision@5 and Recall@5 against basic document filename matches.

#### Proposed Innovation
Construct a domain-specific evaluation suite tailored for high-consequence aerospace and government procurement compliance:

1. **Hard Constraint Violation Rate (HCVR)**: Percentage of generated outputs that violate numeric ranges in source specs (tested via Z3).
2. **Security Clearance Leakage Rate (SCLR)**: Adversarial test suite simulating role-escalation queries across Guest, Operator, and Admin roles.
3. **Indirect Prompt Injection Defense Rate (PIDR)**: Benchmark evaluating resilience against 50+ OWASP for LLM injection payloads (hidden comments, zero-width payloads, steganographic markdown links).

---

## 📊 Summary Comparison & Impact Matrix

| Dimension | Current Implementation | Proposed Novel Enhancement | Technical Impact |
| :--- | :--- | :--- | :--- |
| **Formal Logic** | Keyword overlap check (>25%) | Real **Z3 SMT Solver WASM** AST logic proving | Deterministic 100% mathematical grounding |
| **ZK Verification** | Simulated string digest (`zkstark_...`) | Real **Circom/SnarkJS ZK-SNARK** Merkle DACL proof | Cryptographic privacy-preserving retrieval |
| **Reranking Algorithm** | Standard ColBERT MaxSim | **Graph-Guided Late-Interaction (G-ColBERT)** | Direct algorithmic contribution to retrieval literature |
| **Agent Execution** | Static ReAct planning | **Predictive Entropy-Triggered Active RAG** | Dynamic self-corrective LLM generation |
| **Benchmarking** | Precision@5 / Recall@5 | **HCVR, SCLR & OWASP Injection Benchmark** | Comprehensive aerospace security evaluation |

---

## 🛠️ Recommended Phased Implementation Plan

1. **Phase 1 (Z3 SMT Integration)**: Add `z3-solver` WASM dependency to Node.js backend (`server/index.ts`) and create automated AST parser for technical specs.
2. **Phase 2 (G-ColBERT Reranker)**: Modify MaxSim computation in `server/index.ts` to weight token scores by `knowledge_graph.json` node degree centrality.
3. **Phase 3 (ZK-SNARK DACL)**: Compile Circom DACL verification circuit and link `snarkjs` verifier to express API pre-retrieval middleware.
4. **Phase 4 (Aerospace Benchmark Suite)**: Expand `scripts/academic_benchmark.ts` to output HCVR and SCLR metric reports.
