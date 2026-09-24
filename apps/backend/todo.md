### TODO - Features

## MVP

Technical tasks:

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

### Flow testing

Features:

- Authentication flows:
  - Login works [DONE]
  - Logout works [DONE]
  - Token expires logs out the user along with clearing localstorage
- Settings:
  - Update pause/resume [DONE]
  - Update quiet hours
  - Update time range
- Card showing and idempotency:
  - If a card is active on a tab, forcing card shouldn't work
  - If a card is active on a tab, a card should follow switching a tab/window
  - Sampling algorithm for showing the next card:
    - Showing concepts and vocab only once?
    - Showing test cards until a streak threshold is hit? Should we instead give an option to review the vocab tested if the answer is incorrect?
