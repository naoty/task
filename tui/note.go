package tui

import "github.com/rivo/tview"

// Note is the text view for note of task.
type Note struct {
	*tview.TextView
}

// NewNote initializes and returns a new Note.
func NewNote() *Note {
	textView := tview.NewTextView()

	return &Note{textView}
}

// SetText sets passed text into view.
func (n *Note) SetText(text string) {
	n.TextView.SetText(text)
}
