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

export type BackgroundEvent = AnswerMessage | DismissMessage

export type BackgroundRequest =
  GetStateMessage | SetPausedMessage | UpdateSettingsMessage | ForceCardMessage

export function isBackgroundEvent(message: unknown): message is BackgroundEvent {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    (message.type === 'ANSWER' || message.type === 'DISMISS')
  )
}

export function isBackgroundRequest(message: unknown): message is BackgroundRequest {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    (message.type === 'GET_STATE' ||
      message.type === 'SET_PAUSED' ||
      message.type === 'UPDATE_SETTINGS' ||
      message.type === 'FORCE_CARD')
  )
}

export type StateResponse = {
  type: 'STATE'
  ok: true
  state: import('./types').AppState
}
