# =============================================================================
# DOCKERFILE - ECOSHOP (MULTI-STAGE BUILD)
# =============================================================================
# Multi-stage Dockerfile to optimize the final image size and security.
#
# Stages:
# 1. deps      - Installs dependencies (including devDependencies)
# 2. builder   - Builds the Next.js application
# 3. runner    - Final production image (minimal and secure)
# 4. migrator  - Separate stage for database migrations
#
# Why multi-stage?
# - The final image has no build tools (Node.js is enough)
# - Drastically reduces the image size (from ~1GB to ~200MB)
# - Improves security (removes devDependencies, source maps, etc.)
# =============================================================================

# -----------------------------------------------------------------------------
# STAGE 1: DEPENDENCIES
# -----------------------------------------------------------------------------
# Installs all dependencies (including devDependencies)
# Used by the builder stage to build the application
FROM node:25-alpine@sha256:bdf2cca6fe3dabd014ea60163eca3f0f7015fbd5c7ee1b0e9ccb4ced6eb02ef4 AS deps

# Sets the working directory inside the container
WORKDIR /app

# Copies the dependency manifest files
# Kept in separate COPY layers to take advantage of the Docker cache
COPY package.json package-lock.json ./

# Installs all dependencies (including devDependencies such as TypeScript)
# --frozen-lockfile: guarantees package-lock.json is not modified
RUN npm ci --frozen-lockfile

# -----------------------------------------------------------------------------
# STAGE 2: BUILDER (COMPILATION)
# -----------------------------------------------------------------------------
# Builds the Next.js application for production
FROM node:25-alpine@sha256:bdf2cca6fe3dabd014ea60163eca3f0f7015fbd5c7ee1b0e9ccb4ced6eb02ef4 AS builder

WORKDIR /app

# Copies the dependencies already installed in the previous stage
COPY --from=deps /app/node_modules ./node_modules

# Copies the application source code
COPY . .

# Sets environment variables for the build
# NEXT_PUBLIC_* are embedded in the client bundle
ENV NEXT_PUBLIC_SITE_URL=""

# Generates the Prisma client from the schema
# Needed before compilation so TypeScript recognizes the types
RUN npx prisma generate

# Builds the Next.js application
# Output: .next/ (standalone mode with standalone output)
RUN npm run build

# -----------------------------------------------------------------------------
# STAGE 3: RUNNER (PRODUCTION)
# -----------------------------------------------------------------------------
# Final production image - minimal and optimized
FROM node:25-alpine@sha256:bdf2cca6fe3dabd014ea60163eca3f0f7015fbd5c7ee1b0e9ccb4ced6eb02ef4 AS runner

WORKDIR /app

# Environment settings for production
ENV NODE_ENV=production
# Disables Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Creates a non-root user for security
# node:22-alpine already ships with a 'node' user (UID 1000)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copies the public static files (served via /public)
COPY --from=builder /app/public ./public

# Copies the Next.js build (standalone mode)
# The standalone output includes all the necessary dependencies
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copies the Prisma client and the schema to run in production
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Copies the entrypoint script
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Switches to the non-root user
USER nextjs

# Port exposed by Next.js
EXPOSE 3000

# Healthcheck to verify the application is responding
# Checks every 30 seconds, 10-second timeout, 3 consecutive failures = unhealthy
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"

# Entrypoint that runs migrations before starting the server
ENTRYPOINT ["./docker-entrypoint.sh"]

# Default command: starts the Next.js server
# The 0.0.0.0 host is required to accept external connections
CMD ["node", "server.js"]

# -----------------------------------------------------------------------------
# STAGE 4: MIGRATOR (DATABASE MIGRATIONS)
# -----------------------------------------------------------------------------
# Separate stage to run Prisma migrations
# Useful in CI/CD pipelines and docker-compose to guarantee an up-to-date schema
FROM node:25-alpine@sha256:bdf2cca6fe3dabd014ea60163eca3f0f7015fbd5c7ee1b0e9ccb4ced6eb02ef4 AS migrator

WORKDIR /app

# Copies dependencies and source code
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generates the Prisma client
RUN npx prisma generate

# Default command: runs migrations
# Can be overridden in docker-compose if needed
CMD ["npx", "prisma", "migrate", "deploy"]