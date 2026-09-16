import { defineManifest } from '@crxjs/vite-plugin'
import packageData from '../package.json'

//@ts-ignore
const isDev = process.env.NODE_ENV == 'development'

export default defineManifest({
  name: `${packageData.displayName || packageData.name}${isDev ? ` ➡️ Dev` : ''}`,
  description:
    packageData.description ||
    'Learn Japanese through mini-lessons that appear as cards while you browse.',
  version: packageData.version,
  key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAoq9PKd6mkf7O1MZweIWM9JGH/LjaUabi7TpbWBGkpzRG7RcNDJHb5UMq/soCb+1Ts/ftPJ33s7iFEv3LNYZpyN3511SPekeJcLmLBc+f8LjdVuNE8XqfAVhUWdhY4u4onT3S4VJazEY8uoIDgdu9KyNFi/1k1MNAf35UM3xpXDzkLo11q1K9WEtMdJoWUg1dwFpzIGDAre+xbLkZ1wRed/FZ3BxakTIvz1GtCt8mXHjSKw2VSpk4JwsoUJ1mKlHEoFFrZHYrvqPeucD6hOSTd/7SQ+zAsYULnoCGpMKQVq7r0knJvQghEQy2xORps8AaDY+jptp31LzxlC4Sc2g5KQIDAQAB',
  manifest_version: 3,
  oauth2: {
    client_id: '724231659822-bc6dl7t8vkk94maq25lh8gsk00pe6478.apps.googleusercontent.com',
    scopes: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/contacts.readonly',
    ],
  },
  icons: {
    16: 'img/logo-16.png',
    32: 'img/logo-32.png',
    48: 'img/logo-48.png',
    128: 'img/logo-128.png',
  },
  action: {
    default_popup: 'popup.html',
    default_icon: 'img/logo-48.png',
    default_title: 'tsunagu',
  },
  options_page: 'options.html',
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['http://*/*', 'https://*/*'],
      js: ['src/contentScript/index.tsx'],
    },
  ],
  side_panel: {
    default_path: 'sidepanel.html',
  },
  commands: {
    _execute_action: {
      suggested_key: {
        default: 'Alt+Shift+T',
        mac: 'Alt+Shift+T',
      },
    },
    'open-side-panel': {
      description: 'Open tsunagu side panel',
    },
  },
  web_accessible_resources: [
    {
      resources: ['img/logo-16.png', 'img/logo-32.png', 'img/logo-48.png', 'img/logo-128.png'],
      matches: [],
    },
  ],
  permissions: [
    'sidePanel',
    'storage',
    'alarms',
    'tabs',
    'scripting',
    'activeTab',
    'identity',
    'identity.email',
  ],
  host_permissions: ['http://*/*', 'https://*/*'],
})
