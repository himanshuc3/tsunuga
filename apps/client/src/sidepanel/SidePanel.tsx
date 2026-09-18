import { useCallback, useEffect, useState } from 'react'
import { Alert, Avatar, Button, ConfigProvider, Flex, Layout, List, Space, Spin, Tag, Typography } from 'antd'
import { SendOutlined, SettingOutlined } from '@ant-design/icons'
import { lessons } from '../content/lessons'
import { countMasteredInLesson, isLessonUnlocked } from '../domain/progress'
import type { AppState } from '../domain/types'
import './SidePanel.css'
import { sendMessage } from '../common/helpers'

const { Content } = Layout
const { Text, Title } = Typography

async function fetchState(): Promise<AppState> {
  const res = await sendMessage({ type: 'GET_STATE' })
  return (res as any).state as AppState
}

function forceResultMessage(result: { status: string } | undefined): string | null {
  switch (result?.status) {
    case 'shown':
      return 'Card shown on your active tab — look bottom-right.'
    case 'pending_no_tab':
      return 'Open a normal website tab (http/https), then try again. Chrome pages cannot show cards.'
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

export const SidePanel = () => {
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
    const res: any = await sendMessage({
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
      const res: any = await sendMessage({ type: 'FORCE_CARD' })
      if (res?.state) setState(res.state as AppState)
      else await refresh()
      setStatusMsg(forceResultMessage(res?.result))
    } catch {
      setStatusMsg('Extension background failed to respond. Reload the extension.')
    }
    setBusy(false)
  }

  const openOptions = () => {
    ;(chrome as any).runtime.openOptionsPage()
  }

  const theme = {
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
    },
  }

  if (!state) {
    return (
      <ConfigProvider theme={theme}>
        <Layout className="sidepanel loading-sidepanel">
          <Spin size="large" />
        </Layout>
      </ConfigProvider>
    )
  }

  const current = lessons.find((l) => l.id === state.currentLessonId)
  const progress = current ? countMasteredInLesson(state, current) : { mastered: 0, total: 0 }

  return (
    <ConfigProvider theme={theme}>
      <Layout className="sidepanel">
        <header className="sidepanel-header">
          <Space align="center" size={8}>
            <Avatar className="brand-avatar" size="small">
              つ
            </Avatar>
            <Title level={4}>tsunagu</Title>
          </Space>
          <Text className="tagline">Japanese mini-lessons while you browse</Text>
        </header>

        <Content className="sidepanel-content">
          <section className="panel">
            <Flex align="center" justify="space-between">
              <Text className="label">Status</Text>
              <Tag color={state.settings.paused ? 'warning' : 'success'}>
                {state.settings.paused ? 'Paused' : 'Active'}
              </Tag>
            </Flex>
            {state.pendingCard && (
              <Alert
                className="pending-alert"
                type="warning"
                showIcon
                message="A card is waiting on your active tab."
              />
            )}
            {statusMsg && <Alert className="status-alert" type="info" showIcon message={statusMsg} />}
            <Space className="actions" wrap>
              <Button type="primary" onClick={togglePause} disabled={busy}>
                {state.settings.paused ? 'Resume' : 'Pause'}
              </Button>
              <Button
                type="default"
                icon={<SendOutlined />}
                onClick={forceCard}
                disabled={busy}
              >
                Show card now
              </Button>
            </Space>
          </section>

          <section className="panel">
            <Text className="panel-title">Current lesson</Text>
            <Title level={5} className="lesson-title">
              {current?.title ?? '—'}
            </Title>
            <Text className="muted">
              {progress.total > 0
                ? `${progress.mastered}/${progress.total} mastered`
                : 'Concepts in progress'}
            </Text>
          </section>

          <section className="panel">
            <Text className="panel-title">Path</Text>
            <List
              className="lesson-list"
              itemLayout="horizontal"
              dataSource={lessons}
              renderItem={(lesson) => {
                const unlocked = isLessonUnlocked(state, lesson)
                const done = state.completedLessonIds.includes(lesson.id)
                const active = lesson.id === state.currentLessonId
                const { mastered, total } = countMasteredInLesson(state, lesson)
                return (
                  <List.Item
                    className={[
                      done ? 'done' : '',
                      active ? 'active' : '',
                      !unlocked ? 'locked' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <Text className="lesson-name">
                      {done ? 'Done · ' : !unlocked ? 'Locked · ' : active ? 'Now · ' : ''}
                      {lesson.title}
                    </Text>
                    <Text className="lesson-meta">
                      {!unlocked
                        ? 'Locked'
                        : total > 0
                          ? `${mastered}/${total}`
                          : done
                            ? 'Done'
                            : 'Open'}
                    </Text>
                  </List.Item>
                )
              }}
            />
          </section>
        </Content>

        <footer className="sidepanel-footer">
          <Button type="text" icon={<SettingOutlined />} onClick={openOptions}>
            Settings
          </Button>
        </footer>
      </Layout>
    </ConfigProvider>
  )
}

export default SidePanel
