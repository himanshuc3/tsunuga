# tsunagu

Chrome extension that teaches Japanese through sequential mini-lessons. Cards appear at the bottom-right of the active tab at sampled times; a pending card follows you across tabs until you answer or dismiss it.

## Features (MVP)

- 8 locked lessons: hiragana rows + greetings/nouns vocab
- Color-coded cards: intro (blue), concept (slate), test (amber)
- Quiet hours and random interval sampling (`chrome.alarms`)
- Progress and pause in the popup; intervals/quiet hours in Options

## Setup

1. Node.js >= 14
2. `npm install`
3. `npm run dev` or `npm run build`
4. Chrome → Extensions → Developer mode → Load unpacked → select `build/`

Open a normal `http(s)` page, then use the popup **Show card now** to try a lesson immediately.

See [TESTING.md](TESTING.md) for a manual QA checklist.

## Scripts

| Command        | Description                |
| -------------- | -------------------------- |
| `npm run dev`  | Vite + CRXJS watch build   |
| `npm run build`| Typecheck + production build |
| `npm run zip`  | Build and zip for packing  |
