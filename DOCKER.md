# Docker Configuration Guide

This project has **two Docker setups**: Development (with hot reload) and Production (optimized builds).

---

## Quick Start

### Development Mode (Recommended for coding)

```bash
# Start all services with hot reload
docker-compose -f docker-compose.dev.yml up

# Rebuild if you added new npm packages
docker-compose -f docker-compose.dev.yml up --build
```

**Features:**
- ✅ Instant hot reload (edit code → see changes immediately)
- ✅ File watching enabled
- ✅ Database GUI at http://localhost:8080
- ✅ Redis GUI at http://localhost:8081
- ✅ All dev dependencies available

### Production Mode (For deployment/testing)

```bash
# Build and start optimized containers (localhost)
docker-compose -f docker-compose.prod.yml up --build

# Run in background
docker-compose -f docker-compose.prod.yml up -d --build
```

### Server Deployment (Remote access)

> ⚠️ **Important:** `NEXT_PUBLIC_API_URL` is baked into the frontend at **build time**.
> You must set `API_URL` before building so remote browsers can reach the API.

```bash
# Option 1: Inline
API_URL=http://YOUR_SERVER_IP:3001 docker-compose -f docker-compose.prod.yml up --build -d

# Option 2: .env file in project root
echo "API_URL=http://YOUR_SERVER_IP:3001" > .env
docker-compose -f docker-compose.prod.yml up --build -d
```

Replace `YOUR_SERVER_IP` with your server's public IP or domain name.

**Features:**
- ✅ Optimized multi-stage builds
- ✅ Smaller Docker images
- ✅ Production-grade settings
- ✅ No development tools
- ✅ Resource limits enabled

---

## Access Points

| Service | Development | Production |
|---------|-------------|------------|
| **Frontend (Next.js)** | http://localhost:3000 | http://localhost:3000 |
| **API (NestJS)** | http://localhost:3001 | http://localhost:3001 |
| **Database GUI (Adminer)** | http://localhost:8080 | ❌ Not available |
| **Redis GUI** | http://localhost:8081 | ❌ Not available |
| **PostgreSQL** | localhost:5432 | localhost:5432 |
| **Redis** | localhost:6379 | localhost:6379 |

---

## Common Commands

### Start/Stop

```bash
# Development
docker-compose -f docker-compose.dev.yml up        # Start (foreground)
docker-compose -f docker-compose.dev.yml up -d     # Start (background)
docker-compose -f docker-compose.dev.yml down      # Stop all

# Production
docker-compose -f docker-compose.prod.yml up --build -d   # Build & start
docker-compose -f docker-compose.prod.yml down            # Stop all
```

### View Logs

```bash
# All services
docker-compose -f docker-compose.dev.yml logs -f

# Specific service
docker-compose -f docker-compose.dev.yml logs -f api
docker-compose -f docker-compose.dev.yml logs -f web
```

### Rebuild Containers

```bash
# Rebuild everything (after package.json changes)
docker-compose -f docker-compose.dev.yml up --build

# Rebuild specific service
docker-compose -f docker-compose.dev.yml up --build api
```

### Database Commands

```bash
# Run migrations (inside container)
docker exec cardgames-api npx prisma db push

# Open Prisma Studio
docker exec -it cardgames-api npx prisma studio

# Reset database
docker exec cardgames-api npx prisma migrate reset
```

### Automated Workflows (🔵 Blue Cable)

The API container **automatically syncs the database schema** on every startup via `entrypoint.sh`:

- **Development**: Runs `prisma db push` (fast, schema-only sync)
- **Production**: Runs `prisma migrate deploy` (applies tracked migrations)

This means you **never need to manually run `prisma db push`** after a fresh deploy or volume wipe.

**Check migration logs:**
```bash
# See the Blue Cable sync output
docker-compose -f docker-compose.dev.yml logs api | grep "Blue Cable"
```

**Manual recovery (if needed):**
```bash
# Run the deploy-fix script
./scripts/deploy-fix.sh dev    # For development
./scripts/deploy-fix.sh prod   # For production
```

---

## Troubleshooting

### Changes not reflecting?

**Development mode:** Changes should reflect automatically. If not:
```bash
# Restart the specific service
docker-compose -f docker-compose.dev.yml restart web
docker-compose -f docker-compose.dev.yml restart api
```

**Production mode:** You must rebuild:
```bash
docker-compose -f docker-compose.prod.yml up --build
```

### Module not found errors?

New npm packages require a rebuild:
```bash
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up --build
```

### Database connection issues?

Wait for PostgreSQL to be healthy:
```bash
docker-compose -f docker-compose.dev.yml logs postgres
```

### Clear everything and start fresh

```bash
# Stop and remove all containers, networks, volumes
docker-compose -f docker-compose.dev.yml down -v

# Rebuild from scratch
docker-compose -f docker-compose.dev.yml up --build
```

---

## File Structure

```
cardgames/
├── docker-compose.dev.yml      # Development config (USE THIS)
├── docker-compose.prod.yml     # Production config
├── docker-compose.yml          # Legacy (can be removed)
├── DOCKER.md                   # This documentation
├── apps/
│   ├── api/
│   │   ├── Dockerfile.dev      # API development image
│   │   ├── Dockerfile.prod     # API production image
│   │   └── entrypoint.sh       # 🔵 Blue Cable auto-sync script
│   └── web/
│       ├── Dockerfile.dev      # Web development image
│       └── Dockerfile.prod     # Web production image
├── libs/
│   └── shared/                 # Shared code (mounted in dev)
│       └── prisma/
│           └── schema.prisma   # Database schema (source of truth)
└── scripts/
    └── deploy-fix.sh           # 🔵 Manual recovery script
```

---

## Environment Variables

### Development (set in docker-compose.dev.yml)
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXT_PUBLIC_API_URL` | API URL for frontend |
| `CHOKIDAR_USEPOLLING` | Enable file watching on Windows |

### Production (set in docker-compose.prod.yml or .env)
| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_PASSWORD` | poker_password | Database password |
| `API_URL` | http://localhost:3001 | **Build-time.** Public URL of the API for remote browsers |

---

## When to Use Which?

| Scenario | Use |
|----------|-----|
| Writing code | `docker-compose.dev.yml` |
| Debugging | `docker-compose.dev.yml` |
| Testing before deploy | `docker-compose.prod.yml` |
| Staging/Production | `docker-compose.prod.yml` |
| CI/CD pipeline | `docker-compose.prod.yml` |
