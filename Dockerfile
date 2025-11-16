FROM golang:1.25.4-alpine AS builder
ARG GIT_TAG
LABEL org.opencontainers.image.version=$GIT_TAG
WORKDIR /app
COPY . .
RUN go mod download \
    && go build -ldflags="-w -s" -o /bin/scraper-server ./cmd/scraper-server

FROM alpine:latest
COPY --from=builder /bin/scraper-server /bin/server
EXPOSE 8080
CMD ["server"]
