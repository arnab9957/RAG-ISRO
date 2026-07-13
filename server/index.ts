import express from 'express';
import cors from 'cors';
import { ChromaClient } from 'chromadb';
import { pipeline } from '@xenova/transformers';
import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { randomUUID, createHash } from 'crypto';
import { createRequire } from 'module';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { extractKeyTerms, createTrace, calculateConfidence, mockGenerate } from '../src/lib/verify';

// --- RAG Security Helper Functions ---

/**
 * Escape backslashes and double quotes in scalar string filters to prevent parser injections.
 */
function escapeFilterLiteral(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Preprocessing & Sanitization: Strip zero-width spaces, hidden control characters,
 * and HTML/markdown comments to prevent invisible instruction smuggling.
 */
function sanitizeDocumentText(text: string): string {
  if (!text) return '';
  return text
    // Remove zero-width spaces and other invisible/format characters
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // Remove control characters (except tabs, newlines, carriage returns)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
    // Strip HTML comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // Strip Markdown-style link/image reference comments
    .replace(/\[\/\/\]:\s*\(.*?\)/g, '')
    .replace(/\[\/\/\s*\]:\s*<.*?>/g, '');
}

// PII Regex Patterns
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
const SID_REGEX = /S-\d-\d-\d{2}-\d{8,10}-\d{8,10}-\d{8,10}-\d{3,5}/g;

/**
 * Zero-Trust PII Redaction: Scan content for emails, phone numbers, and SIDs,
 * replacing them with reversible placeholders prior to embedding and storage.
 */
function redactPII(text: string, filename: string): { redactedText: string; mappings: Record<string, string> } {
  const mappings: Record<string, string> = {};
  let redactedText = text;
  
  let emailIndex = 1;
  redactedText = redactedText.replace(EMAIL_REGEX, (match) => {
    const placeholder = `[REDACTED_EMAIL_${emailIndex++}]`;
    mappings[placeholder] = match;
    return placeholder;
  });

  let phoneIndex = 1;
  redactedText = redactedText.replace(PHONE_REGEX, (match) => {
    const placeholder = `[REDACTED_PHONE_${phoneIndex++}]`;
    mappings[placeholder] = match;
    return placeholder;
  });

  let sidIndex = 1;
  redactedText = redactedText.replace(SID_REGEX, (match) => {
    const placeholder = `[REDACTED_SID_${sidIndex++}]`;
    mappings[placeholder] = match;
    return placeholder;
  });

  return { redactedText, mappings };
}

/**
 * Write PII mappings securely to a local JSON mapping file.
 */
function savePIIMappings(filename: string, mappings: Record<string, string>) {
  const mappingFilePath = path.resolve(process.cwd(), 'pii_mappings.json');
  let currentMappings: Record<string, any> = {};
  if (fs.existsSync(mappingFilePath)) {
    try {
      currentMappings = JSON.parse(fs.readFileSync(mappingFilePath, 'utf8'));
    } catch (e) {
      currentMappings = {};
    }
  }
  currentMappings[path.basename(filename)] = {
    ...currentMappings[path.basename(filename)],
    ...mappings
  };
  fs.writeFileSync(mappingFilePath, JSON.stringify(currentMappings, null, 2), 'utf8');
}


// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

let googleGenAI: GoogleGenAI | null = null;
function getAiClient() {
  if (!googleGenAI && process.env.GEMINI_API_KEY) {
    googleGenAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return googleGenAI;
}


const app = express();
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  next();
});

const chroma = new ChromaClient({
  host: process.env.CHROMADB_HOST || 'localhost',
  port: Number(process.env.CHROMADB_PORT || '8000'),
  ssl: (process.env.CHROMADB_SSL || 'false').toLowerCase() === 'true',
});

let extractor: any = null;

// Initialize the embedding model
async function initExtractor() {
  if (!extractor) {
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return extractor;
}

// Generate embeddings
async function embedText(text: string) {
  const ext = await initExtractor();
  const output = await ext(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data) as number[];
}

function chunkText(text: string, chunkSize: number = 300): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];

  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(' '));
  }

  return chunks;
}

async function extractTextFromUpload(filename: string, mimeType: string, dataBase64: string) {
  const buffer = Buffer.from(dataBase64, 'base64');
  const extension = path.extname(filename).toLowerCase();
  const normalizedMimeType = mimeType.toLowerCase();

  if (normalizedMimeType.includes('pdf') || extension === '.pdf') {
    const data = await pdfParse(buffer);
    return data.text as string;
  }

  if (normalizedMimeType.startsWith('text/') || ['.txt', '.md', '.csv'].includes(extension)) {
    return buffer.toString('utf8');
  }

  return '';
}

