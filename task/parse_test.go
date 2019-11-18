package task

import (
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestParse(t *testing.T) {
	testcases := []struct {
		in  string
		out Task
	}{
		{"---\ntitle: dummy\n---\n\ndummy", Task{Title: "dummy", Done: false}},
	}

	for _, testcase := range testcases {
		task, _ := Parse(testcase.in)
		assert.Equal(t, testcase.out, task)
	}
}

func TestSplitFrontMatter(t *testing.T) {
	testcases := []struct {
		in          string
		frontMatter string
		body        string
	}{
		{"---\na: 1\n---\n\ndummy", "a: 1", "dummy"},
		{"---\na: 1\nb: 2\n---\n\ndummy", "a: 1\nb: 2", "dummy"},
	}

	for _, testcase := range testcases {
		frontMatter, body, _ := splitFrontMatter(testcase.in)
		assert.Equal(t, testcase.frontMatter, frontMatter)
		assert.Equal(t, testcase.body, body)
	}
}
