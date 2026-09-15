# Multi-stage build for Node.js + Vite + Express app
FROM node:20-slim AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev 2>/dev/null || npm ci

# Build frontend
FROM base AS build
RUN npm install -g pnpm
COPY . .
RUN npm run build

# Production stage
FROM node:20-slim AS production
WORKDIR /app

# Copy only necessary files
COPY --from=base /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=base /app/server.ts ./server.ts
COPY --from=base /app/package*.json ./
COPY --from=base /app/.env* ./
COPY --from=build /app/scripts ./scripts

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })"

CMD ["node", "server.ts"]
