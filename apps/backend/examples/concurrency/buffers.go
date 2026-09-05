package main

// 1. Main go routine has to wait for execution of all
// the goroutines to finish otherwise, we might it might
// be premature exit
// 2. close sends a broadcast signal to stop execution
// and close the channel, preventing unnecessary blocks
func main() {
	// NOTES:
	// Buffered channels are more flexible
	// and non-blocking compared to unbuffered
	// Unbuffered channels provide synchronization
	// mechanism
	ch := make(chan int, 2)
	ch <- 1
	ch <- 2
	fmt.Println(<-ch)
	fmt.Println(<-ch)
}
