# IRSARGO: Zero-Trust Multi-Agent RAG Engine

**IRSARGO** (Secure and Accurate Retrieval-Augmented Generation for Aerospace & Government Compliance) is a mission-critical, self-contained, enterprise-grade RAG system tailored for Indian Space Research Organisation (ISRO) aerospace technical specifications and government procurement compliance guidelines (such as GFR 2017). 

Designed to operate in secure, air-gapped / off-grid environments, the system features a zero-trust multi-agent security pipeline, local embedding computation, dynamic access control lists (DACL), anti-exfiltration output filtering, and hybrid formal verification (Circom ZK-SNARK + WebAssembly Z3 SMT) to guarantee response groundedness, constraint satisfaction, and strict data safety.


---

## 🚀 Key Integrated Features

The system implements advanced Retrieval-Augmented Generation (RAG) methodologies engineered for maximum accuracy, recall, and zero-trust safety:

1. **RAPTOR (Hierarchical Tree-Organized Retrieval)**: Recursively clusters chunk embeddings and generates parent summaries using local VLMs/LLMs, allowing the system to query broad, high-level themes alongside fine-grained passages.
2. **ColBERT-style Late-Interaction Reranking**: Utilizes unpooled token-level embeddings from `@xenova/transformers` to calculate contextual similarity via the **MaxSim** operator, ensuring high-fidelity term alignment.
3. **GraphRAG Node/Edge Ingestion**: Extracts entity relationship triplets `(subject, relation, object)` and queries them to inject structured relationship paths into the retrieval stream.
4. **Parent-Document Retrieval**: Indexes small, semantic child chunks for search accuracy but retrieves and displays parent text (large continuous context blocks) to ensure continuity in generation.
5. **ReAct Agentic Multi-Step Planner**: Formulates sub-goals, routes queries to `VectorSearch`, `GraphSearch`, or `VerifyCompliance` tools, and collects observations recursively.
6. **Query Expansion & HyDE**: Generates query variants and hypothetical answers (HyDE) to bridge phrasing gaps and enhance retrieval recall.
7. **Offline Multimodal VLM Page Ingestion**: Converts PDF pages into images and runs local **Moondream2** via **Ollama** to analyze and transcribe tables, diagrams, and formatting layouts offline.
8. **Precision & Recall Dashboard**: Features a built-in automated suite to evaluate retrieval pipeline efficiency (Precision@5 and Recall@5) against pre-configured QA pairs.

---

## 📐 System Architecture Flow

The RAG pipeline is governed by a multi-agent orchestrator that processes queries, audits draft text, and performs formal logic proofs.

```mermaid
graph TD
    User([User Query]) --> PreProcess[Query Pre-Processing]
    
    subgraph Pre-Processing Stage
        PreProcess --> ZK["ZK-SNARK Query Verification<br/>(Circom Engine)"]
        ZK --> Expand["Query Expansion & HyDE<br/>(Executor Agent)"]
    end
    
    Expand --> VectorQuery[Vector DB Retrieval]
    
    subgraph Knowledge Retrieval & Processing
        VectorQuery --> Chroma[(ChromaDB Vector Store)]
        Chroma --> RRAPTOR["RAPTOR Index Layer Summaries"]
        Chroma --> ParentDoc["Parent-Doc Context Swap"]
    end
    
    RRAPTOR --> Fusion["Reciprocal Rank Fusion<br/>(RRF Dense + Sparse)"]
    ParentDoc --> Fusion
    
    Fusion --> ColBERT["ColBERT-style MaxSim Reranker"]
    
    ColBERT --> ReActLoop["ReAct Agentic Multi-Step Planner<br/>(Executor/Validator Tools Loop)"]
    
    subgraph Generation & Validation Swarm
        ReActLoop --> GraphRAG["GraphRAG Path Injection<br/>(knowledge_graph.json)"]
        GraphRAG --> ExecutorGen["Grounded Generation Layer"]
        ExecutorGen --> CriticAudit["Adversarial Hallucination Audit<br/>(Critic Agent)"]
        CriticAudit --> SMTVerify["WebAssembly Z3 SMT Formal Prover<br/>(Validator Agent)"]
        SMTVerify --> ConfScore[Confidence & Risk Metric Scoring]
    end
    
    ConfScore --> OutSanitize["Output Sanitization<br/>(Anti-Exfiltration Redaction)"]
    OutSanitize --> FinalResponse([Secured Grounded Response])
```

