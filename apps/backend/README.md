# Tsunuga-(bae)kend

## Local dev setup

### Pre-requisites

1. Install golang on your system along with [air](https://github.com/air-verse/air) used for supporting hot reloads in development.
2. Install docker and docker compose on local system used for running database servers.
3. Install [taskfile](https://taskfile.dev/docs/installation) used as a command runner.

### Local Setup

1. Install deps using `go mod download`.
2. Setup environment variables `cp .env.sample .env`.
3. Launching dev server can cause problems without giving sudo permissions to `docker`.
   - Provision these permissions for your user using `sudo usermod -aG docker $USER` and confirm it is updated using `getent group docker` which should output `docker:x:999:{username}`.
   - The PC needs to be restarted for settings to be recaptured in the environment or provision it for the current terminal session using `newgrp docker`.
   - Verify `docker ps` produces result without explicitly using `sudo`.

4. Launch application using `task dev`.
