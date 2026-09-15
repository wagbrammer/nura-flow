# ============================================================
# Multi‑stage Dockerfile – otimizado para Render
# ============================================================
FROM node:20-slim AS base
WORKDIR /app
COPY package*.json ./
# Instala apenas dependências de produção
RUN npm ci --omit=dev 2>/dev/null || npm ci

# ---- Fase de build ----
FROM base AS build
RUN npm ci
COPY . .
RUN npm run build   # gera dist/ + server.cjs

# ---- Fase de produção ----
FROM node:20-slim AS production
WORKDIR /app

# 1) node_modules de produção (já otimizados na base)
COPY --from=base /app/node_modules ./node_modules

# 2) Resultados do build
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.cjs ./server.cjs

# 3) Configurações e scripts
COPY --from=build /app/package*.json ./
COPY --from=build /app/.env* ./
COPY --from=build /app/scripts ./scripts

# 4) Pasta de dados necessária pelas rotas de API
RUN mkdir -p /app/server/data   # ← Cria diretório se não existir

# 5) Expondo porta
EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000

# 6) Iniciar aplicação
CMD ["node", "server.cjs", "--production"]
