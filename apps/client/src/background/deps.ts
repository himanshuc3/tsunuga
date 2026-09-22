import type { AppState } from '../domain/types'

export type BackgroundDeps = {
  loadState: () => Promise<AppState>
  updateState: (updater: (prev: AppState) => AppState) => Promise<AppState>
}
