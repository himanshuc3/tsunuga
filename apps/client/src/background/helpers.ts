import browser from 'webextension-polyfill'
import { ExtensionMessage } from '../common/messaging/messages'

// Message communication to active tab
export async function sendToTab(tabId: number, message: ExtensionMessage): Promise<boolean> {
  try {
    await browser.tabs.sendMessage(tabId, message)
    return true
  } catch {
    return false
  }
}

// TODO[Refactor]: Message should be a constant
export async function hideOnTab(tabId: number | null): Promise<void> {
  if (tabId != null) await sendToTab(tabId, { type: 'HIDE_CARD' })
}

// Communication with popup
// TODO[Refactor]: extract specification into configuration
export async function setBadge(pending: boolean): Promise<void> {
  await browser.action.setBadgeBackgroundColor({ color: '#C47B2C' })
  await browser.action.setBadgeText({ text: pending ? '!' : '' })
}
