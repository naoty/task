package task

import (
	"bufio"
	"bytes"
	"path/filepath"
	"strconv"
	"strings"

	"gopkg.in/yaml.v2"
)

// Parse converts passed text into a task.
func Parse(file FileInfo) (Task, error) {
	frontMatter, body, err := splitFrontMatter(file.Content)
	if err != nil {
		return Task{}, err
	}

	id, err := parseID(file.Path)
	if err != nil {
		return Task{}, err
	}

	task := Task{ID: id, Body: body}
	err = yaml.Unmarshal([]byte(frontMatter), &task)
	if err != nil {
		return Task{}, err
	}

	return task, nil
}

func parseID(path string) (int, error) {
	basename := filepath.Base(path)
	extension := filepath.Ext(path)
	id := strings.TrimRight(basename, extension)
	return strconv.Atoi(id)
}

func splitFrontMatter(text string) (string, string, error) {
	scanner := bufio.NewScanner(bytes.NewBufferString(text))
	scanner.Split(func(data []byte, atEOF bool) (int, []byte, error) {
		if atEOF && len(data) == 0 {
			return 0, nil, nil
		}

		if atEOF {
			return len(data), data, nil
		}

		if i := bytes.Index(data, []byte("---")); i >= 0 {
			// skip "---" and return text before "---" as token
			return i + 3, data[0:i], nil
		}

		return 0, nil, nil
	})

	tokens := []string{}
	for scanner.Scan() {
		if err := scanner.Err(); err != nil {
			return "", "", err
		}

		token := strings.Trim(scanner.Text(), "\n")

		if token == "" {
			continue
		}

		tokens = append(tokens, token)
	}

	switch len(tokens) {
	case 0:
		return "", "", nil
	case 1:
		return "", tokens[0], nil
	default:
		return tokens[0], strings.Join(tokens[1:], "---"), nil
	}
}
