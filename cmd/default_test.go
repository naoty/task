package cmd

import (
	"bytes"
	"io/ioutil"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestRunDefaultWithoutArgs(t *testing.T) {
	command := &Default{
		Version:     "0.0.0",
		Reader:      bytes.NewBufferString(""),
		Writer:      ioutil.Discard,
		ErrorWriter: ioutil.Discard,
	}
	code := command.Run([]string{})
	assert.Equal(t, 0, code)
}

func TestRunDefaultWithVersionFlag(t *testing.T) {
	expected := "0.0.0\n"

	testcases := []struct {
		in  string
		out string
	}{
		{"-v", expected},
		{"--version", expected},
	}

	for _, testcase := range testcases {
		buf := bytes.NewBufferString("")
		command := &Default{
			Version:     "0.0.0",
			Reader:      bytes.NewBufferString(""),
			Writer:      buf,
			ErrorWriter: ioutil.Discard,
		}
		_ = command.Run([]string{testcase.in})
		assert.Equal(t, expected, buf.String())
	}
}
