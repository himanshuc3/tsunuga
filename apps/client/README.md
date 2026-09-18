# tango Chrome extension

tango is a Chrome extension for learning Japanese in small, repeated sessions while browsing the web. It presents short lessons as unobtrusive cards in the active tab instead of requiring the learner to open a separate course application. Cards can be answered, dismissed, or followed across tabs until they are completed.

The current release is an MVP focused on hiragana, greetings, and basic vocabulary. Lesson content is bundled with the extension, so the core learning flow works locally without a remote content service.

## What it does

- Presents sequential mini-lessons as three card types: introduction, concept, and test.
- Samples the next lesson card at a configurable random interval.
- Supports quiet hours, pause/resume, and an immediate **Show card now** practice action.
- Keeps a pending card available when the user changes tabs or temporarily visits a restricted page.
- Tracks item mastery and unlocks later lessons as earlier lessons are completed.
- Provides a side panel for progress and controls, plus an Options page for interval and quiet-hour settings.
- Uses a toolbar badge to indicate that a card is waiting to be answered.

## How it works

The extension is a Manifest V3 application with three cooperating surfaces:

1. The background service worker owns scheduling, tab changes, state transitions, badge state, and messages between extension pages and content scripts.
2. The content script mounts lesson cards into normal `http://` and `https://` pages.
3. The popup, side panel, and Options page provide user controls and read/write the shared extension state.

Progress, settings, and the pending card are stored locally with `chrome.storage.local`. Scheduled prompts use `chrome.alarms`; the pending card is kept in storage when Chrome cannot inject into a restricted page and is shown again when an injectable tab becomes active.

Google OAuth and the Go backend are present as an integration path for authentication. The local extension defaults to an API at `localhost:8080`; authentication and production API use require the corresponding backend and OAuth configuration to be deployed and configured.

## Technology stack

- **Extension platform:** Chrome Manifest V3
- **Language:** TypeScript
- **UI:** React 18, React DOM, Ant Design, and Ant Design Icons
- **Build tooling:** Vite, `@crxjs/vite-plugin`, and the Vite React plugin
- **Browser API compatibility:** `webextension-polyfill` with Chrome type definitions
- **HTTP client:** Axios
- **Packaging:** Gulp and `gulp-zip`
- **Companion backend:** Go service in `apps/backend`, using Echo and PostgreSQL/Redis infrastructure for the wider application

## Prerequisites

- Node.js `>= 14.18.0` (a current LTS release is recommended)
- npm
- Google Chrome or another Chromium-based browser with Manifest V3 support
- Optional: the repository backend and its Docker/Go prerequisites when working on authentication or server-backed features

## Development setup

From this directory (`apps/client`):

```bash
npm install
npm run dev
```

`npm run dev` starts Vite in watch mode and writes the unpacked extension to `build/`. In Chrome:

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Choose the `apps/client/build` directory.
5. Open a normal `http://` or `https://` page and click the tango toolbar icon.

After source changes, use **Reload** on the extension card in `chrome://extensions` when the change affects the service worker or extension pages. Content-script changes may also require refreshing the web page.

### Optional backend

The client currently expects its local API at `localhost:8080`. To run the companion service, follow [the backend setup guide](../backend/README.md), including its environment file, database services, and `task dev` command. The extension's local auth flow also uses Google identity APIs, so a matching OAuth client configuration is required for sign-in testing.

## Commands

| Command           | Purpose                                                               |
| ----------------- | --------------------------------------------------------------------- |
| `npm run dev`     | Start the Vite development/watch build.                               |
| `npm run build`   | Run TypeScript checking and create a production build in `build/`.    |
| `npm run preview` | Serve the built output for local inspection.                          |
| `npm run fmt`     | Format TypeScript, JSON, CSS, SCSS, and Markdown files with Prettier. |
| `npm run zip`     | Build the extension and create a versioned archive in `package/`.     |

## Testing and QA

The project has a manual browser checklist in [TESTING.md](TESTING.md). It covers:

- scheduling, quiet hours, pause/resume, and manual practice;
- pending cards while switching tabs or visiting restricted pages;
- intro, concept, and test card behavior;
- lesson unlocking and progress counts; and
- badge and injection behavior.

For a quick smoke test, build the extension, load `build/` unpacked, open an ordinary HTTPS page, open the side panel, and use **Show card now**. Chrome internal pages such as `chrome://extensions` cannot receive content-script cards.

## Permissions and privacy considerations

The manifest requests the following capabilities:

- `storage` for local progress, settings, and pending-card state;
- `alarms` for spaced prompts;
- `tabs`, `activeTab`, and `scripting` to identify an active injectable tab and show cards;
- `sidePanel` for the progress/control surface;
- `identity` and `identity.email` for the Google sign-in integration; and
- HTTP(S) host access because cards are displayed on ordinary web pages.

The extension should request only the permissions needed by the shipped features. Before publishing, review every permission and the OAuth scope list in `src/manifest.ts`, add a public privacy policy that describes local storage and any account/API data flow, and ensure the Chrome Web Store privacy disclosures match the implementation.

## Production build and Chrome Web Store release

Create a release artifact with:

```bash
npm run build
npm run zip
```

The archive is written to `package/` with the extension name and manifest version. Before uploading it:

1. Update `version` and user-facing metadata in `package.json`.
2. Verify the generated `build/manifest.json`, icons, OAuth settings, API endpoint, host permissions, and content-script behavior against the production environment.
3. Test the exact built artifact by loading `build/` unpacked in a clean Chrome profile.
4. Confirm the production backend is reachable over HTTPS and that CORS, authentication, rate limits, and error handling are configured for the extension origin.
5. Prepare store assets: a concise description, screenshots, promotional images if required, support contact, and privacy policy URL.
6. In the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole), create or select the item, upload the ZIP produced from `build/`, complete the privacy and distribution declarations, and submit it for review.

The repository does not contain an automated Chrome Web Store publishing workflow. Store uploads and review submissions are therefore manual unless a future release pipeline is added. Never commit OAuth client secrets, backend secrets, signing credentials, or private store credentials.

## Project layout

```text
apps/client/
├── public/                 Static icons and images
├── src/
│   ├── background/         Service worker, scheduler, messaging, API client
│   ├── common/             Shared storage, helpers, and message types
│   ├── content/            Bundled lesson content
│   ├── contentScript/      Card injection into web pages
│   ├── options/             Settings page
│   ├── popup/               Toolbar popup
│   ├── sidepanel/           Progress and controls
│   ├── manifest.ts          Manifest V3 definition
│   └── zip.js               Release archive task
├── build/                  Generated unpacked extension output
├── package/                Generated release archives
├── TESTING.md              Manual QA checklist
├── package.json            Scripts, dependencies, and version
└── vite.config.ts          Vite and CRXJS configuration
```

Generated directories such as `build/` and `package/` should be recreated by the build scripts rather than edited by hand.

## Contributing

Keep changes focused, run `npm run build` before opening a pull request, and update [TESTING.md](TESTING.md) when a user-facing flow changes. For content changes, preserve the lesson order and the mastery rules used by the existing domain types.

## License

tango is distributed under the MIT License. See [LICENSE](LICENSE).
