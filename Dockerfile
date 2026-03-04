# Stage 1: Install dependencies (shared by builder and worker)
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build Next.js application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Production Next.js server (standalone output)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]

# Stage 4: Background worker (refreshes Redis cache via PandaScore)
# No build step needed — tsx executes TypeScript directly
FROM node:20-alpine AS worker
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY src ./src
COPY worker ./worker
COPY tsconfig.json ./
CMD ["npx", "tsx", "worker/refresh.ts"]
