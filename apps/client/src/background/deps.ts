import type { AppState } from '../common/types'

export type BackgroundDeps = {
  loadState: () => Promise<AppState>
  getState: () => AppState
  updateState: (updater: (prev: AppState) => AppState) => Promise<AppState>
}
