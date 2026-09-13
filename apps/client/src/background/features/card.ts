import {
  markConceptShown,
  markIntroduced,
  markTestResult,
  maybeAdvanceLesson,
  progressKey,
} from '../../domain/progress'
import { sampleNextCard } from '../../domain/sampler'
import { isInAnyQuietHour } from '../../domain/scheduler'
import type { AppState, PendingCard } from '../../domain/types'
import type { BackgroundDeps } from '../deps'

export type AnswerInput = {
  cardId: string
  choice?: string
  correct?: boolean
}

export type CreateCardResult =
  | { status: 'created'; card: PendingCard; state: AppState }
  | { status: 'existing'; card: PendingCard; state: AppState }
  | { status: 'paused'; state: AppState }
  | { status: 'no_card'; state: AppState }

export class CardFeature {
  constructor(private readonly deps: BackgroundDeps) {}

  async createCard(options?: {
    bypassQuietHours?: boolean
    bypassPause?: boolean
  }): Promise<CreateCardResult> {
    const state = await this.deps.loadState()
    if (state.settings.paused && !options?.bypassPause) return { status: 'paused', state }

    if (state.pendingCard) {
      return { status: 'existing', card: state.pendingCard, state }
    }

    if (!options?.bypassQuietHours && isInAnyQuietHour(new Date(), state.settings.quietHours)) {
      return { status: 'no_card', state }
    }

    const card = sampleNextCard(state)
    if (!card) return { status: 'no_card', state }

    const next = await this.deps.updateState((prev) => ({ ...prev, pendingCard: card }))
    return { status: 'created', card, state: next }
  }

  async dismissCard(cardId: string): Promise<AppState | null> {
    const state = await this.deps.loadState()
    const card = state.pendingCard
    if (!card || card.id !== cardId) return null

    let next = state
    if (card.kind === 'intro') {
      next = markIntroduced(state, progressKey(card.lessonId, card.itemType, card.itemKey))
    } else if (card.kind === 'concept') {
      next = markConceptShown(state, card.lessonId, card.conceptId)
    } else {
      next = markIntroduced(state, progressKey(card.lessonId, card.itemType, card.itemKey))
    }

    return this.deps.updateState(() => ({
      ...maybeAdvanceLesson(next),
      pendingCard: null,
    }))
  }

  async answerCard(input: AnswerInput): Promise<AppState | null> {
    const state = await this.deps.loadState()
    const card = state.pendingCard
    if (!card || card.id !== input.cardId) return null

    let next = state
    if (card.kind === 'test') {
      const correct =
        typeof input.correct === 'boolean'
          ? input.correct
          : input.choice !== undefined && input.choice === card.answer
      const key = progressKey(card.lessonId, card.itemType, card.itemKey)
      next = maybeAdvanceLesson(markTestResult(state, key, correct))
    } else {
      next = this.applyCardAck(state, card)
    }

    return this.deps.updateState(() => ({ ...next, pendingCard: null }))
  }

  private applyCardAck(state: AppState, card: PendingCard): AppState {
    if (card.kind === 'intro') {
      return maybeAdvanceLesson(
        markIntroduced(state, progressKey(card.lessonId, card.itemType, card.itemKey)),
      )
    }
    if (card.kind === 'concept') {
      return maybeAdvanceLesson(markConceptShown(state, card.lessonId, card.conceptId))
    }
    return state
  }
}
