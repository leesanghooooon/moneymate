# syntax=docker/dockerfile:1

# 1) deps
FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# 2) build
FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
# 설정 파일들을 먼저 복사 (변경 빈도가 낮아 캐시 효율 향상)
COPY package*.json ./
COPY tsconfig.json ./
COPY next.config.ts ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY eslint.config.mjs ./
# 소스 파일 복사
COPY src ./src
COPY public ./public
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 3) runner
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV TZ=Asia/Seoul
# Next standalone 산출물만 복사
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
# Swagger JSDoc을 위해 소스 파일도 복사 (API 라우트의 JSDoc 주석 읽기용)
COPY --from=build /app/src ./src
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=5 CMD node -e "fetch('http://127.0.0.1:3000').then(()=>process.exit(0)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
