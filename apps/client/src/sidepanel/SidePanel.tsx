import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Button,
  Collapse,
  ConfigProvider,
  Flex,
  Layout,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd'
import {
  CheckCircleFilled,
  LockOutlined,
  PauseOutlined,
  PlayCircleOutlined,
  SendOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { lessons } from '../content/lessons'
import {
  countMasteredInLesson,
  getOrCreateProgress,
  isLessonUnlocked,
  progressKey,
} from '../domain/progress'
import type { AppState, Lesson } from '../domain/types'
import { MASTERY_STREAK } from '../domain/types'
import './SidePanel.css'
import { openPopupWithSettings, sendMessage } from '../common/helpers'

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

function LessonDetails({ state, lesson }: { state: AppState; lesson: Lesson }) {
  return (
    <div className="lesson-details">
      {lesson.vocab.length > 0 && (
        <div className="detail-group">
          <Text className="detail-group-title">Vocabulary</Text>
          <div className="detail-items">
            {lesson.vocab.map((item) => {
              const progress = getOrCreateProgress(state, progressKey(lesson.id, 'vocab', item.id))
              const mastered = progress.correctStreak >= MASTERY_STREAK
              return (
                <Flex key={item.id} className="detail-item" align="center" justify="space-between">
                  <div className="detail-item-copy">
                    <Text className="detail-item-romaji">{item.romaji}</Text>
                    <Text className="detail-item-en">{item.en}</Text>
                  </div>
                  <Tag className="streak-tag" color={mastered ? 'success' : undefined}>
                    {mastered && <CheckCircleFilled />}
                    {progress.correctStreak}/{MASTERY_STREAK} streak
                  </Tag>
                </Flex>
              )
            })}
          </div>
        </div>
      )}
      {lesson.concepts.length > 0 && (
        <div className="detail-group">
          <Text className="detail-group-title">Concepts</Text>
          <div className="detail-items">
            {lesson.concepts.map((concept) => {
              const progress = getOrCreateProgress(
                state,
                progressKey(lesson.id, 'concept', concept.id),
              )
              return (
                <Flex
                  key={concept.id}
                  className="detail-item"
                  align="center"
                  justify="space-between"
                >
                  <Text className="detail-item-en">{concept.title}</Text>
                  <Tag className="streak-tag" color={progress.conceptShown ? 'success' : undefined}>
                    {progress.conceptShown && <CheckCircleFilled />}
                    {progress.conceptShown ? 'Seen' : 'Not seen'}
                  </Tag>
                </Flex>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export const SidePanel = () => {
  const [state, setState] = useState<AppState | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [currentLessonExpanded, setCurrentLessonExpanded] = useState(false)

  const refresh = useCallback(async () => {
    const stored = await chrome.storage.local.get('authToken')
    const authenticated = Boolean(stored.authToken)
    setIsAuthenticated(authenticated)

    if (!authenticated) {
      setState(null)
      return
    }

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

  const openSettings = () => {
    void openPopupWithSettings()
  }

  async function loginViaGoogle() {
    try {
      setBusy(true)
      await sendMessage({ type: 'AUTH_TOKEN' })
      await refresh()
    } catch (error) {
      console.error('Unable to get auth token', error)
    } finally {
      setBusy(false)
    }
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
      Button: {
        primaryColor: '#0f1012',
        colorPrimaryHover: '#c9ff85',
        boxShadow: 'none',
        primaryShadow: 'none',
        defaultShadow: 'none',
        dangerShadow: 'none',
      },
    },
  }

  if (isAuthenticated === false) {
    const stats = [
      { value: '150+', label: 'vocab cards' },
      { value: '16+', label: 'concepts' },
      { value: 'N5', label: 'level grammar' },
    ]

    return (
      <ConfigProvider theme={theme}>
        <Layout className="sidepanel logged-out-sidepanel">
          <div className="logged-out-shell">
            <header className="logged-out-header">
              <div className="brand-mark">つ</div>
              <div className="brand-name">tango</div>
            </header>

            <div className="logged-out-card-wrap">
              <div className="logged-out-card">
                {stats.map((stat, index) => (
                  <div
                    key={stat.label}
                    className="stat-item"
                    style={{ ['--delay' as any]: `${index * 220}ms` }}
                  >
                    <div className="stat-value">{stat.value}</div>
                    <div className="stat-label">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <Button
              className="google-login-button"
              type="primary"
              size="large"
              icon={<span className="google-glyph">G</span>}
              onClick={() => void loginViaGoogle()}
              disabled={busy}
            >
              Login with Google
            </Button>
          </div>
        </Layout>
      </ConfigProvider>
    )
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
        <Content className="sidepanel-content">
          <section className="current-lesson-panel row">
            <Collapse
              className="current-lesson-collapse"
              ghost
              expandIconPosition="end"
              activeKey={currentLessonExpanded ? ['current'] : []}
              onChange={(keys) =>
                setCurrentLessonExpanded(Array.isArray(keys) ? keys.length > 0 : Boolean(keys))
              }
              items={[
                {
                  key: 'current',
                  label: (
                    <div className="current-lesson-summary">
                      <Text className="panel-title">Current lesson</Text>
                      <Title level={5} className="lesson-title">
                        {current?.title ?? '—'}
                      </Title>
                      <Text className="muted">
                        {progress.total > 0
                          ? `${progress.mastered}/${progress.total} mastered`
                          : 'Concepts in progress'}
                      </Text>
                    </div>
                  ),
                  children: current ? (
                    <LessonDetails state={state} lesson={current} />
                  ) : (
                    <Text className="muted">No lesson in progress.</Text>
                  ),
                },
              ]}
            />
          </section>

          <section className="actions-row row">
            <Flex className="actions" align="center" justify="space-between">
              <Button type="primary" icon={<SendOutlined />} onClick={forceCard} disabled={busy}>
                Show card now
              </Button>
              <Space size={4}>
                <Button
                  aria-label={state.settings.paused ? 'Resume' : 'Pause'}
                  type="text"
                  icon={state.settings.paused ? <PlayCircleOutlined /> : <PauseOutlined />}
                  onClick={togglePause}
                  disabled={busy}
                />
                <Button
                  aria-label="Open settings"
                  type="text"
                  icon={<SettingOutlined />}
                  onClick={openSettings}
                />
              </Space>
            </Flex>
          </section>
          <hr className="divider" />

          <section className="path-panel row">
            <Text className="panel-title">Path</Text>
            <Collapse
              className="lesson-collapse"
              accordion
              defaultActiveKey={state.currentLessonId ?? undefined}
              items={lessons.map((lesson) => {
                const unlocked = isLessonUnlocked(state, lesson)
                const done = state.completedLessonIds.includes(lesson.id)
                const { mastered, total } = countMasteredInLesson(state, lesson)
                return {
                  key: lesson.id,
                  collapsible: unlocked ? undefined : 'disabled',
                  className: [done ? 'done' : '', !unlocked ? 'locked' : '']
                    .filter(Boolean)
                    .join(' '),
                  label: (
                    <Flex align="center" justify="space-between" className="lesson-collapse-header">
                      <Text className="lesson-name">
                        {done ? 'Done · ' : !unlocked ? 'Locked · ' : ''}
                        {lesson.title}
                      </Text>
                      <Tag className="lesson-meta-tag">
                        {!unlocked ? (
                          <LockOutlined />
                        ) : total > 0 ? (
                          `${mastered}/${total}`
                        ) : done ? (
                          'Done'
                        ) : (
                          'Open'
                        )}
                      </Tag>
                    </Flex>
                  ),
                  children: unlocked ? <LessonDetails state={state} lesson={lesson} /> : null,
                }
              })}
            />
          </section>
        </Content>
      </Layout>
    </ConfigProvider>
  )
}

export default SidePanel
