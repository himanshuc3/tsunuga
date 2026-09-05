package main

import "fmt"

// NOTES:
// 1. Generics are a way to write functions and
// data structures that can operate on different
// types while providing type safety
// 2. Certain helpers are type agnostic
// 3. Comparable is similar to interfaces?, couldn't
// we have solved this with interfaces?
// ~int all types with underlying type of integer
func IndexInt[T comparable](s []T, x T) int {
	for i, n := range s {
		if n == x {
			return i
		}
	}
	return -1
}

func main() {
	s := []int{2, 3, 5, 7, 11}
	fmt.Println(IndexInt(s, 3))
	fmt.Println(IndexInt(s, 4))
}
