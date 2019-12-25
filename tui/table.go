package tui

import (
	"github.com/gdamore/tcell"
	"github.com/naoty/task/task"
	"github.com/rivo/tview"
)

// Table is the table view to show tasks.
type Table struct {
	*tview.Table

	rows  map[int][]*tview.TableCell
	tasks map[int]task.Task
}

// NewTable initializes and returns a new Table.
func NewTable() *Table {
	internal := tview.NewTable().
		SetSelectable(true, false).
		SetSelectedStyle(tcell.ColorDefault, tcell.Color239, tcell.AttrBold).
		SetCell(0, 0, tview.NewTableCell("Done").SetSelectable(false)).
		SetCell(0, 1, tview.NewTableCell("Title").SetSelectable(false).SetExpansion(1))

	return &Table{
		Table: internal,
		rows:  map[int][]*tview.TableCell{},
		tasks: map[int]task.Task{},
	}
}

// SetTask sets passed task to table.
func (t *Table) SetTask(task task.Task) {
	row, ok := t.rows[task.ID]

	checkbox := "[ ]"
	if task.Done {
		checkbox = tview.Escape("[x]")
	}

	if ok {
		row[0].SetText(checkbox)
		row[1].SetText(task.Title)
		return
	}

	nextRowNumber := t.GetRowCount()

	checkboxCell := tview.NewTableCell(checkbox)
	t.SetCell(nextRowNumber, 0, checkboxCell)

	titleCell := tview.NewTableCell(task.Title).SetExpansion(1)
	t.SetCell(nextRowNumber, 1, titleCell)

	t.rows[task.ID] = []*tview.TableCell{checkboxCell, titleCell}
	t.tasks[nextRowNumber] = task
}

// SetTasks sets passed tasks to table.
func (t *Table) SetTasks(tasks []task.Task) {
	for _, task := range tasks {
		t.SetTask(task)
	}
}

// SetSelectedFunc sets a function invoked with selected task when selection.
func (t *Table) SetSelectedFunc(f func(t task.Task)) {
	t.Table.SetSelectedFunc(func(row, column int) {
		task, ok := t.tasks[row]
		if !ok {
			return
		}

		f(task)
	})
}

// SetSelectionChangedFunc sets a function invoked with selected task when
// selection is changed.
func (t *Table) SetSelectionChangedFunc(f func(t task.Task)) {
	t.Table.SetSelectionChangedFunc(func(row, column int) {
		task, ok := t.tasks[row]
		if !ok {
			return
		}

		f(task)
	})
}
