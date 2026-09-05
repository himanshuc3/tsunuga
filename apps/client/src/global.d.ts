/// <reference types="vite/client" />

declare const __APP_VERSION__: string

declare namespace chrome.sidePanel {
  function open(options: { tabId?: number; windowId?: number }): Promise<void>
}
