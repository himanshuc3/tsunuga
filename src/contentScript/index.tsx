import { createRoot, type Root } from 'react-dom/client'
import type { ExtensionMessage } from '../domain/messages'
import type { PendingCard } from '../domain/types'
import browser from 'webextension-polyfill'
import { Card } from './Card'
import cssText from './Card.css?inline'

const HOST_ID = 'tsunagu-extension-host'






class Controller{
  private static _instance: Controller
  private _root: null | Root = null
  private _shadow: ShadowRoot | null = null
  private _currentCardId: string | null = null

  static getInstance(){
    if(!Controller._instance){
      Controller._instance = new Controller()
    }
    return Controller._instance
  }
  constructor(){
    this._attachMessagingLayer()
  }

  private _attachMessagingLayer(){
    browser.runtime.onMessage.addListener((message: ExtensionMessage) => {
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

  public sendAnswer(cardId: string, choice: string, correct: boolean): void {
    browser.runtime.sendMessage({
      type: 'ANSWER',
      cardId,
      choice,
      correct,
    })
  }
  
  public sendDismiss(cardId: string): void {
    browser.runtime.sendMessage({ type: 'DISMISS', cardId })
  }
  
  

  public hideCard():void{
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
      <Card
        card={card}
        onAnswer={(choice, correct) => this.sendAnswer(card.id, choice, correct)}
        onAck={() => this.sendAnswer(card.id, '', true)}
        onDismiss={() => this.sendDismiss(card.id)}
      />,
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
      style.textContent = cssText
      this._shadow.appendChild(style)
      const mount = document.createElement('div')
      mount.className = 'tsunagu-root'
      this._shadow.appendChild(mount)
      this._root = createRoot(mount)
    } else if (!this._shadow) {
      this._shadow = host.shadowRoot
    }
    return host
  }
  

}

Controller.getInstance()

