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
  manifest_version: 3,
  icons: {
    16: 'img/logo-16.png',
    32: 'img/logo-32.png',
    48: 'img/logo-48.png',
    128: 'img/logo-128.png',
  },
  action: {
    default_icon: 'img/logo-48.png',
    default_title: 'Open tsunagu side panel',
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
  permissions: ['sidePanel', 'storage', 'alarms', 'tabs', 'scripting', 'activeTab'],
  host_permissions: ['http://*/*', 'https://*/*'],
})
