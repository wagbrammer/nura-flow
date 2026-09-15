# ------------------------------------------------------------
# Dockerfile – Render‑ready (Multi‑stage)
# ------------------------------------------------------------
# 1️⃣ Base – apenas dependências de produção
FROM node:20-slim AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev 2>/dev/null || npm ci   # instala prod deps

# ------------------------------------------------------------
# 2️⃣ Build – precisa de devDependencies (vite, esbuild, etc.)
# ------------------------------------------------------------
FROM base AS build
RUN npm ci                                 # instala tudo (dev + prod)
COPY . .                                    # copia código fonte
RUN npm run build                           # gera dist/ + dist/server.cjs

# ------------------------------------------------------------
# 3️⃣ Production – apenas o que realmente será usado
# ------------------------------------------------------------
FROM node:20-slim AS production
WORKDIR /app

# 1) Dependências de produção (já otimizadas)
COPY --from=base /app/node_modules ./node_modules

# 2) Artefatos do build
COPY --from=build /app/dist ./dist                 # frontend estático
COPY --from=build /app/dist/server.cjs ./server.cjs   # bundle do backend

# 3) Configurações e scripts auxiliares
COPY --from=build /app/package*.json ./
COPY --from=build /app/.env* ./
COPY --from=build /app/scripts ./scripts

# 4) Diretório que o código usa para gravar JSONs (meetings, tasks, …)
RUN mkdir -p /app/server/data

# 5) Expor a porta que o Render espera (3000 padrão)
EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000

# ------------------------------------------------------------
# 6️⃣ Entrypoint – executa o bundle compilado
# ------------------------------------------------------------
CMD ["node", "server.cjs", "--production"]
