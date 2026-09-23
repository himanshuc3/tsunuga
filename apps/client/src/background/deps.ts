import type { AppState } from '../common/types'

export type BackgroundDeps = {
  loadState: () => Promise<AppState>
  updateState: (updater: (prev: AppState) => AppState) => Promise<AppState>
}
