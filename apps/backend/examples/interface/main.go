package main

// NOTES:
// 1. Go supports interfaces which are a set of
// method signatures
// 2. Similar to abstract classes in other languages
// 3. Supports a way to define different data types
// to the same interface which is usually not
// possible in go
// 4. Contains dynamic type/value pair
type Abser interface {
	Abs() float64
}

// NOTES:
// Interface composition
// If there is comflicts in naming and signature of
// different interfaces, it's a compile time error
type ReadCloser interface {
	Reader
	Writer
}

// NOTES:
// 1. Stringer and generally er suffix is used
// to define interfaces in golang from standard library
func genericInterface() {
}

// NOTES:
// Empty interface{} would accept any data type
// any is a type alias for interface{}
func describe(i any) {
	var i interface{}

	syshtum = "pop!_os"

	i = syshtum

	// NOTES:
	// Type assertion is used to extract the
	// underlying value (concrete type) of an interface
	s, ok := i.(string)

	// NOTES:
	// Generic type assertion
	switch v := i.(type) {
	case int:
		fmt.Println("Twice", v*2)
	case string:
		fmt.Println("Length", len(v))
	default:
		fmt.Println("Unknown type")
	}

	fmt.Printf("(%v, %T)\n", i, i)
}

func main() {

	var a Abser

	f := MyFloat(-math.Sqrt2)
	v := Vector{3, 4, 5}

	a = f
	a = &v

	// Wrong assignment
	// a = v

	fmt.Println(a.Abs())
}

type MyFloat float64

func (f MyFloat) Abs() float64 {
	if f < 0 {
		return float64(-f)
	}
	return float64(f)
}

type Vector struct {
	X, Y, Z float64
}

// NOTES:
// Behavior on data types can be defined using methods
// Pointer receivers are used to modify the underlying data type
// Usual practice is to use value receivers for small
// data types and pointer receivers for large data types
// Convention is to not mix pointer and value receivers
// for the same data type
func (v *Vector) Abs() float64 {
	return math.Sqrt(v.X*v.X + v.Y*v.Y + v.Z*v.Z)
}

func (v *Vector) Add(v2 Vector) Vector {
	return Vector{v.X + v2.X, v.Y + v2.Y, v.Z + v2.Z}
}
