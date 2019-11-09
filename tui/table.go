package tui

import (
	"github.com/gdamore/tcell"
	"github.com/naoty/task/task"
	"github.com/rivo/tview"
)

// Table is the table view to show tasks.
type Table struct {
	*tview.Table
}

// NewTable initializes and returns a new Table.
func NewTable() *Table {
	internal := tview.NewTable().
		SetSelectable(true, false).
		SetSelectedStyle(tcell.ColorDefault, tcell.Color239, tcell.AttrBold).
		SetCell(0, 0, tview.NewTableCell("Done").SetSelectable(false)).
		SetCell(0, 1, tview.NewTableCell("Title").SetSelectable(false).SetExpansion(1))

	return &Table{internal}
}

// Update replaces cells with new ones with passed tasks.
func (t *Table) Update(tasks []task.Task) {
	t.removeBodyRows()

	for i, task := range tasks {
		row := i + 1

		if task.Done {
			t.SetCellSimple(row, 0, tview.Escape("[x]"))
		} else {
			t.SetCellSimple(row, 0, "[ ]")
		}

		t.SetCell(row, 1, tview.NewTableCell(task.Title).SetExpansion(1))
	}
}

// removeBody removes rows other than header.
func (t *Table) removeBodyRows() {
	rows := t.GetRowCount()
	for i := 1; i < rows; i++ {
		t.RemoveRow(i)
	}
}
