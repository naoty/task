package cmd

import "io"

// IO represents I/O to command.
type IO struct {
	Reader      io.Reader
	Writer      io.Writer
	ErrorWriter io.Writer
}
