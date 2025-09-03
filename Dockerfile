# syntax=docker/dockerfile:1-labs
FROM node:22-bookworm
ARG GIT_TAG
LABEL org.opencontainers.image.version=$GIT_TAG
WORKDIR /app
COPY --parents pnpm-lock.yaml pnpm-workspace.yaml trpc-server twitter package.json ./

RUN npm i -g pnpm@9 \
    && pnpm i --frozen-lockfile \
    && pnpm run -F trpc-server -F twitter-scraper build \
    && find . -name "node_modules" -type d -prune -exec rm -rf '{}' + \
    && pnpm i --prod --frozen-lockfile

WORKDIR /app/trpc-server
CMD ["node", "./dist/index.js"]
