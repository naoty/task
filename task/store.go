package task

// Store is where tasks are managed.
type Store struct {
	// tasks indexed by id
	tasks map[int]Task

	// fileInfos indexed by task id
	fileInfos map[int]FileInfo

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
		fileInfos:   map[int]FileInfo{},
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

// LookupPath returns a file path for task with passed ID.
func (s *Store) LookupPath(id int) (string, bool) {
	info, ok := s.fileInfos[id]
	if !ok {
		return "", false
	}

	return info.Path, true
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
				s.save(newTask, info)
			}
		}
	}()
}

func (s *Store) save(task Task, info FileInfo) {
	old, ok := s.tasks[task.ID]

	if !ok {
		s.tasks[task.ID] = task
		s.fileInfos[task.ID] = info
		s.EventStream <- Event{Task: &task, Op: Create}
	}

	if ok && old != task {
		s.tasks[task.ID] = task
		s.fileInfos[task.ID] = info
		s.EventStream <- Event{Task: &task, Op: Update}
	}
}
