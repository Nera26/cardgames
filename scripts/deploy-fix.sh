#!/bin/bash
# ════════════════════════════════════════════════════════════════
# 🔵 Blue Cable — Deploy Fix Script
# Automates the prisma db push + container restart sequence.
# Usage: ./scripts/deploy-fix.sh [dev|prod]
# ════════════════════════════════════════════════════════════════

set -euo pipefail

ENV="${1:-dev}"
SCHEMA_PATH="./libs/shared/prisma/schema.prisma"

if [ "$ENV" = "prod" ]; then
  COMPOSE_FILE="docker-compose.prod.yml"
else
  COMPOSE_FILE="docker-compose.dev.yml"
fi

echo ""
echo "🔵 Blue Cable — Deploy Fix (${ENV})"
echo "════════════════════════════════════════"

# 1. Check poker_db health
echo "⏳ Checking poker_db health..."
DB_STATUS=$(docker ps --filter name=poker_db --format "{{.Names}}: {{.Status}}" 2>/dev/null || echo "NOT FOUND")
echo "   $DB_STATUS"

if echo "$DB_STATUS" | grep -q "NOT FOUND"; then
  echo "❌ poker_db container not found. Is docker-compose running?"
  echo "   Run: docker-compose -f $COMPOSE_FILE up -d"
  exit 1
fi

# 2. Wait for cardgames-api container
echo "⏳ Waiting for cardgames-api..."
for i in $(seq 1 30); do
  if docker ps --filter name=cardgames-api --format "{{.Names}}" | grep -q cardgames-api; then
    echo "   ✅ cardgames-api is running"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "   ❌ Timed out waiting for cardgames-api"
    exit 1
  fi
  printf "   Waiting... (%d/30)\n" "$i"
  sleep 2
done

# 3. Apply schema
if [ "$ENV" = "prod" ]; then
  echo "🔧 Applying migrations (prisma migrate deploy)..."
  docker exec cardgames-api npx prisma migrate deploy --schema="$SCHEMA_PATH"
else
  echo "🔧 Pushing schema (prisma db push)..."
  docker exec cardgames-api npx prisma db push --schema="$SCHEMA_PATH"
fi

# 4. Regenerate client
echo "🔧 Regenerating Prisma Client..."
docker exec cardgames-api npx prisma generate --schema="$SCHEMA_PATH"

# 5. Restart API
echo "🔄 Restarting API container..."
docker-compose -f "$COMPOSE_FILE" restart api

echo ""
echo "════════════════════════════════════════"
echo "✅ Blue Cable online. Schema deployed."
echo "   Verify: docker-compose -f $COMPOSE_FILE logs --tail=20 api"
echo ""
