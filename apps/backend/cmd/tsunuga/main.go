package main

import "fmt"

// import (
// 	"context"
// 	"log"
// 	"net/http"
// 	"os"

// 	"github.com/himanshuc3/tsunuga-be/internal/api"
// 	"github.com/himanshuc3/tsunuga-be/internal/api/handlers"
// 	"github.com/himanshuc3/tsunuga-be/internal/catalog"
// 	"github.com/himanshuc3/tsunuga-be/internal/store"
// )

/** Memory Access Patterns
// Program designing is important since memory
// access optimization according to Cache (L1/L2/L3) -> main memory
// model needs to be respected.
// Latency in memory access can be as harmful as an unoptimized
// big O algorithm.
**/

// 1. Structs doesn't necessarily get allocated the same space
// as declared
// 2. While a variable of example type might be allocated
// 3 bytes, but according to the architecture of the platform
// it doesn't want to span this across two different words and therefore
// padding is introduced according to the size of a word in the OS. Further
// the alignment is such that each value falls in powers of 2 indices
// 3. To optimize or minimize the padding, we need to structure the values
// in decreasing order of size of the value i.e. int16 -> bool
// 4. Anonymous structs are just use and throw inline structs
// 5. Implicit conversion doesn't happen with custom types unlike
// with native types
//
//	type example struct {
//	 isValid bool
//	 date int16
//	}
func main() {
	fmt.Println("Dumbriyani server...")
}

// func main() {
// 	ctx := context.Background()

// 	databaseURL := os.Getenv("DATABASE_URL")
// 	if databaseURL == "" {
// 		// NOTE:
// 		// Useful for persistent logging, concurrency
// 		// safe and adds timing implicitly
// 		log.Fatal("DATABASE_URL is required")
// 	}

// 	st, err := store.Connect(ctx, databaseURL)
// 	if err != nil {
// 		log.Fatal(err)
// 	}
// 	defer st.Close()

// 	if err := st.EnsureSchema(ctx); err != nil {
// 		log.Fatal(err)
// 	}
// 	if err := st.SyncCatalog(ctx, catalog.Lessons); err != nil {
// 		log.Fatal(err)
// 	}
// 	log.Printf("synced %d lessons from catalog", len(catalog.Lessons))

// 	h := &handlers.Handler{Store: st}
// 	mux := api.NewRouter(h)

// 	log.Println("API listening on :3333")
// 	if err := http.ListenAndServe(":3333", mux); err != nil {
// 		log.Fatal(err)
// 	}
// }
