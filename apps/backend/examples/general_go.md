## General go guidelines

- Salient Features:
    - Compiles into a single binary
    - Static type system
     Performance
     - No need for a web framework
     - Great IDE support and debugging

Common problems:
- OpenAPI/Swagger doc generation is a hard problem
    - zod helps with validation
    - ts-rest also helps
- Interfaces are more useful with libraries but not necessarily with executable code
    - But helpful w/ testing
- Concurrency narrative is important but not necessarily used in rest apis because requests are already concurrent go routines
- Standard library overuse instead of wrappers/custom libraries:
    - binding: map incoming data -> serialization -> map to local structs
    - Instead use fiber, echo etc. to prevent getting into standard library
- DI Framework: don't deal with it when starting out
- Error handling: no need to overthink
- Project layout: Just choose a standard one
- ORMs