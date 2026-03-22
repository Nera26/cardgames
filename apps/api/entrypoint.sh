#!/bin/sh
set -e

# ════════════════════════════════════════════════════════════════
# 🔵 Blue Cable — Database Entrypoint
# Ensures Prisma schema is synced before the API starts.
# This runs on EVERY container start (idempotent — safe to repeat).
# ════════════════════════════════════════════════════════════════

SCHEMA_PATH="./libs/shared/prisma/schema.prisma"

echo ""
echo "🔵 Blue Cable — Syncing Database Schema..."
echo "════════════════════════════════════════════"

# Step 1: Apply pending migrations (idempotent)
if [ "$NODE_ENV" = "production" ]; then
  echo "📦 Production mode: Running prisma migrate deploy..."
  npx prisma migrate deploy --schema="$SCHEMA_PATH"
else
  echo "🛠️  Dev mode: Running prisma db push..."
  npx prisma db push --schema="$SCHEMA_PATH" --accept-data-loss
fi

# Step 2: Regenerate Prisma Client (ensures client matches DB)
echo "🔧 Generating Prisma Client..."
npx prisma generate --schema="$SCHEMA_PATH"

echo "════════════════════════════════════════════"
echo "✅ Blue Cable — Database schema synced."
echo ""

# Step 3: Seed system accounts (Superadmin + House Treasury)
echo "🛡️  Seeding system accounts..."
node ./libs/shared/prisma/seed-superadmin.js

echo ""
echo "✅ Blue Cable online. System ready."
echo ""

# Hand off to the original CMD (npm run start:dev, node dist/main, etc.)
exec "$@"
