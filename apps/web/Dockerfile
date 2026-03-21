FROM node:20-alpine

WORKDIR /usr/src/app

# Copy root manifest
COPY package*.json ./

# Copy workspace manifests
COPY libs/shared/package.json ./libs/shared/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Install dependencies (hoisted to root)
RUN npm install

# Copy source code
COPY . .

# Expose Web port (Next.js default 3000, we will map it)
EXPOSE 3000

WORKDIR /usr/src/app/apps/web
# Start in dev mode to avoid build step for speed/dev flexibility
CMD ["npm", "run", "dev"]
