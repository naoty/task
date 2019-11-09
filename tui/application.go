package tui

import (
	"github.com/rivo/tview"
)

// Application is the entry point of TUI application.
type Application struct {
	*tview.Application
}

// NewApplication initializes and returns a new Application.
func NewApplication() *Application {
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
