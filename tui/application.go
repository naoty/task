package tui

import (
	"github.com/gdamore/tcell"
	"github.com/naoty/task/task"
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

	table := NewTable()
	table.Update([]task.Task{
		task.New(1, "Start TUI application"),
		task.New(2, "Show tasks"),
	})

	internal.SetRoot(table, true)

	return &Application{internal}
}

// Start starts a TUI application.
func (app *Application) Start() error {
	app.clearDrawnColors()
	return app.Run()
}

// https://github.com/rivo/tview/issues/270
func (app *Application) clearDrawnColors() {
	app.SetBeforeDrawFunc(func(s tcell.Screen) bool {
		s.Clear()
		return false
	})
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
