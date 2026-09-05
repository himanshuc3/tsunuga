# Tsunagu manual test checklist

## Setup

1. `npm install`
2. `npm run dev` (or `npm run build` and load `build/`)
3. Chrome → Extensions → Load unpacked → select `build/`
4. Open a normal `https://` page (not `chrome://` and not the extension’s own pages)

## Scheduling and quiet hours

- [ ] With default intervals, a card eventually appears (or use side panel **Show card now**)
- [ ] Options: set min/max to `1` / `1`, save — next card after dismiss arrives ~1 minute later
- [ ] Add quiet hours covering “now”, save — scheduled alarms skip the window; **Show card now** still works (bypasses quiet hours for manual practice)
- [ ] Pause from side panel — no new cards; resume restores scheduling

## Follow active tab

- [ ] Trigger a card on tab A
- [ ] Switch to tab B (`https://`) — same pending card appears bottom-right
- [ ] Switch to `chrome://extensions` — card cannot inject; return to an `https://` tab — card remounts
- [ ] Action badge shows `!` while a card is pending; clears after answer/dismiss

## Card types and colors

- [ ] Intro card: blue top border, “New”, Got it advances
- [ ] Concept card: slate top border, Continue marks concept shown
- [ ] Test card: amber top border, choices; correct/incorrect feedback then closes
- [ ] Dismiss (×) clears the card without granting mastery streak

## Lesson gating

- [ ] Side panel path shows lesson 1 open; later lessons locked
- [ ] Master items in current lesson (2 correct tests each + concepts) — next lesson unlocks
- [ ] Progress counts update in side panel (`mastered/total`)

## Restricted pages

- [ ] Pending card on a restricted page stays in storage (badge `!`) until an injectable tab is focused
