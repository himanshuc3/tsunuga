### TODO - Features

## MVP

Technical tasks:

- API integration
- Client-side:
  - Touchup on design
  - Assets (logo, icons etc.)
  - Microinteractions
- External service integrations
- Deployment of server
- Testing on prod (lol)
- Buy me a coffee
- Hanami easter egg

- TODO[devex]: A monorepo tool manager like turbo.

## Improve architecture of codebase

- Architecture, while standard, is very boilerplate heavy. Adding even a single route leads to the following path:
  - Initiate a new handler
  - Initiate a new service
  - Inititate a new repository of methods
  - Redundant DTOs with validation which overlap with data from services

- Go, as a languaze, enjoys verbose code, which means a ton of error handling before we could even ship a simple feature unless we want our app to crash.
