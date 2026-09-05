package main

func fibonacci(n int, c chan int) {
	x, y := 0, 1
	for i := 0; i < n; i++ {
		c <- x
		x, y = y, x+y
	}
	close(c)
}

func main() {
	c := make(chan int, 10)
	go fibonacci(cap(c), c)

	// NOTES:
	// 1. Stops ranging over c when channel is closed
	for i := range c {
		fmt.Println(i)
	}
}
