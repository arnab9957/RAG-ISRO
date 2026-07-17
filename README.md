# IRSARGO: Zero-Trust Multi-Agent RAG Engine

**IRSARGO** (Secure and Accurate Retrieval-Augmented Generation for Aerospace & Government Compliance) is a mission-critical, self-contained, enterprise-grade RAG system tailored for Indian Space Research Organisation (ISRO) aerospace technical specifications and government procurement compliance guidelines (such as GFR 2017). 

Designed to operate in secure, air-gapped / off-grid environments, the system features a zero-trust multi-agent security pipeline, local embedding computation, dynamic access control lists (DACL), anti-exfiltration output filtering, and simulated hybrid formal verification (ZK-STARK + Z3 SMT) to guarantee response groundedness, constraint satisfaction, and strict data safety.

---

## 📐 System Architecture Flow

The RAG pipeline is governed by a multi-agent orchestrator that processes queries, audits draft text, and performs formal logic proofs.

```mermaid
graph TD
    User([User Query]) --> PreProcess[Query Pre-Processing]
    
    subgraph Pre-Processing Stage
        PreProcess --> ZK["ZK-STARK Query Verification<br/>(RISC Zero Simulation)"]
        ZK --> Paraphrase["Semantic Query Paraphrasing<br/>(Executor Agent)"]
    end
    
    Paraphrase --> VectorQuery[Vector DB Retrieval]
    
    subgraph Knowledge Retrieval
        VectorQuery --> Chroma[(ChromaDB Vector Store)]
        Chroma --> ContextExpand["Context Continuity Expansion<br/>(Neighbor Node Expansion)"]
    end
    
    ContextExpand --> Rerank[TF-IDF Relevance Reranking]
    Rerank --> ExecutorGen["Grounded Generation Layer<br/>(Executor Agent - Peirce LNN)"]
    
    subgraph Generation & Validation Swarm
        ExecutorGen --> CriticAudit["Adversarial Hallucination Audit<br/>(Critic Agent)"]
        CriticAudit --> SMTVerify["Z3 SMT Formal Prover Simulation<br/>(Validator Agent)"]
        SMTVerify --> ConfScore[Confidence & Risk Metric Scoring]
    end
    
    ConfScore --> OutSanitize["Output Sanitization<br/>(Anti-Exfiltration Redaction)"]
    OutSanitize --> FinalResponse([Secured Grounded Response])
```

1. **Query Pre-Processing**: User query input is validated and cryptographically verified.
2. **ZK-STARK Proving**: Generates a simulated zero-knowledge proof (`zkstark_[timestamp]_[hash]_risc0_v2`) representing query integrity.
3. **Semantic Query Paraphrasing**: The *Executor Agent* strips out instructions and extracts the core query intent, preventing prompt-injection payloads from modifying agent system prompts.
4. **Vector Retrieval**: Queries ChromaDB with security clearances injected.
5. **Context Expansion**: Fetches adjacent pages/chunks of matching documents to preserve structural flow.
6. **TF-IDF Reranking**: Re-orders retrieved chunks dynamically based on query term frequency.
7. **Grounded Generation (Peirce LNN)**: The *Executor Agent* synthesizes a response constrained strictly to retrieved context enclosed in `<grounding_context>` XML blocks.
8. **Adversarial Hallucination Audit**: The *Critic Agent* evaluates the draft answer against the retrieved context to flag logical flaws, ungrounded declarations, or context leaks.
9. **Z3 SMT Verification**: Checks if the answer satisfies key domain terms extracted as logical constraints.
10. **Output Sanitization**: The output is stripped of unauthorized image/link tags to block exfiltration attacks.

---

## 🛡️ Zero-Trust Security Stack

### 1. Ingestion Input Sanitization
To prevent instruction smuggling and malicious comment injection during document processing, the pipeline sanitizes incoming text:
- **Zero-Width Spaces Removal**: Strips characters matching `/[\u200B-\u200D\uFEFF]/g`.
- **Hidden Control Characters Removal**: Strips characters matching `/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g`.
- **HTML & Markdown Comment Stripping**: Cleans out comments matching `<!--[\s\S]*?-->` and Markdown references like `[//]: (...)` or `[// ]: <...>`.

### 2. Zero-Trust PII Redaction
Before document segments are stored in ChromaDB or embedded, they are scanned for PII (Personally Identifiable Information):
- **Email Regex**: `/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g` $\rightarrow$ Replaced with `[REDACTED_EMAIL_X]`.
- **Phone Regex**: ` /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g` $\rightarrow$ Replaced with `[REDACTED_PHONE_X]`.
- **Security Identifier (SID) Regex**: `/S-\d-\d-\d{2}-\d{8,10}-\d{8,10}-\d{8,10}-\d{3,5}/g` $\rightarrow$ Replaced with `[REDACTED_SID_X]`.
- **Reversible Mapping**: Original values are mapped to placeholders and stored locally in `pii_mappings.json` under the file name.

