# ============================================================================
# apps/api/Dockerfile - rb-plataforma-interna
# Base: Node 24 Alpine (musl). Inclui Chromium para Puppeteer (PDF).
# Build context esperado: raiz do monorepo (rb-plataforma-interna/).
# ============================================================================

# ----- Stage 1: deps -----
FROM node:24-alpine AS deps
RUN apk add --no-cache openssl tini tzdata && \
    cp /usr/share/zoneinfo/America/Bahia /etc/localtime && \
    echo "America/Bahia" > /etc/timezone && \
    npm install -g pnpm@9.12.0
WORKDIR /repo

# Copia apenas manifestos de pacote para cachear pnpm install
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/constants/package.json ./packages/constants/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/validators/package.json ./packages/validators/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/eslint-config/package.json ./packages/eslint-config/

RUN pnpm install --frozen-lockfile

# ----- Stage 2: builder -----
FROM node:24-alpine AS builder
RUN apk add --no-cache openssl tzdata && \
    npm install -g pnpm@9.12.0
WORKDIR /repo

COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /repo/packages ./packages
COPY . .

# NAO precisamos de um segundo `pnpm install` aqui:
# - A stage `deps` ja instalou tudo que o api precisa (api + shared packages).
# - O `COPY . .` traz o codigo-fonte sem mexer em node_modules (gitignored).
# - Se rodassemos `pnpm install --offline` aqui, o pnpm veria apps/web/ no
#   workspace (que veio com o COPY . .) e tentaria resolver as deps do web
#   em modo offline, falhando com ERR_PNPM_NO_OFFLINE_TARBALL.

# Build dos packages compartilhados (na ordem certa)
RUN pnpm --filter @rb/constants build && \
    pnpm --filter @rb/types build && \
    pnpm --filter @rb/utils build && \
    pnpm --filter @rb/validators build

# Gera Prisma Client (engine para alpine/musl, mesma plataforma do runner)
# DATABASE_URL dummy: `prisma generate` NAO conecta no banco, so valida o schema
# e gera o client TS. Em runtime o DATABASE_URL real vem do .env via compose.
# Sem isso, o Prisma reclama "Argument 'url' is missing" em build-time.
RUN DATABASE_URL="postgresql://placeholder:placeholder@placeholder:5432/placeholder?schema=public" \
    pnpm --filter @rb/api exec prisma generate

# Build da API (gera apps/api/dist/)
RUN pnpm --filter @rb/api build

# ----- Stage 3: runner -----
FROM node:24-alpine AS runner
RUN apk add --no-cache \
    openssl tini tzdata wget \
    chromium nss freetype harfbuzz ca-certificates ttf-freefont && \
    cp /usr/share/zoneinfo/America/Bahia /etc/localtime && \
    echo "America/Bahia" > /etc/timezone && \
    npm install -g pnpm@9.12.0

WORKDIR /app

ENV NODE_ENV=production
ENV TZ=America/Bahia
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copia o monorepo construido. Manter a estrutura preserva os symlinks pnpm.
COPY --from=builder /repo/package.json ./
COPY --from=builder /repo/pnpm-lock.yaml ./
COPY --from=builder /repo/pnpm-workspace.yaml ./
COPY --from=builder /repo/.npmrc ./
COPY --from=builder /repo/turbo.json ./
COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/apps/api ./apps/api
COPY --from=builder /repo/packages ./packages

# Diretorio de uploads (volume montado pelo compose em /app/apps/api/uploads)
RUN mkdir -p /app/apps/api/uploads && chown -R node:node /app

USER node
WORKDIR /app/apps/api
EXPOSE 4000

# Healthcheck via /api/health
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:4000/api/health || exit 1

# Entrypoint roda migrate deploy automaticamente, depois inicia o server.
# Nota: dist/src/server.js (nao dist/server.js) porque o tsc preserva a
# estrutura de pastas quando ha arquivos compilados fora de src/ (ex.: prisma/
# seed, prisma.config.ts), o que faz o rootDir ser a raiz de apps/api/.
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && exec node dist/src/server.js"]