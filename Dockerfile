# Multi-stage build for Node.js + Vite + Express app
FROM node:20-slim AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev 2>/dev/null || npm ci

# Build frontend - precisa de TODAS as dependências (incluindo devDependencies)
FROM base AS build
WORKDIR /app
COPY package*.json ./
# Instala TUDO (produção + desenvolvimento) para poder rodar o build
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-slim AS production
WORKDIR /app

# Copia apenas o necessário da fase base (node_modules de produção)
COPY --from=base /app/node_modules ./node_modules
# Copia o resultado do build (dist, server.ts, scripts, .env*)
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.ts ./server.ts
COPY --from=build /app/package*.json ./
COPY --from=build /app/.env* ./
COPY --from=build /app/scripts ./scripts

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })"

CMD ["node", "server.ts"]
