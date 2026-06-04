import express from 'express';
import cors from 'cors';
import { ChromaClient } from 'chromadb';
import { pipeline } from '@xenova/transformers';
import type { Request, Response } from 'express';

const app = express();
app.use(cors());
app.use(express.json());

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

app.post('/api/search', async (req: Request, res: Response) => {
  try {
    const { query, domain, filters } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const collection = await chroma.getOrCreateCollection({
      name: "saraswati_knowledge_base",
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`SARASWATI Backend running on port ${PORT}`);
});
