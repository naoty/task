package main

import (
	"os"

	"github.com/naoty/task/cmd"
)

var version = ""

func main() {
	stdio := cmd.IO{
		Reader:      os.Stdin,
		Writer:      os.Stdout,
		ErrorWriter: os.Stderr,
	}
	command := &cmd.Default{
		IO:      stdio,
		Version: version,
	}
	code := command.Run(os.Args[1:])
	os.Exit(code)
}
