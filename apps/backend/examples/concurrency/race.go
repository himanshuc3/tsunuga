package main

type Counter struct {
	v  map[string]int
	mu sync.Mutex
}

func (c *Counter) Inc(key string) {
	c.mu.Lock()
	c.v[key]++
	c.mu.Unlock()
}

func (c *Counter) Value(key string) int {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.v[key]
}

func main() {
	c := Counter{v: make(map[string]int)}
	for i := 0; i < 1000; i++ {
		// NOTES:
		// Leads to problems because multiple methods trying to
		// access the same memory location simultaneously
		// Therefore, solve using mutex
		go c.Inc("somekey")
	}

	// NOTES:
	// Simulating pausing main thread until the goroutines
	// finishes
	time.Sleep(time.Second)
	fmt.Println(c.Value("somekey"))
}
