package task

// Store is where tasks are managed.
type Store struct {
	tasks      map[int]Task
	taskStream chan Task
}

// NewStore initializes and returns a new Store.
func NewStore() *Store {
	return &Store{
		tasks:      map[int]Task{},
		taskStream: make(chan Task),
	}
}

// Close closes internal channels.
func (s *Store) Close() {
	close(s.taskStream)
}

// List returns a saved tasks.
func (s *Store) List() []Task {
	list := []Task{}
	for _, task := range s.tasks {
		list = append(list, task)
	}
	return list
}

// Save save a passed task into store.
func (s *Store) Save(task Task) {
	s.tasks[task.ID] = task
}

// SaveFrom starts a goroutine saving tasks generated from FileInfo and
// returns a channel where saved tasks pass through.
func (s *Store) SaveFrom(fileInfoStream <-chan FileInfo) <-chan Task {
	stream := make(chan Task)
	go func() {
		for {
			select {
			case info, ok := <-fileInfoStream:
				if !ok {
					return
				}

				task, _ := Parse(info)

				// TODO: save a task into store.

				stream <- task
			}
		}
	}()
	return stream
}
