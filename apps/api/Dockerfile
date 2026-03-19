FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /usr/src/app

# Copy root manifest
COPY package*.json ./

# Copy workspace manifests
COPY libs/shared/package.json ./libs/shared/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
# Copy Prisma schema early for generation
COPY libs/shared/prisma ./libs/shared/prisma/

# Configure NPM to retry on network failure and increase timeouts
RUN npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm install --no-audit

# Copy source code
COPY . .

# Generate Prisma Client (critical for API)
WORKDIR /usr/src/app
RUN npx prisma generate --schema=./libs/shared/prisma/schema.prisma

# CRITICAL: Reset WORKDIR to monorepo root
# NestJS monorepo expects to run from root and outputs to dist/apps/api/main
WORKDIR /usr/src/app

# Expose API port
EXPOSE 3000

# Start command (Dev mode for now as requested)
# Run via the root package.json script that targets the api project
CMD ["npm", "run", "start:dev", "--workspace=apps/api"]
