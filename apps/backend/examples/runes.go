package main

// NOTES:
// Strings in go are made of runes (Uncicode 
// character represented as an integer)
// So strings are equivalent to []byte
// Indexing a string gives a byte, not that specific
// character
func runesItForMe(){
	s := "ありがとう"
	fmt.Println("Len: ", len(s))

	for idx, runeValue := range s {
		fmt.Println(runeValue, idx)
	}


}