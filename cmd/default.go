package cmd

import (
	"fmt"
	"io"
)

// Default is the default command of this application.
type Default struct {
	Reader      io.Reader
	Writer      io.Writer
	ErrorWriter io.Writer
}

// Run starts a default command with arguments.
func (d *Default) Run(args []string) int {
	fmt.Fprintln(d.Writer, "TODO: implement features")
	return 0
}
