import browser from 'webextension-polyfill'
import { BackgroundController } from './controller'

class BackgroundApp {
  private static _instance: BackgroundApp | null = null
  private readonly _controller: BackgroundController
  private _listenersRegistered = false

  private constructor(controller = new BackgroundController()) {
    this._controller = controller
  }

  public static getInstance(): BackgroundApp {
    if (!BackgroundApp._instance) {
      BackgroundApp._instance = new BackgroundApp()
    }
    return BackgroundApp._instance
  }

  public start(): void {
    this.registerListeners()
    // void this._controller.initializeActiveTab()
    void this._controller.initialize(true)
  }

  /**
   * Configuring native listeners used for listening to
   * events, keyboard shortcuts, extension startups and
   * everything in between.
   */
  public registerListeners(): void {
    if (this._listenersRegistered) return
    this._listenersRegistered = true

    // Setup keyboard shortcuts
    browser.commands.onCommand.addListener((command) => {
      void this._controller.handleCommand(command)
    })

    // Setup startup scripts on extension install and browser startup
    browser.runtime.onInstalled.addListener(() => {
      void this._controller.initialize(false)
    })

    browser.runtime.onStartup.addListener(() => {
      void this._controller.initialize(true)
    })

    // Setup cron jobs essentially
    browser.alarms.onAlarm.addListener((alarm) => {
      void this._controller.handleAlarm(alarm)
    })

    // Active listener
    browser.tabs.onActivated.addListener(({ tabId }) => {
      void this._controller.handleTabActivated(tabId)
    })

    browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      void this._controller.handleTabUpdated(tabId, changeInfo, tab.url)
    })

    browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      const response = this._controller.handleMessage(message)
      if (response) {
        void response.then(sendResponse).catch(() => sendResponse(undefined))
        return true
      }

      sendResponse(undefined)
      return true
    })
  }
}

export default BackgroundApp.getInstance()
