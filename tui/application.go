package tui

import (
	"github.com/gdamore/tcell"
	"github.com/rivo/tview"
)

// Application is the entry point of TUI application.
type Application struct {
	*tview.Application
}

// NewApplication initializes and returns a new Application.
func NewApplication() *Application {
	resetStyles()

	internal := tview.NewApplication()

	// NOTE: Here is dummy code to demonstrate the application.
	box := tview.NewBox().SetBorder(true).SetTitle("Hello, world!")
	internal.SetRoot(box, true)

	return &Application{internal}
}

// Start starts a TUI application.
func (app *Application) Start() error {
	return app.Run()
}

// resetStyles reset default styles for components.
// Each components doesn't use colors configured by terminal by default.
func resetStyles() {
	tview.Styles = tview.Theme{
		PrimitiveBackgroundColor:    tcell.ColorDefault,
		ContrastBackgroundColor:     tcell.ColorDefault,
		MoreContrastBackgroundColor: tcell.ColorDefault,
		BorderColor:                 tcell.ColorDefault,
		TitleColor:                  tcell.ColorDefault,
		GraphicsColor:               tcell.ColorDefault,
		PrimaryTextColor:            tcell.ColorDefault,
		SecondaryTextColor:          tcell.ColorDefault,
		TertiaryTextColor:           tcell.ColorDefault,
		InverseTextColor:            tcell.ColorDefault,
		ContrastSecondaryTextColor:  tcell.ColorDefault,
	}
}
