FROM node:24-alpine AS base
RUN apk add --no-cache openssl tini tzdata chromium nss freetype harfbuzz ca-certificates ttf-freefont && \
    cp /usr/share/zoneinfo/America/Bahia /etc/localtime && \
    echo "America/Bahia" > /etc/timezone && \
    npm install -g pnpm@9.12.0 turbo
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

FROM base AS deps
WORKDIR /repo
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml .npmrc turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/constants/package.json ./packages/constants/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/validators/package.json ./packages/validators/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/eslint-config/package.json ./packages/eslint-config/
RUN pnpm install --frozen-lockfile || pnpm install

FROM base AS build
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/api/node_modules ./apps/api/node_modules
COPY . .
RUN pnpm --filter @rb/constants --filter @rb/types --filter @rb/utils --filter @rb/validators build
RUN pnpm --filter @rb/api exec prisma generate
RUN pnpm --filter @rb/api build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV TZ=America/Bahia
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
RUN apk add --no-cache openssl tini tzdata chromium nss freetype harfbuzz ca-certificates ttf-freefont && \
    cp /usr/share/zoneinfo/America/Bahia /etc/localtime && \
    echo "America/Bahia" > /etc/timezone && \
    npm install -g pnpm@9.12.0
COPY --from=build /repo/apps/api/dist ./dist
COPY --from=build /repo/apps/api/prisma ./prisma
COPY --from=build /repo/apps/api/package.json ./package.json
COPY --from=build /repo/apps/api/node_modules ./node_modules
COPY --from=build /repo/node_modules/.pnpm ./node_modules/.pnpm
COPY --from=build /repo/packages/constants/dist ./node_modules/@rb/constants/dist
COPY --from=build /repo/packages/types/dist ./node_modules/@rb/types/dist
COPY --from=build /repo/packages/utils/dist ./node_modules/@rb/utils/dist
COPY --from=build /repo/packages/validators/dist ./node_modules/@rb/validators/dist
RUN mkdir -p /app/uploads && chown -R node:node /app
USER node
EXPOSE 4000
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/server.js"]
