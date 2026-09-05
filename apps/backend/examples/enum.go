package main

type State int

// NOTES:
// Creating fake enums because the language
// doesn't have primitive concepts available
const (
	Idle State = iota
	Progress 
	Error
	Retrying
	Successful
)

var stateName = map[State]string{
	Idle: "idle",
	Progress: "progress",
	Error: "error",
	Retrying: "retrying",
	Successful: "successful"
}

// NOTES:
// Package level constructor, a reserved keyword
// new(T) returns a pointer to the type T
// panic would unwind everything on the stack
// which would trigger the cleanups as well
// recover stops and handles the panic error thrown
func init(){

}

// NOTES:
// Implementing the stringer interface is apparently 
// the bare minimum on any custom data type
func (s State) String() string {
	return stateName[s]
}

func 