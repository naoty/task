package task

// Task represents a task.
type Task struct {
	ID    int
	Title string
	Done  bool
}

// New returns a new Task with passed id and title.
func New(id int, title string) Task {
	return Task{
		ID:    id,
		Title: title,
		Done:  false,
	}
}
