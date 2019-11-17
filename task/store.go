package task

// Store is where tasks are managed.
type Store struct {
	Tasks []Task
}

// NewStore initializes and returns a new Store.
func NewStore() *Store {
	return &Store{
		Tasks: []Task{
			New(1, "Start TUI application"),
			New(2, "Show tasks"),
		},
	}
}
