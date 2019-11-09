package tui

import (
	"github.com/gdamore/tcell"
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
		SetSelectedStyle(tcell.ColorDefault, tcell.Color239, tcell.AttrBold)

	// NOTE: Here is dummy code to demonstrate the table view.
	internal.
		SetCell(0, 0, tview.NewTableCell("Done").SetSelectable(false)).
		SetCell(0, 1, tview.NewTableCell("Title").SetSelectable(false).SetExpansion(1)).
		SetCellSimple(1, 0, tview.Escape("[x]")).SetCell(1, 1, tview.NewTableCell("Start TUI application").SetExpansion(1)).
		SetCellSimple(2, 0, "[ ]").SetCell(2, 1, tview.NewTableCell("Show tasks").SetExpansion(1))

	return &Table{internal}
}
