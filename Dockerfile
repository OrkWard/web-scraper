# syntax=docker/dockerfile:1-labs
FROM node:22-bookworm
ARG GIT_TAG
LABEL org.opencontainers.image.version=$GIT_TAG
WORKDIR /app
COPY --parents pnpm-lock.yaml pnpm-workspace.yaml trpc-server twitter ./

RUN npm i -g pnpm@9 \
    && pnpm i --frozen-lockfile \
    && pnpm run -F trpc-server build

WORKDIR /app/trpc-server
CMD ["npm", "run", "start"]
