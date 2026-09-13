import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  ConfigProvider,
  Empty,
  Layout,
  Space,
  Spin,
  Tabs,
  Tag,
  Flex,
  Typography,
} from 'antd'
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  BookOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  SendOutlined,
  PauseOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  LoginOutlined,
  UserOutlined,
} from '@ant-design/icons'
import browser from 'webextension-polyfill'
import type { AppState } from '../domain/types'
import './Popup.css'
import { openSidePanel } from '../common/helpers'

const { Content } = Layout
const { Text, Title } = Typography

async function fetchState(): Promise<AppState> {
  const res = await browser.runtime.sendMessage({ type: 'GET_STATE' })
  return res.state as AppState
}

function forceResultMessage(result: { status: string } | undefined): string | null {
  switch (result?.status) {
    case 'shown':
      return 'Card shown on your active tab — look bottom-right.'
    case 'pending_no_tab':
      return 'Open a normal website tab (http/https), then try again.'
    case 'inject_failed':
      return 'Could not inject into this page. Refresh the tab and try again.'
    case 'paused':
      return 'Lessons are paused. Resume first, or try again.'
    case 'no_card':
      return 'No card available right now.'
    default:
      return null
  }
}

export const Popup = () => {
  const [state, setState] = useState<AppState | null>(null)
  const [busy, setBusy] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const s = await fetchState()
    setState(s)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const togglePause = async () => {
    if (!state) return
    setBusy(true)
    setStatusMsg(null)
    const res = await browser.runtime.sendMessage({
      type: 'SET_PAUSED',
      paused: !state.settings.paused,
    })
    setState(res.state as AppState)
    setBusy(false)
  }

  const forceCard = async () => {
    setBusy(true)
    setStatusMsg(null)
    try {
      const res = await browser.runtime.sendMessage({ type: 'FORCE_CARD' })
      if (res?.state) setState(res.state as AppState)
      else await refresh()
      setStatusMsg(forceResultMessage(res?.result))
    } catch {
      setStatusMsg('Extension background failed to respond. Reload the extension.')
    }
    setBusy(false)
  }

  const openLearningPanel = () => {
    openSidePanel()
    window.close()
  }

  const openOptions = () => {
    browser.runtime.openOptionsPage()
  }

  if (!state) {
    return (
      <ConfigProvider theme={{ token: { colorPrimary: '#b7f36b' } }}>
        <Layout className="popup loading-popup">
          <Spin size="large" />
        </Layout>
      </ConfigProvider>
    )
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: undefined,
        token: {
          colorPrimary: '#b7f36b',
          colorText: '#f7f7f8',
          colorTextSecondary: '#9a99a5',
          colorBgContainer: '#202024',
          borderRadius: 12,
          fontFamily: "'Avenir Next', 'Segoe UI', sans-serif",
        },
        components: {
          Button: { primaryColor: '#0f1012', colorPrimaryHover: '#c9ff85' },
          Tabs: { itemColor: '#777681', itemSelectedColor: '#f7f7f8', inkBarColor: '#b7f36b' },
        },
      }}
    >
      <Layout className="popup">
        <header className="popup-header">
          <Space className="popup-left">
            <Avatar className="brand-avatar" size="small">
              つ
            </Avatar>
            <Title level={5}>tsunagu</Title>
            {/* <Badge status={state.settings.paused ? 'default' : 'success'} /> */}
          </Space>
          <Flex className="popup-right">
            <Button
              aria-label="Pause extension"
              type="text"
              icon={state.settings.paused ? <PlayCircleOutlined /> : <PauseOutlined />}
              onClick={() => void refresh()}
            />
            <Button
              aria-label="Open settings"
              type="text"
              icon={<SettingOutlined />}
              onClick={openOptions}
            />
            <Button
              aria-label="Open settings"
              type="text"
              icon={<UserOutlined />}
              onClick={openOptions}
            />
          </Flex>
        </header>

        <Content className="popup-content">
          <section className="progress-summary">
            <Text className="progress-number">{state.pendingCard ? '1' : '0'}</Text>
            <Text className="progress-label">Cards ready to learn</Text>
            <Space className="summary-meta" size={8}>
              <Text>Today's progress</Text>
              <Text strong>+0 cards</Text>
              <BookOutlined />
            </Space>
          </section>

          <section className="quick-actions" aria-label="Quick actions">
            <Button
              className="quick-action"
              type="text"
              icon={<ArrowUpOutlined />}
              onClick={openLearningPanel}
              disabled={busy}
            >
              Open
            </Button>
            <Button
              className="quick-action"
              type="text"
              icon={<SendOutlined />}
              onClick={forceCard}
              disabled={busy}
            >
              Show card
            </Button>
            <Button
              className="quick-action"
              type="text"
              icon={<ArrowDownOutlined />}
              onClick={openOptions}
            >
              Settings
            </Button>
            <Button
              className="quick-action"
              type="text"
              icon={state.settings.paused ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
              onClick={togglePause}
              disabled={busy}
            >
              {state.settings.paused ? 'Resume' : 'Pause'}
            </Button>
          </section>

          <Card className="earn-banner" bordered={false}>
            <Avatar className="banner-icon" icon={<ThunderboltOutlined />} />
            <div>
              <Text strong>Make learning automatic</Text>
              <Text type="secondary">
                Keep tsunagu active while you browse to discover new cards.
              </Text>
            </div>
            <Tag color={state.settings.paused ? 'default' : 'green'}>
              {state.settings.paused ? 'Paused' : 'Live'}
            </Tag>
          </Card>

          {statusMsg && (
            <Alert className="status-alert" message={statusMsg} type="info" showIcon closable />
          )}

          <Tabs
            className="popup-tabs"
            defaultActiveKey="lessons"
            items={[
              {
                key: 'lessons',
                label: 'Lessons',
                children: state.pendingCard ? (
                  <Card className="pending-card" bordered={false}>
                    <Space align="start">
                      <Avatar className="lesson-icon" icon={<BookOutlined />} />
                      <div>
                        <Text strong>
                          {state.pendingCard.kind === 'concept'
                            ? state.pendingCard.title
                            : 'A lesson is ready'}
                        </Text>
                        <Text type="secondary">
                          Open the side panel to continue your Japanese practice.
                        </Text>
                      </div>
                    </Space>
                  </Card>
                ) : (
                  <Empty
                    className="empty-state"
                    image={<BookOutlined />}
                    description={<Text>Your next lesson will appear here</Text>}
                  />
                ),
              },
              {
                key: 'review',
                label: 'Review',
                children: (
                  <Empty
                    className="empty-state"
                    image={<EyeOutlined />}
                    description="Review history is empty"
                  />
                ),
              },
              {
                key: 'reference',
                label: 'Reference',
                children: (
                  <Empty
                    className="empty-state"
                    image={<ThunderboltOutlined />}
                    description="Your reference cards will appear here"
                  />
                ),
              },
              {
                key: 'activity',
                label: 'Activity',
                children: (
                  <Empty
                    className="empty-state"
                    image={<EyeInvisibleOutlined />}
                    description="No activity yet"
                  />
                ),
              },
            ]}
          />
        </Content>

        <footer className="popup-footer">
          <Button
            type="primary"
            block
            size="large"
            icon={<SendOutlined />}
            onClick={openSidePanel}
            disabled={busy}
          >
            Open learning panel
          </Button>
        </footer>
      </Layout>
    </ConfigProvider>
  )
}

export default Popup
