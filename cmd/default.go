package cmd

import (
	"fmt"
	"io"

	"github.com/spf13/pflag"
)

// Default is the default command of this application.
type Default struct {
	Version     string
	Reader      io.Reader
	Writer      io.Writer
	ErrorWriter io.Writer
}

// Run starts a default command with arguments.
func (d *Default) Run(args []string) int {
	flagset := pflag.NewFlagSet("", pflag.ContinueOnError)
	versionFlag := flagset.BoolP("version", "v", false, "")

	err := flagset.Parse(args)
	if err != nil {
		fmt.Fprintln(d.ErrorWriter, err.Error())
		return 1
	}

	if *versionFlag {
		fmt.Fprintln(d.Writer, d.Version)
		return 0
	}

	return 0
}
