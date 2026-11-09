# Payload 3.93 вимагає Node ≥ 22.23.4 — node:22-alpine тягне останній 22.x
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat

# --- deps: встановлюємо залежності ---
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- builder: збираємо Next.js (output: 'standalone') ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Заглушки: payload.config.ts вимагає ці змінні, але під час білду БД не потрібна
# (сторінки не пререндеряться — див. generateStaticParams у layout.tsx).
ARG PAYLOAD_SECRET
ARG DATABASE_URI
ENV PAYLOAD_SECRET=$PAYLOAD_SECRET
ENV DATABASE_URI=$DATABASE_URI

# NEXT_PUBLIC_* вшиваються в клієнтський бандл саме тут, на етапі білду (ISS-003)
ARG NEXT_PUBLIC_SERVER_URL
ARG NEXT_PUBLIC_GA_ID
ARG NEXT_PUBLIC_CLARITY_ID
ENV NEXT_PUBLIC_SERVER_URL=$NEXT_PUBLIC_SERVER_URL
ENV NEXT_PUBLIC_GA_ID=$NEXT_PUBLIC_GA_ID
ENV NEXT_PUBLIC_CLARITY_ID=$NEXT_PUBLIC_CLARITY_ID

RUN npm run build

# --- runner: мінімальний образ без devDependencies, не від root ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
# media/ монтується з хоста (docker-compose.yml); restart.sh виставляє власника node (uid 1000)
RUN mkdir -p /app/media && chown node:node /app/media

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=30s \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "server.js"]
