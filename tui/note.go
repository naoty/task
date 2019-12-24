package tui

import (
	"github.com/gdamore/tcell"
	"github.com/rivo/tview"
)

// Note is the text view for note of task.
type Note struct {
	*tview.TextView
}

// NewNote initializes and returns a new Note.
func NewNote() *Note {
	textView := tview.NewTextView()

	// Draw a border at top of text view
	textView.SetDrawFunc(func(screen tcell.Screen, x int, y int, width int, height int) (int, int, int, int) {
		for cx := x; cx < x+width; cx++ {
			screen.SetContent(
				cx,
				y,
				tview.BoxDrawingsLightHorizontal,
				[]rune{tview.BoxDrawingsLightHorizontal},
				tcell.StyleDefault.Foreground(tcell.ColorWhite),
			)
		}

		return x, y + 1, width, height - 1
	})

	return &Note{textView}
}

// SetText sets passed text into view.
func (n *Note) SetText(text string) {
	n.TextView.SetText(text)
}
