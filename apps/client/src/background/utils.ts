import browser from "webextension-polyfill"

export function isInjectableUrl(url: string | undefined): boolean {
    if (!url) return false
    return url.startsWith('http://') || url.startsWith('https://')
  }
  
/** Resolve the active tab in the last focused normal window (behind the side panel). */
export async function getActiveInjectableTab(): Promise<browser.tabs.Tab | null> {
  const [focused] = await browser.tabs.query({
    active: true,
    lastFocusedWindow: true,
  })
  if (focused?.id && isInjectableUrl(focused.url)) return focused

  const windows = await browser.windows.getAll({
    populate: true,
    windowTypes: ['normal'],
  })
  const ordered = [
    ...windows.filter((w) => w.focused),
    ...windows.filter((w) => !w.focused),
  ]
  for (const win of ordered) {
    const active = win.tabs?.find((t) => t.active)
    if (active?.id && isInjectableUrl(active.url)) return active
  }
  return null
}

export async function getLastActiveTabId(){
  const [activeTab] = await browser.tabs.query({ active: true, lastFocusedWindow: true })
  return activeTab.id
}