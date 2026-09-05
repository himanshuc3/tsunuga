package main

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
func (v Vector) Magnitude() float64 {
	return math.Sqrt(v.X*v.X + v.Y*v.Y + v.Z*v.Z)
}

func (v Vector) Add(v2 Vector) Vector {
	return Vector{v.X + v2.X, v.Y + v2.Y, v.Z + v2.Z}
}

func main() {
	v := Vector{1, 2, 3}
	v2 := Vector{4, 5, 6}
	v3 := v.Add(v2)
	fmt.Println(v3)
}
