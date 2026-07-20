import type { PendingCard, Settings } from './types'

export type ShowCardMessage = {
  type: 'SHOW_CARD'
  card: PendingCard
}

export type HideCardMessage = {
  type: 'HIDE_CARD'
}

export type AnswerMessage = {
  type: 'ANSWER'
  cardId: string
  correct?: boolean
  choice?: string
}

export type DismissMessage = {
  type: 'DISMISS'
  cardId: string
}

export type GetStateMessage = {
  type: 'GET_STATE'
}

export type SetPausedMessage = {
  type: 'SET_PAUSED'
  paused: boolean
}

export type UpdateSettingsMessage = {
  type: 'UPDATE_SETTINGS'
  settings: Partial<Settings>
}

export type ForceCardMessage = {
  type: 'FORCE_CARD'
}

export type ExtensionMessage =
  | ShowCardMessage
  | HideCardMessage
  | AnswerMessage
  | DismissMessage
  | GetStateMessage
  | SetPausedMessage
  | UpdateSettingsMessage
  | ForceCardMessage

export type StateResponse = {
  type: 'STATE'
  ok: true
  state: import('./types').AppState
}
