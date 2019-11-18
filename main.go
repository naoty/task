package main

import (
	"fmt"
	"os"

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

	fileInfoStream := watcher.Start()
	watcher.Watch("./examples")

	taskStream := task.Pipeline(fileInfoStream)

	command := &cmd.Default{
		IO:         io,
		Version:    version,
		TaskStream: taskStream,
	}
	code := command.Run(os.Args[1:])
	return code
}