1. **Query Pre-Processing**: User query input is validated and cryptographically verified.
2. **ZK-SNARK Proving**: Generates a zero-knowledge proof (`zksnark_[timestamp]_[hash]_circom`) representing query integrity and clearance membership.
3. **Query Expansion & HyDE**: Generates 2 alternative search queries and a hypothetical document paragraph to bridge semantic phrasing gaps and boost retrieval recall.
4. **Parent-Document Retrieval**: Indexes small child chunks for semantic precision but swaps in larger parent document context blocks during generation to maintain context continuity.
5. **RAPTOR (Recursive Summarization Tree)**: Recursively clusters document chunks using local cosine similarity and generates summary layers, allowing multi-level search across leaf passages and high-level themes.
6. **ColBERT-style Late-Interaction Reranking**: Uses unpooled token-level MaxSim operators computed natively in JS using `@xenova/transformers` to rerank top RRF candidates.
7. **GraphRAG Node/Edge Ingestion & Search**: Indexes extracted entity relationship triplets `(subject, relation, object)` into `knowledge_graph.json` and injects matching paths as context nodes.
8. **ReAct Agentic Multi-Step Planner**: Routes sub-queries dynamically to `VectorSearch`, `GraphSearch`, and `VerifyCompliance` tools to build answers for complex, multi-hop questions.
9. **Grounded Generation (Peirce LNN)**: The *Executor Agent* synthesizes a response constrained strictly to retrieved context enclosed in `<grounding_context>` XML blocks.
10. **Adversarial Hallucination Audit**: The *Critic Agent* evaluates the draft answer against the retrieved context to flag logical flaws, ungrounded declarations, or context leaks.
11. **Z3 SMT Verification**: Checks if the answer satisfies key domain terms extracted as logical constraints.
12. **Output Sanitization**: The output is stripped of unauthorized image/link tags to block exfiltration attacks.

---

## 🛡️ Zero-Trust Security Stack

### 1. Ingestion Input Sanitization & Multimodal OCR
To prevent instruction smuggling and malicious comment injection during document processing, the pipeline sanitizes incoming text:
- **Zero-Width Spaces Removal**: Strips characters matching `/[\u200B-\u200D\uFEFF]/g`.
- **Hidden Control Characters Removal**: Strips characters matching `/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g`.
- **HTML & Markdown Comment Stripping**: Cleans out comments matching `<!--[\s\S]*?-->` and Markdown references like `[//]: (...)` or `[// ]: <...>`.

**Offline Multimodal VLM Page Ingestion**: All ingested PDFs are rendered page-by-page to local image stores (`public/page_images/`). The server runs a local vision-language model (**Moondream2** via **Ollama**) to describe page layouts, diagrams, and transcribe table grids, indexing these descriptions alongside parsed text to ensure layout and structural continuity.

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

### 3. Automated Precision & Recall Benchmarks
The application features a built-in automated testing suite designed to evaluate the Retrieval-Augmented Generation pipeline's search efficiency. 
- **Precision@5 and Recall@5**: Administrators can run live benchmarks against pre-configured ground-truth query-document pairs.
- **Dynamic Matching**: The backend calculates metrics by evaluating whether the expected source document filenames appear within the top 5 chunks returned by the ColBERT-RRF hybrid search algorithm.

### 4. C2PA Provenance Tracking
Documents ingested command-line or via the upload portal generate SHA-256 hashes. These are written directly to `ingestion_audit.log`, verifying the integrity and source path of data used in RAG contexts.

---

## 📂 Codebase Directory Structure

```text
├── chroma_data/             # Local persistent directory for ChromaDB database files
├── datasets/                # Source directory for document ingestion (PDF, TXT, MD, CSV)
├── knowledge_graph.json     # Local flat JSON entity-relationship edge-list (GraphRAG database)
├── pii_mappings.json        # Reversible PII mapping placeholders storage
├── server/
│   └── index.ts             # Express.js backend API server handling RAG, Auth, Ingest, & ColBERT
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

### Step 5: Start All System Services (Docker + Auth + Ollama + Backend + Frontend)
Execute a single command to automatically spin up all required containers and services:
```bash
npm run server
# or
npm start
```

This single command automatically:
1. Starts **Docker Compose** containers for **ChromaDB** (`http://localhost:8000`), **Keycloak OIDC IDP** (`http://localhost:8080`), **PostgreSQL**, **OpenLDAP** (`port 389`), and **phpLDAPadmin** (`http://localhost:8081`).
2. Spawns the **Ollama local LLM/VLM server** (`http://localhost:11434`).
3. Starts the **Express API Backend** (`http://localhost:3001`).
4. Starts the **Vite React Frontend** (`http://localhost:3000`).

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
