import { loadState, saveState, updateState } from '../common/storage'

export type BackgroundDeps = {
  loadState: typeof loadState
  saveState: typeof saveState
  updateState: typeof updateState
}

export const backgroundDeps: BackgroundDeps = {
  loadState,
  saveState,
  updateState,
}
