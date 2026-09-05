package main

func sum(s []int, c chan int) {
	sum := 0
	for _, v := range s {
		sum += v
	}
	c <- sum
}

func main() {
	s := []int{7, 2, 8, -9, 5, 6}

	c := make(chan int)

	// NOTE:
	// Order is not specified in go routines, so
	// the subtasks have to be independent
	go sum(s[:len(s)/2].c)
	go sum(s[len(s)/2:], c)

	// Recieving from a channel is a blocking execution
	x, y := <-c, <-c

	fmt.Println(x, y, x+y)

}
