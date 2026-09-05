import { useCallback, useEffect, useState } from 'react'
import type { AppState } from '../domain/types'
import './Popup.css'

async function fetchState(): Promise<AppState> {
  const res = await chrome.runtime.sendMessage({ type: 'GET_STATE' })
  return res.state as AppState
}

function forceResultMessage(result: { status: string } | undefined): string | null {
  switch (result?.status) {
    case 'shown':
      return 'Card shown on your active tab — look bottom-right.'
    case 'pending_no_tab':
      return 'Open a normal website tab (http/https), then try again.'
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

export const Popup = () => {
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

  const openSidePanel = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab?.windowId == null) return
      void chrome.sidePanel.open({ windowId: tab.windowId })
      window.close()
    })
  }

  const openOptions = () => {
    chrome.runtime.openOptionsPage()
  }

  if (!state) {
    return (
      <main className="popup">
        <p className="tagline">Loading…</p>
      </main>
    )
  }

  return (
    <main className="popup">
      <header className="popup-header">
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
          <button type="button" onClick={openSidePanel} disabled={busy}>
            Open side panel
          </button>
          <div className="row-actions-wrap">
            <button type="button" className="secondary row-actions" onClick={togglePause} disabled={busy}>
              {state.settings.paused ? 'Resume' : 'Pause'}
            </button>
            <button type="button" className="secondary row-actions" onClick={forceCard} disabled={busy}>
              Show card now
            </button>
          </div>
        </div>
      </section>

      <footer className="popup-footer">
        <button type="button" className="linkish" onClick={openOptions}>
          Settings
        </button>
      </footer>
    </main>
  )
}

export default Popup
