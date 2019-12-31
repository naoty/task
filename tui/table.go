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
func (t *Table) SetTask(newTask task.Task) {
	for i, task := range t.tasks {
		if task.ID == newTask.ID && newTask.Done {
			t.tasks = append(t.tasks[:i], t.tasks[i+1:]...)
			return
		}

		if task.ID == newTask.ID && !newTask.Done {
			t.tasks[i] = newTask
			return
		}
	}

	if !newTask.Done {
		t.tasks = append(t.tasks, newTask)
	}
}

// SortTasks sort tasks.
func (t *Table) SortTasks() {
	sort.Sort(task.SortedByID(t.tasks))
}

// DrawTasks sets the content of tasks to cells and
// removes unused rows.
func (t *Table) DrawTasks() {
	for i, task := range t.tasks {
		// exclude header row
		row := i + 1
		cells, ok := t.rows[row]

		if ok {
			cells[0].SetText("[ ]")
			cells[1].SetText(task.Title)
			continue
		}

		checkbox := tview.NewTableCell("[ ]")
		t.SetCell(row, 0, checkbox)

		title := tview.NewTableCell(task.Title)
		t.SetCell(row, 1, title)

		t.rows[row] = []*tview.TableCell{checkbox, title}
	}

	for row := 1 + len(t.tasks); row < t.Table.GetRowCount(); row++ {
		t.Table.RemoveRow(row)
		delete(t.rows, row)
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
