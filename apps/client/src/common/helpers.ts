import browser from 'webextension-polyfill'

export async function openSidePanel(): Promise<void> {
  const result = await browser.tabs.query({ active: true, lastFocusedWindow: true })
  const windowId = result[0].windowId
  // Chrome nativeAPI
  chrome.sidePanel.open({ windowId: windowId })
}

export const OPEN_SETTINGS_ON_LOAD_KEY = 'openSettingsOnLoad'

// Flags the popup to open straight into its settings view, then requests the popup itself.
export async function openPopupWithSettings(): Promise<void> {
  await browser.storage.local.set({ [OPEN_SETTINGS_ON_LOAD_KEY]: true })
  try {
    await (chrome.action as any).openPopup()
  } catch (error) {
    console.error('Failed to open popup', error)
  }
}

export const sendMessage = browser.runtime.sendMessage
