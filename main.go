package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/mitchellh/go-homedir"

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

	dir, err := tasksDir()
	if err != nil {
		fmt.Fprintln(os.Stderr, err.Error())
		return 1
	}

	err = ensureDirExist(dir)
	if err != nil {
		fmt.Fprintln(os.Stderr, err.Error())
		return 1
	}

	store := task.NewStore()
	if err != nil {
		fmt.Fprintln(os.Stderr, err.Error())
		return 1
	}
	defer store.Close()

	watcher.Start()
	watcher.WatchDir(dir)
	store.SaveFrom(watcher.FileInfoStream)

	command := &cmd.Default{
		IO:      io,
		Version: version,
		Store:   store,
		OpenHandler: func(path string) {
			openTaskEditor(path)
		},
	}
	code := command.Run(os.Args[1:])
	return code
}

func tasksDir() (string, error) {
	dir := os.Getenv("TASK_PATH")
	if dir == "" {
		home, err := homedir.Dir()
		if err != nil {
			return "", err
		}

		dir = filepath.Join(home, ".tasks")
	}

	return dir, nil
}

func ensureDirExist(dir string) error {
	info, err := os.Stat(dir)

	if os.IsExist(err) {
		return nil
	}

	if info != nil && info.IsDir() {
		return nil
	}

	err = os.Mkdir(dir, 0755)
	if err != nil {
		return err
	}

	return nil
}

func openTaskEditor(filepath string) error {
	path := os.Getenv("TASK_EDITOR")
	if path == "" {
		path = os.Getenv("EDITOR")
	}

	cmd := exec.Command(path, filepath)
	return cmd.Run()
}
