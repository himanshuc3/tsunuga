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

### Before deployment

Migratable versions of application:

- Data compatibility:
  - [Enforced] All fields added to entities in database must be optional unless a mandatory upgrade of extension required by the user. [For updates to extension]
  - [Important] Error boundary as a catch all with reset (rehydrate local storage)
  - [Defer] Local storage compatibility: Having explicit schema versioning? And use oninstalled for schema migrations
  - Reading local storage should always be after normalizing it with default State
  - [Handled-Error boundary] User can delete local storage and in that case the application can crash?

- Deployment:
  - Using neon + railway/render
- Steps:
  1. Avoid DB DSN build and redundancy over in database.go and migrator.go. Instead just add TANGO_DATABASE.URL.
  2. Apply the configured pool limits (MaxOpenConns, MadIdleConns, ConnMaxIdleTime). Keeping number of MaxConns modest and use conns pooled by Neon.
  3. Handle render shutdown (Render sends SIGTERM)
  4. Move migrations out of normal server setup. Use render's `predeploycommand`/ separate migration job.
  5. Production dockerfile + render.yaml

Set up this Neon project in the current working directory.

1. `npm i -g neon@latest && neon login`
2. `neon skills -y`
3. `neon mcp -y`
4. `neon link --project-id small-frog-23521824 --branch production -y`
5. `neon config init`
6. Update `neon.ts`:

```ts
import { defineConfig } from "@neon/config/v1";

export default defineConfig({});
```

7. `neon deploy`

### Deploying a DB

1. Create a project and get a DSN
2. Test the connection after installing pre-requisites:

- `sudo apt update && sudo apt install postgresql-client`

3. Connect to the DB:

```
  export DB_URL='DSN'
  psql "$DB_URL"
  SELECT now(), current_database(), current_user, version();
```
