# ============================================================================
# apps/web/Dockerfile - rb-plataforma-interna
# Base: Node 24 Alpine. Build do Next.js com output: 'standalone'.
# Build context esperado: raiz do monorepo.
#
# IMPORTANTE: NEXT_PUBLIC_API_URL precisa ser passada via --build-arg
# (ou via build.args no compose), pois o Next.js inlina vars NEXT_PUBLIC_*
# no bundle em build-time. Se faltar, o web vai chamar URL errada.
# ============================================================================

# ----- Stage 1: deps -----
FROM node:24-alpine AS deps
RUN apk add --no-cache tini tzdata && \
    cp /usr/share/zoneinfo/America/Bahia /etc/localtime && \
    echo "America/Bahia" > /etc/timezone && \
    npm install -g pnpm@9.12.0
WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/constants/package.json ./packages/constants/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/validators/package.json ./packages/validators/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/eslint-config/package.json ./packages/eslint-config/

RUN pnpm install --frozen-lockfile

# ----- Stage 2: builder -----
FROM node:24-alpine AS builder
RUN apk add --no-cache tzdata && \
    npm install -g pnpm@9.12.0
WORKDIR /repo

# Build args -> ENV (Next.js le NEXT_PUBLIC_* do ambiente em build-time)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /repo/packages ./packages
COPY . .

# NAO precisamos de um segundo `pnpm install` aqui:
# - A stage `deps` ja instalou tudo que o web precisa (web + shared packages).
# - O `COPY . .` traz o codigo-fonte sem mexer em node_modules (gitignored).
# - Se rodassemos `pnpm install --offline` aqui, o pnpm veria apps/api/ no
#   workspace e tentaria resolver as deps do api em modo offline, falhando
#   com ERR_PNPM_NO_OFFLINE_TARBALL.

# Build dos pacotes compartilhados primeiro
RUN pnpm --filter @rb/constants build && \
    pnpm --filter @rb/types build && \
    pnpm --filter @rb/utils build && \
    pnpm --filter @rb/validators build

# Build do web (gera apps/web/.next/standalone)
RUN pnpm --filter @rb/web build

# ----- Stage 3: runner -----
FROM node:24-alpine AS runner
RUN apk add --no-cache tini tzdata wget && \
    cp /usr/share/zoneinfo/America/Bahia /etc/localtime && \
    echo "America/Bahia" > /etc/timezone

WORKDIR /app

ENV NODE_ENV=production
ENV TZ=America/Bahia
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
# Sem isso, o server.js do Next.js standalone escuta apenas em localhost
# e o Traefik (em outra rede) nao consegue alcancar.
ENV HOSTNAME=0.0.0.0

# Standalone gera um snapshot auto-suficiente. Tres pastas obrigatorias:
COPY --from=builder /repo/apps/web/public ./apps/web/public
COPY --from=builder /repo/apps/web/.next/standalone ./
COPY --from=builder /repo/apps/web/.next/static ./apps/web/.next/static

RUN chown -R node:node /app

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000/ || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/web/server.js"]