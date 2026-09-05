import { useCallback, useEffect, useState } from 'react'
import type { QuietHour, Settings } from '../domain/types'
import { DEFAULT_SETTINGS } from '../domain/types'
import './Options.css'

async function fetchSettings(): Promise<Settings> {
  const res = await chrome.runtime.sendMessage({ type: 'GET_STATE' })
  return (res.state.settings as Settings) ?? { ...DEFAULT_SETTINGS }
}

export const Options = () => {
  const [settings, setSettings] = useState<Settings>({ ...DEFAULT_SETTINGS })
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const s = await fetchSettings()
    setSettings(s)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const addQuietHour = () => {
    update('quietHours', [
      ...settings.quietHours,
      { start: '22:00', end: '07:00' },
    ])
  }

  const updateQuietHour = (index: number, patch: Partial<QuietHour>) => {
    const next = settings.quietHours.map((q, i) =>
      i === index ? { ...q, ...patch } : q,
    )
    update('quietHours', next)
  }

  const removeQuietHour = (index: number) => {
    update(
      'quietHours',
      settings.quietHours.filter((_, i) => i !== index),
    )
  }

  const save = async () => {
    setError(null)
    if (settings.minIntervalMin < 1 || settings.maxIntervalMin < 1) {
      setError('Intervals must be at least 1 minute.')
      return
    }
    if (settings.minIntervalMin > settings.maxIntervalMin) {
      setError('Minimum interval cannot exceed maximum.')
      return
    }
    const res = await chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      settings,
    })
    setSettings(res.state.settings as Settings)
    setSaved(true)
  }

  return (
    <main className="options">
      <header>
        <h1>tsunagu settings</h1>
        <p>Control when lesson cards appear while you browse.</p>
      </header>

      <section className="card">
        <h2>Sampling interval</h2>
        <p className="help">
          Cards appear at a random time between these minutes (after the last
          card).
        </p>
        <div className="grid">
          <label>
            Min (minutes)
            <input
              type="number"
              min={1}
              value={settings.minIntervalMin}
              onChange={(e) =>
                update('minIntervalMin', Number(e.target.value) || 1)
              }
            />
          </label>
          <label>
            Max (minutes)
            <input
              type="number"
              min={1}
              value={settings.maxIntervalMin}
              onChange={(e) =>
                update('maxIntervalMin', Number(e.target.value) || 1)
              }
            />
          </label>
        </div>
      </section>

      <section className="card">
        <h2>Quiet hours</h2>
        <p className="help">
          No new cards during these local-time windows. Ranges may wrap midnight
          (e.g. 22:00–07:00).
        </p>
        {settings.quietHours.length === 0 && (
          <p className="empty">No quiet hours set.</p>
        )}
        <ul className="quiet-list">
          {settings.quietHours.map((q, i) => (
            <li key={i}>
              <input
                type="time"
                value={q.start}
                onChange={(e) => updateQuietHour(i, { start: e.target.value })}
              />
              <span>to</span>
              <input
                type="time"
                value={q.end}
                onChange={(e) => updateQuietHour(i, { end: e.target.value })}
              />
              <button type="button" className="ghost" onClick={() => removeQuietHour(i)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="secondary" onClick={addQuietHour}>
          Add quiet hours
        </button>
      </section>

      <section className="card">
        <h2>Pause</h2>
        <label className="check">
          <input
            type="checkbox"
            checked={settings.paused}
            onChange={(e) => update('paused', e.target.checked)}
          />
          Pause all lesson cards
        </label>
      </section>

      <div className="footer">
        <button type="button" onClick={save}>
          Save settings
        </button>
        {saved && <span className="ok">Saved</span>}
        {error && <span className="err">{error}</span>}
      </div>
    </main>
  )
}

export default Options
