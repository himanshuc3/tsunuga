import type { PendingCard, Settings } from '../../domain/types'

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

export type OpenSidePanel = {
  type: 'OPEN_SIDEPANEL'
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
  | OpenSidePanel

export type BackgroundEvent = AnswerMessage | DismissMessage

export type BackgroundRequest =
  GetStateMessage | SetPausedMessage | UpdateSettingsMessage | ForceCardMessage

export type StateResponse = {
  type: 'STATE'
  ok: true
  state: import('../../domain/types').AppState
}
