#!/bin/bash
echo "============================================================"
echo "🚀 DEPLOYING IRSARGO METHOD 3 (DOCKER COMPOSABLE PRODUCTION)"
echo "============================================================"

# Step 1: Install node modules and build Vite frontend
echo "📦 Step 1: Building production static frontend assets..."
npm run build

# Step 2: Stop any existing containers
echo "🛑 Step 2: Stopping previous Docker containers if active..."
docker compose -f deploy/docker-compose.prod.yml down

# Step 3: Build & Launch full production stack
echo "🏗️ Step 3: Launching IRSARGO multi-user stack (Nginx, Express, ChromaDB, Keycloak)..."
docker compose -f deploy/docker-compose.prod.yml up -d --build

echo ""
echo "============================================================"
echo "✅ IRSARGO PRODUCTION DEPLOYMENT COMPLETE!"
echo "============================================================"
echo "🔗 Frontend App URL : http://localhost (or http://<YOUR_SERVER_IP>)"
echo "🔗 Express API      : http://localhost/api/"
echo "🔗 Keycloak Admin   : http://localhost:8080"
echo "🔗 ChromaDB API     : http://localhost:8000"
echo "============================================================"
