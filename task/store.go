package task

// Store is where tasks are managed.
type Store struct {
	tasks       map[int]Task
	EventStream chan Event
}

// Event represents an event for Store.
type Event struct {
	Task *Task
	Op   Op
}

// Op represents an operation to tasks.
type Op int

// These values represent operations to tasks.
const (
	Create Op = 1 << iota
	Update
)

// NewStore initializes and returns a new Store.
func NewStore() *Store {
	return &Store{
		tasks:       map[int]Task{},
		EventStream: make(chan Event),
	}
}

// Close closes internal channels.
func (s *Store) Close() {
	close(s.EventStream)
}

// List returns a saved tasks.
func (s *Store) List() []Task {
	list := []Task{}
	for _, task := range s.tasks {
		list = append(list, task)
	}
	return list
}

// SaveFrom starts a goroutine saving tasks generated from FileInfo and
// returns a channel where events pass through.
func (s *Store) SaveFrom(fileInfoStream <-chan FileInfo) {
	go func() {
		for {
			select {
			case info, ok := <-fileInfoStream:
				if !ok {
					return
				}

				newTask, _ := Parse(info)
				s.save(newTask)
			}
		}
	}()
}

func (s *Store) save(task Task) {
	old, ok := s.tasks[task.ID]

	if !ok {
		s.tasks[task.ID] = task
		s.EventStream <- Event{Task: &task, Op: Create}
	}

	if ok && old != task {
		s.tasks[task.ID] = task
		s.EventStream <- Event{Task: &task, Op: Update}
	}
}
