package main

import (
	"os"
	"time"

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
	taskStream := make(chan task.Task)
	defer close(taskStream)

	go func() {
		select {
		case <-time.After(3 * time.Second):
			taskStream <- task.New(1, "updated")
			taskStream <- task.New(3, "new task")
		}
	}()

	command := &cmd.Default{
		IO:         io,
		Version:    version,
		TaskStream: taskStream,
	}
	code := command.Run(os.Args[1:])
	return code
}
