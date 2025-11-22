IMAGE_NAME := ghcr.io/orkward/wormface
GIT_TAG := $(shell git describe --tags --always)

.PHONY: all build push

all: build push

build:
	docker build \
	  --build-arg GIT_TAG=$(GIT_TAG) \
	  --platform linux/amd64,linux/arm64 \
	  -t $(IMAGE_NAME):$(GIT_TAG) \
	  -t $(IMAGE_NAME):latest .

push: build
	docker push $(IMAGE_NAME):$(GIT_TAG)
	docker push $(IMAGE_NAME):latest

generate-swagger:
	swag init -g cmd/scraper-server/main.go -o internal/scraper-server/docs
