IMAGE_NAME := ghcr.io/orkward/web-scraper
GIT_TAG := $(shell git describe --tags --always)

.PHONY: all build push clean

all: build push

build:
	docker build \
	  --build-arg GIT_TAG=$(GIT_TAG) \
	  --platform linux/amd64,linux/arm64 \
	  -t $(IMAGE_NAME):$(GIT_TAG) \
	  -t $(IMAGE_NAME):latest .

push:
	docker push $(IMAGE_NAME):$(GIT_TAG)
	docker push $(IMAGE_NAME):latest

clean:
	find . -name "node_modules" -type d -prune -exec rm -rf {} +
