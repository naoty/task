package main

import (
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"

	"github.com/fsnotify/fsnotify"
	"github.com/naoty/task/task"
)

// Watcher watches changes of files.
type Watcher struct {
	*fsnotify.Watcher
}

// NewWatcher initializes and returns a new Watcher.
func NewWatcher() (*Watcher, error) {
	internal, err := fsnotify.NewWatcher()
	if err != nil {
		return nil, err
	}

	return &Watcher{internal}, nil
}

// Start starts a goroutine to watch changes of files and send the contents of
// them to returned channel.
func (watcher *Watcher) Start() <-chan task.FileInfo {
	fileInfoStream := make(chan task.FileInfo)
	go func() {
		defer close(fileInfoStream)
		for {
			select {
			case event, ok := <-watcher.Events:
				if !ok {
					return
				}

				content, _ := ioutil.ReadFile(event.Name)
				if len(content) == 0 {
					continue
				}

				fileInfoStream <- task.FileInfo{
					Content: string(content),
					Path:    event.Name,
				}
			case _, ok := <-watcher.Errors:
				if !ok {
					return
				}
			}
		}
	}()
	return fileInfoStream
}

// Watch adds files under passed dir to targets.
func (watcher *Watcher) Watch(dir string) error {
	filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if info.IsDir() || !strings.HasSuffix(path, ".md") {
			return nil
		}

		err = watcher.Add(path)
		return err
	})

	return nil
}
