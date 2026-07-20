import { useState } from 'react'
import type { PendingCard } from '../domain/types'

type Props = {
  card: PendingCard
  onAnswer: (choice: string, correct: boolean) => void
  onAck: () => void
  onDismiss: () => void
}

const KIND_LABEL: Record<PendingCard['kind'], string> = {
  intro: 'New',
  concept: 'Concept',
  test: 'Test',
}

export function Card({ card, onAnswer, onAck, onDismiss }: Props) {
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [picked, setPicked] = useState<string | null>(null)

  const handleChoice = (choice: string) => {
    if (card.kind !== 'test' || feedback) return
    const correct = choice === card.answer
    setPicked(choice)
    setFeedback(correct ? 'correct' : 'incorrect')
    window.setTimeout(() => {
      onAnswer(choice, correct)
    }, correct ? 650 : 1100)
  }

  return (
    <div
      className="tsunagu-card"
      data-kind={card.kind}
      data-feedback={feedback ?? undefined}
      role="dialog"
      aria-label="Tsunagu lesson card"
    >
      <div className="tsunagu-header">
        <span className="tsunagu-kind">{KIND_LABEL[card.kind]}</span>
        {card.kind === 'intro' ? (
          <p className="tsunagu-script">{card.jp}</p>
        ) : (
          <span className="tsunagu-header-spacer" aria-hidden="true" />
        )}
        <button
          type="button"
          className="tsunagu-close"
          aria-label="Dismiss"
          onClick={onDismiss}
        >
          ×
        </button>
      </div>

      <div className="tsunagu-body">
        {card.kind === 'intro' && (
          <>
            <div className="tsunagu-pair">
              <div className="tsunagu-half">
                <p className="tsunagu-half-text">{card.reading ?? card.jp}</p>
              </div>
              <div className="tsunagu-half">
                <p className="tsunagu-half-text">{card.en}</p>
              </div>
            </div>
            {card.meta && <p className="tsunagu-meta">{card.meta}</p>}
            <div className="tsunagu-actions">
              <button type="button" className="tsunagu-btn primary" onClick={onAck}>
                Got it
              </button>
            </div>
          </>
        )}

        {card.kind === 'concept' && (
          <>
            <h2 className="tsunagu-title">{card.title}</h2>
            <p className="tsunagu-detail">{card.body}</p>
            <div className="tsunagu-actions">
              <button type="button" className="tsunagu-btn primary" onClick={onAck}>
                Continue
              </button>
            </div>
          </>
        )}

        {card.kind === 'test' && (
          <>
            <p className="tsunagu-prompt small">{card.prompt}</p>
            {card.meta && <p className="tsunagu-meta">{card.meta}</p>}
            <div className="tsunagu-choices">
              {card.choices.map((choice) => {
                let state: 'correct' | 'wrong' | undefined
                if (feedback) {
                  if (choice === card.answer) state = 'correct'
                  else if (choice === picked) state = 'wrong'
                }
                return (
                  <button
                    key={choice}
                    type="button"
                    className="tsunagu-choice"
                    data-state={state}
                    disabled={Boolean(feedback)}
                    onClick={() => handleChoice(choice)}
                  >
                    {choice}
                  </button>
                )
              })}
            </div>
            {feedback === 'correct' && (
              <p className="tsunagu-feedback ok">Correct</p>
            )}
            {feedback === 'incorrect' && (
              <p className="tsunagu-feedback bad">Answer: {card.answer}</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
