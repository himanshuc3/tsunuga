import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Avatar,
  Button,
  ConfigProvider,
  Layout,
  Space,
  Spin,
  Slider,
  Tag,
  Flex,
  Typography,
} from 'antd'
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  PlayCircleOutlined,
  SaveOutlined,
  SendOutlined,
  PauseOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons'
import browser from 'webextension-polyfill'
import type { AppState, QuietHour, Settings } from '../domain/types'
import './Popup.css'
import { OPEN_SETTINGS_ON_LOAD_KEY, openSidePanel, sendMessage } from '../common/helpers'
import { getNextLesson, lessons } from '../content/lessons'
import { getOrCreateProgress, progressKey } from '../domain/progress'

const { Content } = Layout
const { Text, Title } = Typography

async function fetchState(): Promise<AppState> {
  const res: any = await browser.runtime.sendMessage({ type: 'GET_STATE' })
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
  const [showSettings, setShowSettings] = useState(false)
  const [settingsDraft, setSettingsDraft] = useState<Settings | null>(null)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [settingsSaved, setSettingsSaved] = useState(false)

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
    const nextState = res as { state: AppState }
    setState(nextState.state)
    setSettingsDraft((previous) =>
      previous ? { ...previous, paused: nextState.state.settings.paused } : previous,
    )
    setBusy(false)
  }

  const forceCard = async () => {
    setBusy(true)
    setStatusMsg(null)
    try {
      // TODO[ts]: Remove all references to any
      const res: any = await sendMessage({ type: 'FORCE_CARD' })
      if (res?.state) setState(res?.state as AppState)
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

  const openSettings = () => {
    if (!state) return
    setSettingsDraft({
      ...state.settings,
      quietHours: state.settings.quietHours.map((quietHour) => ({ ...quietHour })),
    })
    setSettingsError(null)
    setSettingsSaved(false)
    setShowSettings(true)
  }

  useEffect(() => {
    if (!state) return
    void (async () => {
      const stored = await browser.storage.local.get(OPEN_SETTINGS_ON_LOAD_KEY)
      if (!stored[OPEN_SETTINGS_ON_LOAD_KEY]) return
      await browser.storage.local.remove(OPEN_SETTINGS_ON_LOAD_KEY)
      openSettings()
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettingsDraft((previous) => (previous ? { ...previous, [key]: value } : previous))
    setSettingsError(null)
    setSettingsSaved(false)
  }

  const updateQuietHour = (index: number, patch: Partial<QuietHour>) => {
    if (!settingsDraft) return
    updateSetting(
      'quietHours',
      settingsDraft.quietHours.map((quietHour, quietHourIndex) =>
        quietHourIndex === index ? { ...quietHour, ...patch } : quietHour,
      ),
    )
  }

  const saveSettings = async () => {
    if (!settingsDraft) return
    if (settingsDraft.minIntervalMin < 1 || settingsDraft.maxIntervalMin < 1) {
      setSettingsError('Intervals must be at least 1 minute.')
      return
    }
    if (settingsDraft.minIntervalMin > settingsDraft.maxIntervalMin) {
      setSettingsError('Minimum interval cannot exceed maximum.')
      return
    }

    setBusy(true)
    setSettingsError(null)
    const res = await browser.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      settings: settingsDraft,
    })
    const nextState = res as { state: AppState }
    setState(nextState.state)
    setSettingsDraft({
      ...nextState.state.settings,
      quietHours: nextState.state.settings.quietHours.map((quietHour) => ({ ...quietHour })),
    })
    setSettingsSaved(true)
    setBusy(false)
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

  const activeLesson = lessons.find(
    (lesson) => lesson.id === (state.pendingCard?.lessonId ?? state.currentLessonId),
  )
  const currentLesson = lessons.find((lesson) => lesson.id === state.currentLessonId)
  const upcomingLesson = currentLesson ? getNextLesson(currentLesson.id) : undefined
  const completedConcepts =
    activeLesson?.concepts.filter((concept) => {
      const key = progressKey(activeLesson.id, 'concept', concept.id)
      return getOrCreateProgress(state, key).conceptShown
    }).length ?? 0
  const conceptCount = activeLesson?.concepts.length ?? 0
  const completionPercent = conceptCount ? Math.round((completedConcepts / conceptCount) * 100) : 0

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
            {showSettings && (
              <Button
                aria-label="Back to popup"
                type="text"
                icon={<ArrowDownOutlined rotate={90} />}
                onClick={() => setShowSettings(false)}
              />
            )}
            <Avatar className="brand-avatar" size="small">
              つ
            </Avatar>
            <Title level={5}>{showSettings ? 'Settings' : 'tsunagu'}</Title>
            {/* <Badge status={state.settings.paused ? 'default' : 'success'} /> */}
          </Space>
          <Flex className="popup-right">
            <Button
              aria-label="Pause extension"
              type="text"
              icon={state.settings.paused ? <PlayCircleOutlined /> : <PauseOutlined />}
              onClick={() => void togglePause()}
              disabled={busy}
            />
            {showSettings && (
              <Button
                className="settings-save-button"
                aria-label="Save settings"
                type="text"
                icon={<SaveOutlined />}
                onClick={() => void saveSettings()}
                disabled={busy}
              />
            )}
            {!showSettings && (
              <>
                <Button
                  aria-label="Open settings"
                  type="text"
                  icon={<SettingOutlined />}
                  onClick={openSettings}
                />
                <Button
                  aria-label="Open settings"
                  type="text"
                  icon={<UserOutlined />}
                  onClick={openSettings}
                />
              </>
            )}
          </Flex>
        </header>

        {showSettings && settingsDraft ? (
          <Content className="popup-content settings-content">
            <section className="settings-section">
              <Title level={4}>Sampling interval</Title>
              <div className="settings-range-label">
                <span>{settingsDraft.minIntervalMin} min</span>
                <span>{settingsDraft.maxIntervalMin} min</span>
              </div>
              <Slider
                className="settings-range"
                range
                min={1}
                max={120}
                value={[settingsDraft.minIntervalMin, settingsDraft.maxIntervalMin]}
                onChange={(value) => {
                  if (Array.isArray(value)) {
                    updateSetting('minIntervalMin', value[0])
                    updateSetting('maxIntervalMin', value[1])
                  }
                }}
              />
            </section>

            <section className="settings-section">
              <Title level={4}>Quiet hours</Title>
              {settingsDraft.quietHours.map((quietHour, index) => (
                <div
                  className="quiet-hour-row"
                  key={`${quietHour.start}-${quietHour.end}-${index}`}
                >
                  <input
                    type="time"
                    value={quietHour.start}
                    onChange={(event) => updateQuietHour(index, { start: event.target.value })}
                  />
                  <span>to</span>
                  <input
                    type="time"
                    value={quietHour.end}
                    onChange={(event) => updateQuietHour(index, { end: event.target.value })}
                  />
                  <Button
                    type="text"
                    onClick={() =>
                      updateSetting(
                        'quietHours',
                        settingsDraft.quietHours.filter(
                          (_, quietHourIndex) => quietHourIndex !== index,
                        ),
                      )
                    }
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                className="settings-secondary-action"
                type="default"
                onClick={() =>
                  updateSetting('quietHours', [
                    ...settingsDraft.quietHours,
                    { start: '22:00', end: '07:00' },
                  ])
                }
              >
                Add quiet hours
              </Button>
            </section>

            {settingsError && <Alert message={settingsError} type="error" showIcon />}
            {settingsSaved && (
              <div className="settings-saved-toast" role="status">
                Settings saved
              </div>
            )}
          </Content>
        ) : (
          <Content className="popup-content">
            <Flex className="lesson-summary">
              <Space align="start">
                {/* <Avatar className="lesson-icon" icon={<BookOutlined />} /> */}
                <div className="lesson-summary-copy">
                  <Flex>
                    <Title level={4}>{activeLesson?.title ?? 'Your next lesson'}</Title>
                  </Flex>
                  <Space className="lesson-counts" size={6} wrap>
                    <Tag className="lesson-count">
                      <strong>{activeLesson?.vocab.length ?? 0}</strong>
                      <span>vocab</span>
                    </Tag>
                    <Tag className="lesson-count">
                      <strong>{activeLesson?.concepts.length ?? 0}</strong>
                      <span>concepts</span>
                    </Tag>
                  </Space>
                </div>
              </Space>
              {upcomingLesson && (
                <Tag
                  className="upcoming-lesson"
                  color="green"
                  aria-label={`Up next: ${upcomingLesson.title}`}
                  tabIndex={0}
                >
                  <ThunderboltOutlined />
                  <span>Up next: {upcomingLesson.title}</span>
                </Tag>
              )}
              <div
                className="lesson-progress"
                role="progressbar"
                aria-label="Current block completion"
                aria-valuemin={0}
                aria-valuemax={conceptCount}
                aria-valuenow={completedConcepts}
              >
                <span className="lesson-progress-label">
                  Current block: {completedConcepts}/{conceptCount} concepts completed
                </span>
                <span className="lesson-progress-fill" style={{ width: `${completionPercent}%` }} />
              </div>
            </Flex>

            <section className="quick-actions" aria-label="Quick actions">
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
                icon={<ArrowUpOutlined />}
                onClick={openLearningPanel}
                disabled={busy}
              >
                Open
              </Button>
            </section>

            {/* {statusMsg && (
            <Alert className="status-alert" message={statusMsg} type="info" showIcon closable />
          )} */}
          </Content>
        )}

        <span className="creator-pill">
          Created by{' '}
          <a href="https://github.com/himanshu" target="_blank" rel="noreferrer">
            Himanshu
          </a>
        </span>
      </Layout>
    </ConfigProvider>
  )
}

export default Popup
