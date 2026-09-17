### TODO - Features

## MVP

1. Authentication for users
2. APIs supporting incrementally whatever happens locally on
   client side
3. Supporting the data using DBs
4. Domain logic to bridge apis to DBs

Technical tasks:

- Static lesson data injestion with proper updates
- Oauth in browser extension
- Relevant routes for updating:
  - user progress
  - user settings
- Integration from FE

## Improve architecture of codebase

- Architecture, while standard, is very boilerplate heavy. Adding even a single route leads to the following path:
  - Initiate a new handler
  - Initiate a new service
  - Inititate a new repository of methods
  - Redundant DTOs with validation which overlap with data from services

- Go, as a languaze, enjoys verbose code, which means a ton of error handling before we could even ship a simple feature unless we want our app to crash.
