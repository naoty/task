package cmd

import (
	"bytes"
	"io/ioutil"
	"testing"

	"github.com/stretchr/testify/assert"
)

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
		dummyIO := IO{
			Reader:      bytes.NewBufferString(""),
			Writer:      buf,
			ErrorWriter: ioutil.Discard,
		}
		command := &Default{
			IO:      dummyIO,
			Version: "0.0.0",
		}
		_ = command.Run([]string{testcase.in})
		assert.Equal(t, expected, buf.String())
	}
}
