package tui

import (
	"github.com/gdamore/tcell"
	"github.com/naoty/task/task"
	"github.com/rivo/tview"
)

// Application is the entry point of TUI application.
type Application struct {
	*tview.Application

	flex     *tview.Flex
	table    *Table
	note     *Note
	selected bool
}

// VisibleTaskNumber represents a number of visible tasks when a note is
// displayed.
var VisibleTaskNumber = 5

// NewApplication initializes and returns a new Application.
func NewApplication(store *task.Store) *Application {
	resetStyles()

	internal := tview.NewApplication()

	table := NewTable()
	note := NewNote()

	flex := tview.NewFlex().
		SetDirection(tview.FlexRow).
		AddItem(table, VisibleTaskNumber+1, 0, true)

	table.SetTasks(store.List())

	internal.SetRoot(flex, true)

	return &Application{
		Application: internal,
		flex:        flex,
		table:       table,
		note:        note,
		selected:    false,
	}
}

// StartAutoReload starts a goroutine to reload TUI with tasks received from
// passed channel.
func (app *Application) StartAutoReload(eventStream <-chan task.Event) {
	go func() {
		for {
			select {
			case event, ok := <-eventStream:
				if !ok {
					return
				}

				app.QueueUpdateDraw(func() {
					app.table.SetTask(*event.Task)
				})
			}
		}
	}()
}

// Start starts a TUI application.
func (app *Application) Start() error {
	app.clearDrawnColors()

	app.table.SetSelectedFunc(func(task task.Task) {
		if app.selected {
			app.flex.RemoveItem(app.note)
			app.note.SetText("")
			app.selected = false
		} else {
			app.note.SetText(task.Body)
			app.flex.AddItem(app.note, 0, 1, false)
			app.selected = true
		}
	})

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
