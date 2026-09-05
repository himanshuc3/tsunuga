// NOTES:
// go run . (for the current file) - Does caching instead of 
// recompiling the file every time
// go build main.go (to build the file which 
// generates a platform agnostic binary)
// Package names are usually the folder the are inside
package main

import "fmt"

func eggsInMultipleBaskets(eggs, baskets int) (int, int) {
	// NOTES:
	// 1. Go supports multiple return values
	// 2. Go supports named return values
	// 3. Go supports implicit return values
	return eggs / baskets, eggs % baskets
}

// NOTES:
// 1. Go supports global variables
// 2. Go supports type inference
// 3. Go supports zero values for uninitialized variables
// They are never uninitialized
// 4. Reference types - ponters, slices, function, channel, maps
var c, pythong, java bool

func whatDayIsToday() {
	switch day:= "Tuesday": day {
		// NOTES:
		// 1. Supports expressions inside cases
	case day <= "Tuesday":
		fmt.Println("It's a weekday")
	case day == "Wednesday":
		fmt.Println("It's a weekday")

	}
}

func fetchDataFromAPI() {
	// NOTES:
	// 1. Go supports defer statements which are executed as per stack in FILO
	dataBaseConnection := "Established"
	defer fmt.Println("Closing database connection:", dataBaseConnection)

	subscription := "Active"
	defer fmt.Println("Closing subscription:", subscription)
}

func main() {
	// NOTES:
	// Capital letters are publicly exposed data
	// Supports UTF-8 characters
	eggsPerBasket, eggsLeft := eggsInMultipleBaskets(10, 3)
	fmt.Println("ありがとう Himanshu-san!")
	fmt.Printf("Eggs per basket: %d, Eggs left over: %d\n", eggsPerBasket, eggsLeft)

	days := 0

	// NOTES:
	// 1. Go supports for loops with only a condition
	for i :=0 ; true; i++{
		sum += 1
		// NOTES:
		// 1. Lexical scoping of branch variables in if conditions
		if one_month:= 30; sum > one_month {
			fmt.Println("Cry cause you're unemployable")
			break;
		}
	}
	fmt.Println("days passed:", days)
}