package task

// Task represents a task.
type Task struct {
	ID    int
	Title string
	Done  bool
	Body  string
}

// New returns a new Task with passed id and title.
func New(id int, title string) Task {
	return Task{
		ID:    id,
		Title: title,
		Done:  false,
		Body:  "",
	}
}

// SortedByID represents tasks slice sorted by ID.
type SortedByID []Task

func (tasks SortedByID) Len() int {
	return len(tasks)
}

func (tasks SortedByID) Swap(i, j int) {
	tasks[i], tasks[j] = tasks[j], tasks[i]
}

func (tasks SortedByID) Less(i, j int) bool {
	return tasks[i].ID < tasks[j].ID
}
