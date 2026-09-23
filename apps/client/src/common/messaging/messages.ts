import type { AppState, PendingCard, Settings } from '../types'

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

/** Shows a supplied card without saving or recording learning progress. */
export type ShowTestCardMessage = {
  type: 'SHOW_TEST_CARD'
  card: PendingCard
}

export type AuthTokenMessage = {
  type: 'AUTH_TOKEN'
}

export type AuthTokenStatusMessage = {
  type: 'AUTH_TOKEN_STATUS'
}

export type LogoutMessage = {
  type: 'LOGOUT'
}

export type OpenSettingsMessage = {
  type: 'OPEN_SETTINGS'
}

export type ConsumeOpenSettingsMessage = {
  type: 'CONSUME_OPEN_SETTINGS'
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
  | ShowTestCardMessage
  | AuthTokenMessage
  | AuthTokenStatusMessage
  | OpenSettingsMessage
  | ConsumeOpenSettingsMessage
  | OpenSidePanel
  | LogoutMessage

export type BackgroundEvent = DismissMessage | OpenSidePanel

export type BackgroundRequest =
  | AnswerMessage
  | GetStateMessage
  | SetPausedMessage
  | UpdateSettingsMessage
  | ForceCardMessage
  | ShowTestCardMessage
  | AuthTokenMessage
  | AuthTokenStatusMessage
  | OpenSettingsMessage
  | ConsumeOpenSettingsMessage
  | LogoutMessage

export type StateResponse = {
  type: 'STATE'
  ok: true
  state: AppState
}