### 3. Dynamic Access Control (DACL) & Keycloak FGA
Retrieval results depend on the authenticated user's role and clearances:
- **Role Clearance Matrix**:
  - **Administrator**: Access to `admin`, `everyone` groups. Full clearance to aerospace technical guides and confidential government files.
  - **Operator**: Access to `everyone` group. Clearance to standard technical manuals.
  - **Guest**: Access to `everyone`, `guest` groups. Denied from retrieving sensitive chunks.
- **Metadata Tagging**: During ingestion, files matching names containing `secret` or `confidential` or containing confidential keywords are indexed with:
  ```json
  {
    "allowed_groups": "admin",
    "denied_groups": "guest"
  }
  ```
- **ChromaDB Compound Filters**: In [server/index.ts](file:///d:/Desktop/ISRO/RAG-ISRO/server/index.ts#L650-L665), search parameters enforce:
  - `{ allowed_groups: { $in: ['everyone', 'admin'] } }` for Administrators.
  - `{ allowed_groups: 'everyone' }` for Operators.
  - `{ denied_groups: { $ne: 'guest' } }` for Guests.

### 4. Keycloak IDP Outage Simulation
The application contains a toggle to simulate Identity Provider (IDP) outages.
- When toggled (`simulateOutage === true`), token-exchange fails.
- A SIEM warning is written to the audit log:
  `[SIEM ALERT] [timestamp] DELEGATED_AUTH_FAILURE: Keycloak IDP connection failed...`
- The system gracefully degrades the session to a restricted **Guest Auditor** fallback, protecting data confidentiality.

### 5. Anti-Exfiltration Output Sanitizer
To prevent a compromised LLM response from exfiltrating data (e.g., rendering remote tracking images or forwarding users to external links), the system sanitizes all outputs in [src/App.tsx](file:///d:/Desktop/ISRO/RAG-ISRO/src/App.tsx#L48-L92):
- **Image Redaction**: Blocks Markdown image markup `![alt](url)` and replaces it with a blocked channel warning.
- **Link Cross-Checking**: Inspects standard Markdown links `[label](url)` and checks if the URL matches the filename or content of any successfully retrieved source document chunk. If the URL is external or unverified, it is redacted to `[Link Redacted: Exfiltration Risk]`.

---

## 🛠️ Verification & Compliance Proving

### 1. Z3 SMT Solver Simulation
Simulates formal verification by translating document conditions into logical constraints.
- **Constraint Extraction**: Extracts up to 8 key technical terms from the source text (excluding stop-words and words shorter than 5 characters).
- **Satisfiability**: The output passes verification only if at least **40%** of the key terms from each document context are present in the final generated answer.

### 2. RAG Triad Scoring Metrics
The engine calculates four core compliance metrics in [src/lib/verify.ts](file:///d:/Desktop/ISRO/RAG-ISRO/src/lib/verify.ts#L87-L124):
- **Retrieval Accuracy (Context Relevance)**: Average semantic similarity score of the matching database chunks retrieved from ChromaDB.
- **Grounding Fidelity (Groundedness)**: The percentage of traces that satisfied all formal SMT constraints.
- **Hallucination Risk**: Computed as $1.0 - \text{Grounding Fidelity}$, indicating the likelihood that statements were generated without source context support.
- **Overall Confidence**: The mathematical average of Retrieval Accuracy, Grounding Fidelity, and Answer Relevance (based on query/answer key term overlap).

### 3. C2PA Provenance Tracking
Documents ingested command-line or via the upload portal generate SHA-256 hashes. These are written directly to `ingestion_audit.log`, verifying the integrity and source path of data used in RAG contexts.

---

## 📂 Codebase Directory Structure

```text
├── chroma_data/             # Local persistent directory for ChromaDB database files
├── datasets/                # Source directory for document ingestion (PDF, TXT, MD, CSV)
├── server/
│   └── index.ts             # Express.js backend API server handling RAG, Auth & Ingest
├── scripts/
│   ├── ingest.ts            # Local ingestion parser, text chunker, and ChromaDB importer
│   └── verify_ingest.ts     # Command-line utility to output database counts and check connection
├── src/
│   ├── components/
│   │   ├── AgentActionItem.tsx   # Renders details and inputs/outputs of a specific agent's step
│   │   ├── BackgroundPixelStars.tsx # Canvas-based space/star background animation
│   │   ├── GraphVisualizer.tsx   # Force-directed D3-style node relationship graph and pan/zoom panel
│   │   ├── HistoryView.tsx       # Renders saved session logs and prior query metrics
│   │   ├── KnowledgeBaseView.tsx # Houses the list view and node visualizer for database queries
│   │   ├── OutputEditor.tsx      # Markdown generation viewer
│   │   └── TraceAudit.tsx        # Audit log layout showing security traces and confidence graphs
│   ├── lib/
│   │   ├── agents.ts        # Orchestration classes and prompts for Validator, Executor, and Critic
│   │   ├── ontology.ts      # Fallback database nodes and local mock search queries
│   │   └── verify.ts        # Cryptographic hashing, ZK-STARK proof, and confidence algorithms
│   ├── App.tsx              # Main layout, dashboard views, and authentication wrapper
│   ├── index.css            # Stylesheets using modern, dark-theme styles
│   └── main.tsx             # Application entrypoint
├── docker-compose.yml       # Docker orchestrator for ChromaDB and offline ingest containers
├── ingest.Dockerfile        # Docker environment for running the ingestion pipeline
├── package.json             # Core dependency configuration and NPM scripts
└── tsconfig.json            # TypeScript compiler options
```

---

## ⚙️ Environment Variables Configuration

Create a `.env.local` file in the root directory to customize the parameters:

| Variable | Description | Default / Example Value |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Google Gemini API key used for cloud generation fallback. | `AIzaSy...` |
| `APP_URL` | Application endpoint URL. | `http://localhost:3000` |
| `USE_LOCAL_LLM` | Set `true` to execute generation on a local offline model. | `false` |
| `LOCAL_LLM_URL` | API endpoint for the local LLM instance (e.g. Ollama). | `http://localhost:11434` |
| `LOCAL_LLM_MODEL` | The model name in the local LLM instance. | `gemma2:2b` |
| `CHROMADB_HOST` | Hostname of the ChromaDB database service. | `localhost` |
| `CHROMADB_PORT` | Port of the ChromaDB database service. | `8000` |
| `CHROMADB_SSL` | Enable SSL for ChromaDB connections. | `false` |

---

## 🛠️ Getting Started & Run Locally

### Prerequisites
- **Node.js** (v18 or higher)
- **Docker** and **Docker Compose**

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Launch ChromaDB Vector Database
Start the persistent ChromaDB service using Docker Compose:
```bash
docker-compose up -d chromadb
```
This launches a database container on `http://localhost:8000` mapped to `./chroma_data` on the host machine.

### Step 3: Ingest Data
Place documents you want to ingest (PDF, TXT, MD, CSV) in the `datasets/` folder.

**Option A (Using Docker Ingestion Container):**
```bash
docker-compose run --rm ingest
```

**Option B (Using Local Node Script):**
```bash
npm run ingest
```
This script calls [scripts/ingest.ts](file:///d:/Desktop/ISRO/RAG-ISRO/scripts/ingest.ts) to clean, redact, chunk, embed, and store files.

### Step 4: Verify Database Chunks
To count and verify current records in the local Chroma database, execute:
```bash
npx tsx scripts/verify_ingest.ts
```

### Step 5: Start the Backend Server
Start the Express API server (runs on `http://localhost:3001`):
```bash
npm run server
```

### Step 6: Start the Frontend App
Start the Vite developer client server (runs on `http://localhost:3000`):
```bash
npm run dev
```

---

## 🔑 Authentication & Developer Mode

For rapid testing and debugging:
- **Developer Bypass**: Standard MFA OTP steps are bypassed. Submitting valid credentials on the login screen issues a JWT token and forwards you to the dashboard.
- **Credential Fallbacks**: In [server/index.ts](file:///d:/Desktop/ISRO/RAG-ISRO/server/index.ts#L225-L245), standard user profiles are defined (e.g. `admin`, `operator`, `guest`).
- **Offline Generation Fallback**: If the local LLM is down and no Google Gemini API key is configured, the orchestrator triggers [src/lib/verify.ts mockGenerate()](file:///d:/Desktop/ISRO/RAG-ISRO/src/lib/verify.ts#L141-L229) to simulate compliant RAG answers based strictly on retrieved GFR / technical rules.

---

## 📊 Live Database Chunk Counter

A live count of total chunks stored in the system is available:
1. **Left Side of the Header**: The badge `DB CHUNKS: <count>` is permanently displayed under the application title. It works dynamically and automatically updates on user login and upon completion of any frontend document ingestion.
2. **Left Console Sidebar**: The **ChromaDB Knowledge Base** card displays the total counts, the connection endpoint details, and a live pulsing network connectivity dot.
