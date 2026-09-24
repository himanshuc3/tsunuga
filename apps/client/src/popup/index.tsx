import React from 'react'
import ReactDOM from 'react-dom/client'
import { Popup } from './Popup'
import './index.css'
import ErrorBoundary from './ErrorBoundary'
import { ConfigProvider } from 'antd'

ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        algorithm: undefined,
        token: {
          colorPrimary: '#b7f36b',
          colorTextLightSolid: '#ffffff',
          colorText: '#f7f7f8',
          colorTextSecondary: '#9a99a5',
          colorBgContainer: '#202024',
          borderRadius: 12,
          fontFamily: "'Avenir Next', 'Segoe UI', sans-serif",
        },
        components: {
          Button: {
            primaryColor: '#1a3804',
            colorPrimaryHover: '#c9ff85',
            colorPrimaryActive: '#a6e25a',
            boxShadow: 'none',
            primaryShadow: 'none',
            defaultShadow: 'none',
            dangerShadow: 'none',
            fontWeight: 600,
          },
          Tooltip: {
            colorBgSpotlight: '#2a2a30',
            colorTextLightSolid: '#f7f7f8',
          },
          Tabs: { itemColor: '#777681', itemSelectedColor: '#f7f7f8', inkBarColor: '#b7f36b' },
        },
      }}
    >
      <ErrorBoundary>
        <Popup />
      </ErrorBoundary>
    </ConfigProvider>
  </React.StrictMode>,
)
