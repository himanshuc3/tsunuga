import { createRoot, type Root } from 'react-dom/client'
import type { ExtensionMessage } from '../domain/messages'
import type { PendingCard } from '../domain/types'
import { Card } from './Card'
import cssText from './Card.css?inline'

const HOST_ID = 'tsunagu-extension-host'

let root: Root | null = null
let shadow: ShadowRoot | null = null
let currentCardId: string | null = null

function ensureMount(): HTMLElement {
  let host = document.getElementById(HOST_ID)
  if (!host) {
    host = document.createElement('div')
    host.id = HOST_ID
    host.style.all = 'initial'
    document.documentElement.appendChild(host)
    shadow = host.attachShadow({ mode: 'open' })
    const style = document.createElement('style')
    style.textContent = cssText
    shadow.appendChild(style)
    const mount = document.createElement('div')
    mount.className = 'tsunagu-root'
    shadow.appendChild(mount)
    root = createRoot(mount)
  } else if (!shadow) {
    shadow = host.shadowRoot
  }
  return host
}

function destroyMount(): void {
  const host = document.getElementById(HOST_ID)
  if (root) {
    root.unmount()
    root = null
  }
  host?.remove()
  shadow = null
  currentCardId = null
}

function sendAnswer(cardId: string, choice: string, correct: boolean): void {
  chrome.runtime.sendMessage({
    type: 'ANSWER',
    cardId,
    choice,
    correct,
  })
}

function sendDismiss(cardId: string): void {
  chrome.runtime.sendMessage({ type: 'DISMISS', cardId })
}

function showCard(card: PendingCard): void {
  ensureMount()
  currentCardId = card.id
  root?.render(
    <Card
      card={card}
      onAnswer={(choice, correct) => sendAnswer(card.id, choice, correct)}
      onAck={() => sendAnswer(card.id, '', true)}
      onDismiss={() => sendDismiss(card.id)}
    />,
  )
}

function hideCard(): void {
  destroyMount()
}

chrome.runtime.onMessage.addListener((message: ExtensionMessage) => {
  if (message.type === 'SHOW_CARD') {
    if (currentCardId === message.card.id && document.getElementById(HOST_ID)) {
      return
    }
    showCard(message.card)
  }
  if (message.type === 'HIDE_CARD') {
    hideCard()
  }
})
