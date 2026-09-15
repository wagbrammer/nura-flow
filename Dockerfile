
# ============================================================
# Multi‑stage build for Node.js + Vite + Express app
# ============================================================
FROM node:20-slim AS base
WORKDIR /app
COPY package*.json ./
# Instala apenas dependências de produção (mais rápido)
RUN npm ci --omit=dev 2>/dev/null || npm ci

# ------------------------------------------------------------
# Etapa de build – precisamos de TODAS as dependências
# ------------------------------------------------------------
FROM base AS build
WORKDIR /app
# Instala TUDO (produção + dev) para que o Vite/Esbuild funcionem
RUN npm ci
COPY . .
# Gera o frontend otimizado e o bundle do backend
RUN npm run build   # → cria dist/, dist/server.cjs, dist/server/index.js, etc.

# ------------------------------------------------------------
# Etapa de produção – apenas o necessário para rodar
# ------------------------------------------------------------
FROM node:20-slim AS production
WORKDIR /app

# 1️⃣ node_modules de produção (já otimizados na base)
COPY --from=base /app/node_modules ./node_modules

# 2️⃣ Resultado do build do frontend
COPY --from=build /app/dist ./dist

# 3️⃣ Bundle do backend compilado (o que realmente será executado)
COPY --from=build /app/dist/server.cjs ./server.cjs

# 4️⃣ Arquivos de configuração que podem variar por ambiente
COPY --from=build /app/package*.json ./
COPY --from=build /app/.env* ./
COPY --from=build /app/scripts ./scripts

# Porta que o Render expõe automaticamente
EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000

# Health check simples (opcional, mas recomendado)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })"

# ▶️ Comando de inicialização: executa o bundle compilado
CMD ["node", "server.cjs", "--production"]
