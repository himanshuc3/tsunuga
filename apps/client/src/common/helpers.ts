import browser from 'webextension-polyfill'

export async function openSidePanel(): Promise<void> {
  const result = await browser.tabs.query({ active: true, lastFocusedWindow: true })
  const windowId = result[0].windowId
  // Chrome nativeAPI
  chrome.sidePanel.open({ windowId: windowId })
}
