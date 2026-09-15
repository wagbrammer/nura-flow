# ------------------------------------------------------------
# Multi‑stage Dockerfile – Render ready
# ------------------------------------------------------------

# ---------- 1️⃣ Base (apenas dependências de produção) ----------
FROM node:20-slim AS base
WORKDIR /app
COPY package*.json ./
# Instala apenas as dependências de produção (omitindo dev)
RUN npm ci --omit=dev 2>/dev/null || npm ci

# ---------- 2️⃣ Build (precisa de devDependencies) ----------
FROM base AS build
WORKDIR /app
# Copia todo o código fonte (exceto o que está em .dockerignore)
COPY . .
# Instala todas as dependências (dev + prod) para que Vite/Esbuild funcionem
RUN npm ci
# Gera o bundle de produção
RUN npm run build

# ---------- 3️⃣ Production (imagem final) ----------
FROM node:20-slim AS production
WORKDIR /app

# 1) Dependências de produção (já otimizadas na fase base)
COPY --from=base /app/node_modules ./node_modules

# 2) Artefatos do build (frontend + backend bundle)
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server

# 3) Configurações e scripts auxiliares
COPY --from=build /app/package*.json ./
COPY --from=build /app/.env* ./
COPY --from=build /app/scripts ./scripts

# 4) Diretório persistente que o código usa para gravar JSONs
RUN mkdir -p /app/server/data

# 5) Expor a porta que o Render espera (padrão 3000)
EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000

# 6) Entrypoint – inicia a aplicação a partir do bundle compilado
CMD ["node", "server.cjs", "--production"]
