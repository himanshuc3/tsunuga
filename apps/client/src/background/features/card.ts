import { maybeAdvanceLesson, progressKey } from '../../domain/progress'
import { sampleNextCard } from '../../domain/sampler'
import { isInAnyQuietHour } from '../../domain/scheduler'
import { getCurrentLessonId } from '../../common/helpers'
import type { AppState, ItemProgress, PendingCard } from '../../common/types'
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
    let state = await this.deps.getState()
    if (state.settings.paused && !options?.bypassPause) return { status: 'paused', state }

    if (state.pendingCard) {
      return { status: 'existing', card: state.pendingCard, state }
    }

    if (!options?.bypassQuietHours && isInAnyQuietHour(new Date(), state.settings.quietHours)) {
      return { status: 'no_card', state }
    }

    if (!state.lessons.some((lesson) => lesson.id === state.currentLessonId)) {
      const currentLessonId = getCurrentLessonId(state, state.completedLessonIds)
      if (!currentLessonId) return { status: 'no_card', state }
      state = await this.deps.updateState((previous) => ({ ...previous, currentLessonId }))
    }

    const card = sampleNextCard(state)
    if (!card) return { status: 'no_card', state }

    const next = await this.deps.updateState((prev) => ({ ...prev, pendingCard: card }))
    return { status: 'created', card, state: next }
  }

  async deferCard(cardId: string): Promise<AppState | null> {
    const state = await this.deps.loadState()
    const card = state.pendingCard
    if (!card || card.id !== cardId) return null

    return state
  }

  async answerCard(input: AnswerInput, progress: ItemProgress): Promise<AppState | null> {
    const state = await this.deps.getState()
    const card = state.pendingCard
    if (!card || card.id !== input.cardId) return null

    const key =
      card.kind === 'concept'
        ? progressKey(card.lessonId, 'concept', card.conceptId)
        : progressKey(card.lessonId, card.itemType, card.itemKey)
    const next = maybeAdvanceLesson({
      ...state,
      itemProgress: { ...state.itemProgress, [key]: progress },
    })

    return this.deps.updateState(() => ({ ...next, pendingCard: null }))
  }
}
