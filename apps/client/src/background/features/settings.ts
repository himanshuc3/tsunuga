import type { AppState, Settings } from '../../common/types'
import type { BackgroundDeps } from '../deps'

export class SettingsFeature {
  constructor(private readonly deps: BackgroundDeps) {}

  async setPaused(paused: boolean): Promise<AppState> {
    return this.deps.updateState((prev) => ({
      ...prev,
      settings: { ...prev.settings, paused },
    }))
  }

  async updateSettings(settings: Partial<Settings>): Promise<AppState> {
    return this.deps.updateState((prev) => {
      const nextSettings = { ...prev.settings, ...settings }
      if (nextSettings.minIntervalMin > nextSettings.maxIntervalMin) {
        nextSettings.maxIntervalMin = nextSettings.minIntervalMin
      }
      return { ...prev, settings: nextSettings }
    })
  }

  getUpdatedSettings(settings: Partial<Settings>): Settings {
    return { ...this.deps.getState().settings, ...settings }
  }
}
