
export function openSidePanelForWindow(windowId: number): void {
    void chrome.sidePanel.open({ windowId })
}

/** Must call sidePanel.open synchronously in the command callback (no await before it). */
export function openSidePanelFromGesture(): void {
    chrome.windows.getLastFocused({ windowTypes: ['normal'] }, (win) => {
      if (win?.id != null) {
        openSidePanelForWindow(win.id)
        return
      }
  
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, ([tab]) => {
        if (tab?.windowId != null) {
          openSidePanelForWindow(tab.windowId)
        }
      })
    })
  }