import fs from 'fs';
import path from 'path';
import { ChromaClient } from 'chromadb';
import { pipeline } from '@xenova/transformers';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const chroma = new ChromaClient({
  host: process.env.CHROMADB_HOST || 'localhost',
  port: Number(process.env.CHROMADB_PORT || '8000'),
  ssl: (process.env.CHROMADB_SSL || 'false').toLowerCase() === 'true',
});

let extractor: any = null;

async function initExtractor() {
  if (!extractor) {
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return extractor;
}

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

async function extractTextFromFile(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();
  
  try {
    if (ext === '.pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } else if (['.txt', '.md', '.csv'].includes(ext)) {
      return fs.readFileSync(filePath, 'utf8');
    }
  } catch (e) {
    console.error(`Failed to read or parse file ${filePath}`, e);
  }
  
  return '';
}

async function processFile(filePath: string, collection: any) {
  console.log(`Processing file: ${filePath}`);
  const content = await extractTextFromFile(filePath);
  
  if (!content.trim()) {
    console.log(`Skipping empty or unreadable file: ${filePath}`);
    return;
  }
  
  const chunks = chunkText(content, 300);
  console.log(`Split into ${chunks.length} chunks`);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (chunk.trim().length < 10) continue; // Skip very short chunks

    const embedding = await embedText(chunk);
    
    // Create unique ID
    const baseName = path.basename(filePath);
    const id = `${baseName}-chunk-${i}`;

    await collection.add({
      ids: [id],
      embeddings: [embedding],
      metadatas: [{
        filename: baseName,
        source: filePath,
        chunk_index: i,
        domain: baseName.toLowerCase().includes('gfr') ? 'GOVERNMENT' : 'AEROSPACE'
      }],
      documents: [chunk],
    });
    
    if (i > 0 && i % 50 === 0) {
      console.log(`  Inserted ${i}/${chunks.length} chunks...`);
    }
  }
  console.log(`Finished processing: ${filePath}`);
}

async function walkDir(dir: string): Promise<string[]> {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(await walkDir(filePath));
    } else {
      results.push(filePath);
    }
  }
  return results;
}

async function run() {
  const datasetDir = path.join(process.cwd(), 'datasets');
  
  if (!fs.existsSync(datasetDir)) {
    console.log(`Dataset directory not found at ${datasetDir}`);
    return;
  }

  try {
    await chroma.deleteCollection({ name: "saraswati_knowledge_base" });
    console.log("Deleted existing collection 'saraswati_knowledge_base'");
  } catch (e) {
    console.log("No existing collection to delete or failed to delete.");
  }

  const collection = await chroma.getOrCreateCollection({
    name: "saraswati_knowledge_base",
    embeddingFunction: null,
  });
  console.log("Connected to ChromaDB Collection");

  const allFiles = await walkDir(datasetDir);
  console.log(`Found ${allFiles.length} total files. Identifying processable files...`);

  for (const filePath of allFiles) {
    const ext = path.extname(filePath).toLowerCase();
    if (['.pdf', '.txt', '.md', '.csv'].includes(ext)) {
      await processFile(filePath, collection);
    }
  }

  console.log("Ingestion complete!");
}

run().catch(console.error);
