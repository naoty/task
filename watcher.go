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

	FileInfoStream chan task.FileInfo
}

// NewWatcher initializes and returns a new Watcher.
func NewWatcher() (*Watcher, error) {
	internal, err := fsnotify.NewWatcher()
	if err != nil {
		return nil, err
	}

	return &Watcher{
		Watcher:        internal,
		FileInfoStream: make(chan task.FileInfo),
	}, nil
}

// Close closes internal channels.
func (watcher *Watcher) Close() {
	watcher.Watcher.Close()
	close(watcher.FileInfoStream)
}

// Start starts a goroutine to watch changes of files and send the contents of
// them to returned channel.
func (watcher *Watcher) Start() {
	go func() {
		for {
			select {
			case event, ok := <-watcher.Events:
				if !ok {
					return
				}

				if event.Op&fsnotify.Create == fsnotify.Create {
					watcher.watchFile(event.Name)
				}

				if event.Op&fsnotify.Remove == fsnotify.Remove {
					watcher.Remove(event.Name)
					continue
				}

				content, _ := ioutil.ReadFile(event.Name)
				if len(content) == 0 {
					continue
				}

				watcher.FileInfoStream <- task.FileInfo{
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
}

// WatchDir adds passed dir and files to targets.
func (watcher *Watcher) WatchDir(dir string) error {
	err := watcher.Add(dir)
	if err != nil {
		return err
	}

	err = filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if info.IsDir() {
			return nil
		}

		return watcher.watchFile(path)
	})

	return err
}

func (watcher *Watcher) watchFile(path string) error {
	if !strings.HasSuffix(path, ".md") {
		return nil
	}

	content, err := ioutil.ReadFile(path)
	if err != nil {
		return err
	}

	// asynchronously send FileInfos to prevent main goroutine
	// from waiting until TUI receives FileInfos from this channel.
	go func() {
		watcher.FileInfoStream <- task.FileInfo{
			Content: string(content),
			Path:    path,
		}
	}()

	return watcher.Add(path)
}
