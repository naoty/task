package cmd

import (
	"fmt"
	"io"
	"strings"

	"github.com/naoty/task/tui"
	"github.com/spf13/pflag"
)

var helpMessage = `
Usage:
  task
  task -h | --help
  task -v | --version

Options
  -h --help     Show this message.
  -v --version  Show version.
`

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
	helpFlag := flagset.BoolP("help", "h", false, "")
	versionFlag := flagset.BoolP("version", "v", false, "")

	err := flagset.Parse(args)
	if err != nil {
		fmt.Fprintln(d.ErrorWriter, err.Error())
		return 1
	}

	if *helpFlag {
		fmt.Fprintln(d.Writer, strings.Trim(helpMessage, "\n"))
		return 0
	}

	if *versionFlag {
		fmt.Fprintln(d.Writer, d.Version)
		return 0
	}

	err = d.startApplication()
	if err != nil {
		fmt.Fprintln(d.ErrorWriter, err.Error())
		return 1
	}

	return 0
}

func (d *Default) startApplication() error {
	app := tui.NewApplication()
	return app.Start()
}
