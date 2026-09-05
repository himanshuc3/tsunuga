package examples

import "fmt"

/**
// Arrays vs slices
// 1. Arrays are fixed length vs slice is an alias dynamic vector.
// 2. for used for every looping operation -> for: range used w/
// both value and pointer semantics
**/

// NOTES:
// Strings are immutable
var cars [2]string
func Midcars(){
	// NOTE: Each value in the array is a 2 word container containing 
	// a pointer to the string and length of the string.
	cars[0] = "honda" 
	cars[1] = "maruti"
	
	// NOTE: using value semantics to copy the pointer to the value
	// stored in each car
	for i, car := range cars {
		fmt.Println(i, car)
	}

}