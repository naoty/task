version := $$(git describe --tags)

build: test
	go build -ldflags "-X main.version=$(version)" -o bin/task

test:
	go test ./...

install: build
	cp bin/task ${GOPATH}/bin/task
