package tui

import (
	"github.com/gdamore/tcell"
	"github.com/naoty/task/task"
	"github.com/rivo/tview"
)

// Application is the entry point of TUI application.
type Application struct {
	*tview.Application

	flex         *tview.Flex
	table        *Table
	note         *Note
	store        *task.Store
	selectedTask *task.Task
	openHandler  func(path string)
	noteVisible  bool
}

// NewApplication initializes and returns a new Application.
func NewApplication(store *task.Store) *Application {
	resetStyles()

	internal := tview.NewApplication()

	table := NewTable()
	note := NewNote()

	flex := tview.NewFlex().
		SetDirection(tview.FlexRow).
		AddItem(table, 0, 1, true)

	internal.SetRoot(flex, true)

	return &Application{
		Application:  internal,
		flex:         flex,
		table:        table,
		note:         note,
		store:        store,
		selectedTask: nil,
		openHandler:  nil,
		noteVisible:  false,
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

				task := *event.Task
				app.table.SetTask(task)

				app.QueueUpdateDraw(func() {
					app.table.DrawTasks()

					if app.selectedTask != nil && (*app.selectedTask).ID == task.ID {
						app.note.SetText(task.Body)
					}
				})
			}
		}
	}()
}

// SetOpenHandler sets a function to handle open event with file path.
func (app *Application) SetOpenHandler(handler func(string)) {
	app.openHandler = handler
}

// Start starts a TUI application.
func (app *Application) Start() error {
	app.clearDrawnColors()

	app.table.SetSelectedFunc(func(task task.Task) {
		if app.selectedTask == nil {
			app.selectedTask = &task
		}

		if app.noteVisible {
			app.flex.RemoveItem(app.note)
			app.note.SetText("")
			app.noteVisible = false
		} else {
			app.note.SetText((*app.selectedTask).Body)
			app.flex.AddItem(app.note, 0, 2, false)
			app.noteVisible = true
		}
	})

	app.table.SetSelectionChangedFunc(func(task task.Task) {
		app.selectedTask = &task

		if app.noteVisible {
			app.note.SetText((*app.selectedTask).Body)
		}
	})

	app.table.SetInputCapture(func(event *tcell.EventKey) *tcell.EventKey {
		if event.Key() == tcell.KeyRune && event.Rune() == 'o' {
			if app.selectedTask == nil {
				return event
			}

			path, ok := app.store.LookupPath((*app.selectedTask).ID)
			if !ok {
				return event
			}

			if app.openHandler != nil {
				app.openHandler(path)
			}
		}

		return event
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
