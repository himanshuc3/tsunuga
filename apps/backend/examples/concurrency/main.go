package main

func say(s string) {
	for i := 0; i < 5; i++ {
		time.Sleep(100 * time.Millisecond)
		fmt.Println(s)
	}
}

func main() {
	// NOTES:
	// Go routines are managed by go scheduler
	// and can be thought of as a new thread spawning
	// Concurrency isn't necessarily leading directly to
	// parallelism
	// Instead of shared memory to communicate (& therefore mutex
	// locks etc.), go promotes explicit communication between
	// different go routines (CSP)
	// Channels are data types to help w/ the communication
	go say("world")
	say("hello")
}
