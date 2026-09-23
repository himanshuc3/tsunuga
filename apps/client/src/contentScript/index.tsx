import { createRoot, type Root } from 'react-dom/client'
import type { ExtensionMessage } from '../common/messaging/messages'
import type { PendingCard } from '../common/types'
import browser from 'webextension-polyfill'
import { Card } from './Card'
import cssText from './Card.css?inline'
import fontCssText from '../assets/fonts/fonts.css?inline'
import extraLightFontUrl from '../assets/fonts/BricolageGrotesque_24pt-ExtraLight.ttf?url'
import lightFontUrl from '../assets/fonts/BricolageGrotesque_24pt-Light.ttf?url'
import regularFontUrl from '../assets/fonts/BricolageGrotesque_24pt-Regular.ttf?url'
import mediumFontUrl from '../assets/fonts/BricolageGrotesque_24pt-Medium.ttf?url'
import semiBoldFontUrl from '../assets/fonts/BricolageGrotesque_24pt-SemiBold.ttf?url'
import boldFontUrl from '../assets/fonts/BricolageGrotesque_24pt-Bold.ttf?url'
import extraBoldFontUrl from '../assets/fonts/BricolageGrotesque_24pt-ExtraBold.ttf?url'
import { StyleProvider } from '@ant-design/cssinjs'
import { sendMessage } from '../common/helpers'

const HOST_ID = 'tango-extension-host'
const fontStyleText = fontCssText
  .replaceAll('__BRICOLAGE_EXTRA_LIGHT__', extraLightFontUrl)
  .replaceAll('__BRICOLAGE_LIGHT__', lightFontUrl)
  .replaceAll('__BRICOLAGE_REGULAR__', regularFontUrl)
  .replaceAll('__BRICOLAGE_MEDIUM__', mediumFontUrl)
  .replaceAll('__BRICOLAGE_SEMIBOLD__', semiBoldFontUrl)
  .replaceAll('__BRICOLAGE_BOLD__', boldFontUrl)
  .replaceAll('__BRICOLAGE_EXTRA_BOLD__', extraBoldFontUrl)

class Controller {
  private static _instance: Controller
  private _root: null | Root = null
  private _shadow: ShadowRoot | null = null
  private _currentCardId: string | null = null

  static getInstance() {
    if (!Controller._instance) {
      Controller._instance = new Controller()
    }
    return Controller._instance
  }
  constructor() {
    this._attachMessagingLayer()
  }

  private _attachMessagingLayer() {
    browser.runtime.onMessage.addListener((message: any) => {
      switch (message.type) {
        case 'SHOW_CARD': {
          if (this._currentCardId === message.card.id && document.getElementById(HOST_ID)) {
            return
          }
          this.showCard(message.card)
          break
        }
        case 'HIDE_CARD': {
          this.hideCard()
          break
        }
      }
    })
  }

  public async sendAnswer(cardId: string, choice: string, correct: boolean): Promise<void> {
    await sendMessage({
      type: 'ANSWER',
      cardId,
      choice,
      correct,
    })
  }

  public sendDismiss(cardId: string): void {
    sendMessage({ type: 'DISMISS', cardId })
  }

  public hideCard(): void {
    this._destroyMount()
  }

  private _destroyMount(): void {
    const host = document.getElementById(HOST_ID)
    if (this._root) {
      this._root.unmount()
      this._root = null
    }
    host?.remove()
    this._shadow = null
    this._currentCardId = null
  }

  public showCard(card: PendingCard): void {
    this._ensureMount()
    this._currentCardId = card.id
    this._root?.render(
      <StyleProvider container={this._shadow!}>
        <Card
          card={card}
          onAnswer={(choice, correct) => this.sendAnswer(card.id, choice, correct)}
          onAck={() => this.sendAnswer(card.id, '', true)}
          onDismiss={() => this.sendDismiss(card.id)}
        />
      </StyleProvider>,
    )
  }

  private _ensureMount(): HTMLElement {
    let host = document.getElementById(HOST_ID)
    if (!host) {
      host = document.createElement('div')
      host.id = HOST_ID
      host.style.all = 'initial'
      document.documentElement.appendChild(host)
      this._shadow = host.attachShadow({ mode: 'open' })
      const style = document.createElement('style')
      style.textContent = `${fontStyleText}\n${cssText}`
      this._shadow.appendChild(style)
      const mount = document.createElement('div')
      mount.className = 'tango-root'
      this._shadow.appendChild(mount)
      this._root = createRoot(mount)
    } else if (!this._shadow) {
      this._shadow = host.shadowRoot
    }
    return host
  }
}

Controller.getInstance()
