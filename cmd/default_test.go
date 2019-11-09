package cmd

import (
	"bytes"
	"io/ioutil"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestRunWithoutArgs(t *testing.T) {
	command := &Default{
		Reader:      bytes.NewBufferString(""),
		Writer:      ioutil.Discard,
		ErrorWriter: ioutil.Discard,
	}
	code := command.Run([]string{})
	assert.Equal(t, 0, code)
}
