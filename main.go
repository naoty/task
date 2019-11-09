package main

import (
	"os"

	"github.com/naoty/task/cmd"
)

func main() {
	command := &cmd.Default{
		Reader:      os.Stdin,
		Writer:      os.Stdout,
		ErrorWriter: os.Stderr,
	}
	code := command.Run(os.Args[1:])
	os.Exit(code)
}
