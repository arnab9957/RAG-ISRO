import express from 'express';
import cors from 'cors';
import { ChromaClient } from 'chromadb';
import { pipeline } from '@xenova/transformers';
import type { Request, Response } from 'express';
import path from 'path';
import { randomUUID } from 'crypto';
import { createRequire } from 'module';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { extractKeyTerms, createTrace, calculateConfidence } from '../src/lib/verify';

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
    
    // Build where clause based on domain and filters
    const where: any = {};
    if (domain) {
      // Map frontend `Domain` enum labels to the simple domain keys used in ingestion metadata.
      // Frontend sends values like 'Aerospace Technical Operations' (see src/types.ts).
      const domainMap: Record<string, string> = {
        'Aerospace Technical Operations': 'AEROSPACE',
        'Government Compliance (GFR)': 'GOVERNMENT',
        'AEROSPACE': 'AEROSPACE',
        'GOVERNMENT': 'GOVERNMENT'
      };
      const mapped = domainMap[domain] || domain;
      where.domain = mapped;
    }
    // Additional filters can be added here based on advanced filters

    // Query ChromaDB
    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: 5,
      where: Object.keys(where).length > 0 ? where : undefined,
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

    const collection = await getKnowledgeBaseCollection();
    const chunks = chunkText(content, 300);
    const normalizedDomain = String(domain || 'AEROSPACE').toUpperCase().includes('GOVERN')
      ? 'GOVERNMENT'
      : 'AEROSPACE';
    const timestamp = new Date().toISOString();
    let insertedChunks = 0;

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

      if (!response.ok) {
        throw new Error(`Local LLM API error: ${response.statusText}`);
      }

      const data = await response.json();
      res.json({ text: data.response });
    } else {
      const aiClient = getAiClient();
      if (!aiClient) {
        return res.status(500).json({ error: 'Gemini API key is not configured on the backend' });
      }

      const response = await aiClient.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: contents,
      });

      res.json({ text: response.text || '' });
    }
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

app.post('/api/verify', async (req: Request, res: Response) => {
  try {
    const { answer, nodes } = req.body;
    if (!answer || !nodes) {
      return res.status(400).json({ error: 'answer and nodes are required' });
    }

    // Simulate Z3 SMT solver latency (2.5 seconds) to mimic complex proving
    await new Promise((resolve) => setTimeout(resolve, 2500));

    const traces = nodes.map((node: any) => {
      const nodeConstraints = extractKeyTerms(node.content);
      return createTrace(node.id, answer, nodeConstraints);
    });

    const { metrics, sources } = calculateConfidence(traces, answer);
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
