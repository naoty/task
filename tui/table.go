package tui

import (
	"sort"

	"github.com/gdamore/tcell"
	"github.com/naoty/task/task"
	"github.com/rivo/tview"
)

// Table is the table view to show tasks.
type Table struct {
	*tview.Table

	tasks []task.Task

	// cells indexed by row number
	rows map[int][]*tview.TableCell
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
		tasks: []task.Task{},
		rows:  map[int][]*tview.TableCell{},
	}
}

// SetTask append passed task to internal tasks.
func (t *Table) SetTask(_task task.Task) {
	newTask := true

	for i, task := range t.tasks {
		if task.ID == _task.ID {
			t.tasks[i] = _task
			newTask = false
			break
		}
	}

	if newTask {
		t.tasks = append(t.tasks, _task)
	}

	sort.Sort(task.SortedByID(t.tasks))
}

// DrawTasks sets the content of tasks to cells.
func (t *Table) DrawTasks() {
	for i, task := range t.tasks {
		// exclude header row
		row := i + 1

		cells, ok := t.rows[row]
		if !ok {
			checkbox := "[ ]"
			if task.Done {
				checkbox = tview.Escape("[x]")
			}
			checkboxCell := tview.NewTableCell(checkbox)
			t.SetCell(row, 0, checkboxCell)

			titleCell := tview.NewTableCell(task.Title).SetExpansion(1)
			t.SetCell(row, 1, titleCell)

			cells = append(cells, checkboxCell, titleCell)
			t.rows[row] = cells

			continue
		}

		if task.Done {
			cells[0].SetText(tview.Escape("[x]"))
		} else {
			cells[0].SetText("[ ]")
		}
		cells[1].SetText(task.Title)
	}
}

// SetSelectedFunc sets a function invoked with selected task when selection.
func (t *Table) SetSelectedFunc(f func(t task.Task)) {
	t.Table.SetSelectedFunc(func(row, column int) {
		if row-1 >= len(t.tasks) || row-1 < 0 {
			return
		}

		f(t.tasks[row-1])
	})
}

// SetSelectionChangedFunc sets a function invoked with selected task when
// selection is changed.
func (t *Table) SetSelectionChangedFunc(f func(t task.Task)) {
	t.Table.SetSelectionChangedFunc(func(row, column int) {
		if row-1 >= len(t.tasks) || row-1 < 0 {
			return
		}

		f(t.tasks[row-1])
	})
}
