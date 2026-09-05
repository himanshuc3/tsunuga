package main

// NOTES:
// 1. Go supports enumerated types using iota
// 2. Since there aren't enums in golang (stupid language),
// we can create semantic types and use them as enums. This is a workaround to the lack of enums in golang
type Gai uint8

// NOTES:
// 1. Constants are always initialized at compile time and are immutable
const (
	Ikkai Gai = iota
	Nikai
	Sankai
	Yonkai
	Gokai
)

var issai uint8 = 1
var age float64 = issai
var height uint8 = age
var moto string = height
