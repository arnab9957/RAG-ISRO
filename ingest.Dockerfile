FROM node:20-slim

# Create app directory
WORKDIR /app

# Copy package files first to install deps (cached layer)
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --no-audit --prefer-offline

# Copy application source
COPY . .

# Default env (can be overridden by compose)
ENV CHROMADB_HOST=chromadb
ENV CHROMADB_PORT=8000
ENV CHROMADB_URL=http://chromadb:8000

# Wait for ChromaDB to become ready, then run the TypeScript ingest script
CMD ["sh", "-c", "until node --input-type=module -e \"const url = process.env.CHROMADB_URL || 'http://chromadb:8000'; const v2 = await fetch(url + '/api/v2/heartbeat'); if (v2.ok) process.exit(0); const v1 = await fetch(url + '/api/v1/heartbeat'); process.exit(v1.ok ? 0 : 1);\"; do echo 'Waiting for ChromaDB...'; sleep 2; done; exec npx tsx scripts/ingest.ts"]
