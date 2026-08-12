@echo off
echo ============================================================
echo 🚀 DEPLOYING IRSARGO METHOD 3 (DOCKER COMPOSABLE PRODUCTION)
echo ============================================================

echo 📦 Step 1: Building production static frontend assets...
call npm run build

echo 🛑 Step 2: Stopping previous Docker containers if active...
call docker compose -f deploy/docker-compose.prod.yml down

echo 🏗️ Step 3: Launching IRSARGO multi-user stack...
call docker compose -f deploy/docker-compose.prod.yml up -d --build

echo.
echo ============================================================
echo ✅ IRSARGO PRODUCTION DEPLOYMENT COMPLETE!
echo ============================================================
echo 🔗 Frontend App URL : http://localhost (or http://^<YOUR_SERVER_IP^>)
echo 🔗 Express API      : http://localhost/api/
echo 🔗 Keycloak Admin   : http://localhost:8080
echo 🔗 ChromaDB API     : http://localhost:8000
echo ============================================================
pause
