package main


// NOTES:
// Error is also an interface
// Any data can implement multiple abstract interfaces
type MyError struct {
	When time.Time
	What string
}

func (e *MyError) Error() string {
	return fmt.Sprintf("at %v, %s", e.When, e.What)
}


func run() error{
	// NOTES:
	// Returning a pointer to a struct that implements
	//  the error interface
	// Interfaces are useful for testing and mocking
	return &MyError{
		time.Now(),
		"it didn't work"
	}	
}

func init(){
	if err := run(): err != nil {
		fmt.Println(err)
	}
}