package main

import (
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"

	"github.com/naoty/task/cmd"
	"github.com/naoty/task/task"
)

var version = ""

func main() {
	stdio := cmd.IO{
		Reader:      os.Stdin,
		Writer:      os.Stdout,
		ErrorWriter: os.Stderr,
	}
	code := runDefault(stdio)
	os.Exit(code)
}

func runDefault(io cmd.IO) int {
	watcher, err := NewWatcher()
	if err != nil {
		fmt.Fprintln(os.Stderr, err.Error())
		return 1
	}
	defer watcher.Close()

	store, err := loadTasks("./examples")
	if err != nil {
		fmt.Fprintln(os.Stderr, err.Error())
		return 1
	}

	fileInfoStream := watcher.Start()
	watcher.Watch("./examples")

	taskStream := task.Pipeline(fileInfoStream)

	command := &cmd.Default{
		IO:         io,
		Version:    version,
		Store:      store,
		TaskStream: taskStream,
	}
	code := command.Run(os.Args[1:])
	return code
}

func loadTasks(dir string) (*task.Store, error) {
	store := task.NewStore()

	err := filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if info.IsDir() || !strings.HasSuffix(path, ".md") {
			return nil
		}

		content, err := ioutil.ReadFile(path)
		if err != nil {
			return err
		}

		task, err := task.Parse(task.FileInfo{Content: string(content), Path: path})
		if err != nil {
			return err
		}

		store.Tasks = append(store.Tasks, task)

		return err
	})

	if err != nil {
		return nil, err
	}

	return store, nil
}