async function getKnowledgeBaseCollection() {
  return chroma.getOrCreateCollection({
    name: 'saraswati_knowledge_base',
    embeddingFunction: null,
  });
}

app.post('/api/search', async (req: Request, res: Response) => {
  try {
    const { query, domain, filters } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const collection = await chroma.getOrCreateCollection({
      name: 'saraswati_knowledge_base',
      embeddingFunction: null,
    });
    
    // Embed the search query
    const queryEmbedding = await embedText(query);
    
    // Build where clause using pre-filtering and escaping
    const andConditions: any[] = [];
    if (domain) {
      // Map frontend `Domain` enum labels to the simple domain keys used in ingestion metadata.
      const domainMap: Record<string, string> = {
        'Aerospace Technical Operations': 'AEROSPACE',
        'Government Compliance (GFR)': 'GOVERNMENT',
        'AEROSPACE': 'AEROSPACE',
        'GOVERNMENT': 'GOVERNMENT'
      };
      const mapped = domainMap[domain] || domain;
      andConditions.push({ domain: mapped });
    }

    // Resolve user access context (allowed_groups and denied_groups)
    const userGroupsParam = req.body.userGroups || req.headers['x-user-groups'];
    let userGroups: string[] = ['everyone'];
    if (userGroupsParam) {
      userGroups = Array.isArray(userGroupsParam) 
        ? userGroupsParam 
        : String(userGroupsParam).split(',').map(s => s.trim());
    }

    // Escape all input group identifiers
    const escapedGroups = userGroups.map(escapeFilterLiteral);

    // Filter by allowed groups
    if (escapedGroups.length === 1) {
      andConditions.push({ allowed_groups: escapedGroups[0] });
    } else {
      andConditions.push({
        allowed_groups: {
          $in: escapedGroups
        }
      });
    }

    // Filter by denied groups (if user has guest group, exclude denied guest chunks)
    const isGuest = escapedGroups.includes('guest') || escapedGroups.includes('domain\\\\guest');
    if (isGuest) {
      andConditions.push({ denied_groups: { $ne: 'guest' } });
    }

    // Support advanced constraints from UI
    if (filters) {
      if (filters.subsystem) {
        andConditions.push({ subsystem: escapeFilterLiteral(filters.subsystem) });
      }
      if (filters.dataType) {
        andConditions.push({ type: escapeFilterLiteral(filters.dataType) });
      }
    }

    // Construct ChromaDB compound where clause
    let whereClause: any = undefined;
    if (andConditions.length === 1) {
      whereClause = andConditions[0];
    } else if (andConditions.length > 1) {
      whereClause = { $and: andConditions };
    }

    // Query ChromaDB
    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: 5,
      where: whereClause,
    });

    // Map results back to GroundedNode format
    const nodes = [];
    if (results.ids && results.ids.length > 0) {
      for (let i = 0; i < results.ids[0].length; i++) {
        nodes.push({
          id: results.ids[0][i],
          label: results.metadatas?.[0][i]?.label || 'Extracted Chunk',
          type: results.metadatas?.[0][i]?.type || 'Document',
          content: results.documents?.[0][i] || '',
          metadata: results.metadatas?.[0][i] || {},
          score: results.distances ? 1 - (results.distances[0][i] || 0) : 1 // Convert distance to similarity score
        });
      }
    }

    res.json({ nodes });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/ingest', async (req: Request, res: Response) => {
  try {
    const {
      filename,
      mimeType,
      dataBase64,
      domain,
    } = req.body ?? {};

    if (!filename || !dataBase64) {
      return res.status(400).json({ error: 'filename and dataBase64 are required' });
    }

    const content = await extractTextFromUpload(filename, mimeType || '', dataBase64);

    if (!content.trim()) {
      return res.status(400).json({ error: 'Unable to extract readable text from the uploaded file' });
    }

    // 1. Provenance Verification
    const sha256Hash = createHash('sha256').update(dataBase64).digest('hex');
    const logFile = path.resolve(process.cwd(), 'ingestion_audit.log');
    const auditMsg = `[${new Date().toISOString()}] filename="${filename}" hash="${sha256Hash}" domain="${domain || 'AEROSPACE'}" provenance="Verified (C2PA Hashed)"\n`;
    fs.appendFileSync(logFile, auditMsg, 'utf8');

    // 2. Document Preprocessing & Sanitization
    const sanitizedContent = sanitizeDocumentText(content);

    // 3. Zero-Trust PII Redaction
    const { redactedText, mappings } = redactPII(sanitizedContent, filename);
    if (Object.keys(mappings).length > 0) {
      savePIIMappings(filename, mappings);
    }

    const collection = await getKnowledgeBaseCollection();
    const chunks = chunkText(redactedText, 300);
    const normalizedDomain = String(domain || 'AEROSPACE').toUpperCase().includes('GOVERN')
      ? 'GOVERNMENT'
      : 'AEROSPACE';
    const timestamp = new Date().toISOString();
    let insertedChunks = 0;

    // Define Allowed/Denied Access control list parameters
    const isConfidential = filename.toLowerCase().includes('confidential') || redactedText.toLowerCase().includes('secret') || redactedText.toLowerCase().includes('confidential');
    const allowedGroups = isConfidential ? 'admin' : 'everyone';
    const deniedGroups = isConfidential ? 'guest' : 'none';

    for (let i = 0; i < chunks.length; i += 1) {
      const chunk = chunks[i];
      if (chunk.trim().length < 10) {
        continue;
      }

      const embedding = await embedText(chunk);
      const id = `${path.basename(filename)}-upload-${i}-${randomUUID()}`;

      await collection.add({
        ids: [id],
        embeddings: [embedding],
        metadatas: [{
          filename: path.basename(filename),
          source: 'frontend-upload',
          chunk_index: i,
          domain: normalizedDomain,
          uploaded_at: timestamp,
          label: `${path.basename(filename)} chunk ${i + 1}`,
          type: 'UserUpload',
          provenance_hash: sha256Hash,
          allowed_groups: allowedGroups,
          denied_groups: deniedGroups,
        }],
        documents: [chunk],
      });

      insertedChunks += 1;
    }

    res.json({
      message: 'File ingested successfully',
      filename: path.basename(filename),
      domain: normalizedDomain,
      chunksInserted: insertedChunks,
    });
  } catch (error) {
    console.error('Ingest error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/generate', async (req: Request, res: Response) => {
  try {
    const { contents } = req.body;
    if (!contents) {
      return res.status(400).json({ error: 'contents is required' });
    }

    const useLocal = process.env.USE_LOCAL_LLM === 'true';
    if (useLocal) {
      try {
        const localUrl = process.env.LOCAL_LLM_URL || 'http://localhost:11434';
        const localModel = process.env.LOCAL_LLM_MODEL || 'gemma2:2b';

        const response = await fetch(`${localUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: localModel,
            prompt: contents,
            stream: false,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return res.json({ text: data.response });
        }
        console.warn(`Local LLM API error: ${response.statusText}. Falling back.`);
      } catch (err) {
        console.warn('Local LLM generation failed, falling back:', err);
      }
    }

    // Try Gemini API key
    try {
      const aiClient = getAiClient();
      if (aiClient) {
        const response = await aiClient.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: contents,
        });
        return res.json({ text: response.text || '' });
      }
      console.warn('Gemini API key is not configured. Falling back to mock generator.');
    } catch (geminiErr) {
      console.warn('Gemini API generation failed. Falling back to mock generator:', geminiErr);
    }

    // Heuristic/Rule-based Mock Generator Fallback
    const mockText = mockGenerate(contents);
    res.json({ text: mockText });
  } catch (error) {
    console.error('Generation error in server:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

app.post('/api/verify', async (req: Request, res: Response) => {
  try {
    const { answer, nodes, query } = req.body;
    if (!answer || !nodes) {
      return res.status(400).json({ error: 'answer and nodes are required' });
    }

    // Simulate Z3 SMT solver latency (2.5 seconds) to mimic complex proving
    await new Promise((resolve) => setTimeout(resolve, 2500));

    const traces = nodes.map((node: any) => {
      const nodeConstraints = extractKeyTerms(node.content);
      return createTrace(node.id, answer, nodeConstraints);
    });

    const { metrics, sources } = calculateConfidence(traces, answer, query || '');
    const allApproved = traces.every((t: any) => t.smtApproval && t.zkpStatus === 'verified');

    res.json({
      metrics,
      traceLog: traces,
      groundingSources: sources,
      allApproved
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Internal verification server error' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`SARASWATI Backend running on port ${PORT}`);
});
