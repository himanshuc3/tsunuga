import { useCallback, useEffect, useState } from 'react'
import { lessons } from '../content/lessons'
import {
  countMasteredInLesson,
  isLessonUnlocked,
} from '../domain/progress'
import type { AppState } from '../domain/types'
import './SidePanel.css'

async function fetchState(): Promise<AppState> {
  const res = await chrome.runtime.sendMessage({ type: 'GET_STATE' })
  return res.state as AppState
}

function forceResultMessage(result: { status: string } | undefined): string | null {
  switch (result?.status) {
    case 'shown':
      return 'Card shown on your active tab — look bottom-right.'
    case 'pending_no_tab':
      return 'Open a normal website tab (http/https), then try again. Chrome pages cannot show cards.'
    case 'inject_failed':
      return 'Could not inject into this page. Refresh the tab and try again.'
    case 'paused':
      return 'Lessons are paused. Resume first, or try again.'
    case 'no_card':
      return 'No card available right now.'
    default:
      return null
  }
}

export const SidePanel = () => {
  const [state, setState] = useState<AppState | null>(null)
  const [busy, setBusy] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const s = await fetchState()
    setState(s)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const togglePause = async () => {
    if (!state) return
    setBusy(true)
    setStatusMsg(null)
    const res = await chrome.runtime.sendMessage({
      type: 'SET_PAUSED',
      paused: !state.settings.paused,
    })
    setState(res.state as AppState)
    setBusy(false)
  }

  const forceCard = async () => {
    setBusy(true)
    setStatusMsg(null)
    try {
      const res = await chrome.runtime.sendMessage({ type: 'FORCE_CARD' })
      if (res?.state) setState(res.state as AppState)
      else await refresh()
      setStatusMsg(forceResultMessage(res?.result))
    } catch {
      setStatusMsg('Extension background failed to respond. Reload the extension.')
    }
    setBusy(false)
  }

  const openOptions = () => {
    chrome.runtime.openOptionsPage()
  }

  if (!state) {
    return (
      <main className="sidepanel">
        <p className="muted">Loading…</p>
      </main>
    )
  }

  const current = lessons.find((l) => l.id === state.currentLessonId)
  const progress = current
    ? countMasteredInLesson(state, current)
    : { mastered: 0, total: 0 }

  return (
    <main className="sidepanel">
      <header className="sidepanel-header">
        <h1>tsunagu</h1>
        <p className="tagline">Japanese mini-lessons while you browse</p>
      </header>

      <section className="panel">
        <div className="row">
          <span className="label">Status</span>
          <span className={state.settings.paused ? 'badge paused' : 'badge live'}>
            {state.settings.paused ? 'Paused' : 'Active'}
          </span>
        </div>
        {state.pendingCard && (
          <p className="pending-note">A card is waiting on your active tab.</p>
        )}
        {statusMsg && <p className="status-msg">{statusMsg}</p>}
        <div className="actions">
          <button type="button" onClick={togglePause} disabled={busy}>
            {state.settings.paused ? 'Resume' : 'Pause'}
          </button>
          <button type="button" className="secondary" onClick={forceCard} disabled={busy}>
            Show card now
          </button>
        </div>
      </section>

      <section className="panel">
        <h2>Current lesson</h2>
        <p className="lesson-title">{current?.title ?? '—'}</p>
        <p className="muted">
          {progress.total > 0
            ? `${progress.mastered}/${progress.total} mastered`
            : 'Concepts in progress'}
        </p>
      </section>

      <section className="panel">
        <h2>Path</h2>
        <ul className="lesson-list">
          {lessons.map((lesson) => {
            const unlocked = isLessonUnlocked(state, lesson)
            const done = state.completedLessonIds.includes(lesson.id)
            const active = lesson.id === state.currentLessonId
            const { mastered, total } = countMasteredInLesson(state, lesson)
            return (
              <li
                key={lesson.id}
                className={[
                  done ? 'done' : '',
                  active ? 'active' : '',
                  !unlocked ? 'locked' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <span className="lesson-name">
                  {done ? 'Done · ' : !unlocked ? 'Locked · ' : active ? 'Now · ' : ''}
                  {lesson.title}
                </span>
                <span className="lesson-meta">
                  {!unlocked
                    ? 'Locked'
                    : total > 0
                      ? `${mastered}/${total}`
                      : done
                        ? 'Done'
                        : 'Open'}
                </span>
              </li>
            )
          })}
        </ul>
      </section>

      <footer className="sidepanel-footer">
        <button type="button" className="linkish" onClick={openOptions}>
          Settings
        </button>
      </footer>
    </main>
  )
}

export default SidePanel
