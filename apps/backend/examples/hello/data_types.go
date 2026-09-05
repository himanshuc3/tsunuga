package main

// NOTES:
// Tags used for marshalling/unmarshalling data to/from JSON
// Capitalization is still semantically defining 
// publicly accessible data (outside of the package)
type Vector struct {
	X float64 `json:"x"`
	y float64 `json:"y"`
	z float64 `json:"z"`
}

func weekdays() [7]string{
	// NOTES:
	// Arrays are fixed length and slices are vectors
	var days [7]string
	days[0] = "Monday"
	days[1] = "Tuesday"
	days[2] = "Wednesday"
	days[3] = "Thursday"
	days[4] = "Friday"
	days[5] = "Saturday"
	days[6] = "Sunday"

	return days
}

func invite() {
	names := [4]string{
		"Trump",
		"Putin",
		"Xi Jinping",
		"Modi",
	}

	fmt.Println(names)

	// NOTES:
	// Slice with length 2 and capacity 4
	// Still pointing to the same underlying array
	a := names[0:2]\
	// NOTES:
	// Slice with length 2 and capacity 3
	// Still pointing to the same underlying array 
	b := names[1:3]

	b[0] = "Biden"

	fmt.Println(a, b)

}

func slicesOfLife(){
	// NOTES:
	// Slices are reference type and therefore assigned a nil
	// zero value
	// Same for function, pointers, channels and maps
	var s []int

	// NOTES:
	// make is used to create slices, maps and channels
	// Helpful since it defines meta without data
	a := make([]int, 5)

	// NOTES:
	// variadic functions are supported in golang
	a = append(s,3)

	if s == nil {
		fmt.Println("slice is nil")
	}
}

func quickAccess(){
	var HoursOfWork struct {
		Hours int
		Minutes int
		Seconds int
	}
	// NOTES:
	// Maps are convenient AF
	// Doesn't work because initialized with nil
	// var m map[string]HoursOfWork
	// Now, initialized with empty value
	var m map[string]HoursOfWork{}


	m["Monday"] = HoursOfWork{Hours: 8, Minutes: 30, Seconds: 0}	
	m["Tuesday"] = HoursOfWork{Hours: 8, Minutes: 30, Seconds: 0}	
	m["Saturday"] = HoursOfWork{Hours: -1, Minutes: 30, Seconds: 0}	

	for key, value := range m {
		fmt.Println(key, value)
	}

	value, ok := m["Fryyyday"]
	if !ok {
		fmt.Println("No work on Fryyyday")
	}
}

func jsMakesAComeback(){
	// NOTES:
	// Anonymous functions are supported in golang
	// Functions are first class citizens in golang
	// Functions are values that can be passed around
	// and closures are supported in golang
	hypot := func(x, y float64) float64 {
		return math.Sqrt(x*x + y*y)
	}

	fmt.Println(hypot(5, 12))
}


func goingThroughTheMotions(){
	v := []int{2,3,4,5,6,7,8,9}
	// NOTES:
	// Value based accessing in the loop 
	for i, v := range pow {
		fmt.Println(v)
	}

}



func main(){
	i, j := 6, 9

	// NOTES:
	// Pointers in golang
	p := &i
	fmt.Println(*p)
	*p = 21

	p = &j
	fmt.Println(p)


	origin = Vector{1,2,3}

	fmt.Println(origin)
}