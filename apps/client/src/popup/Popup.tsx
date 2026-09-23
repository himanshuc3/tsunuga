import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  ConfigProvider,
  Layout,
  Space,
  Spin,
  Slider,
  Switch,
  Progress,
  Tag,
  Flex,
  Tooltip,
  Typography,
} from 'antd'
import browser from 'webextension-polyfill'
import {
  ArrowDownOutlined,
  GoogleOutlined,
  MenuUnfoldOutlined,
  PoweroffOutlined,
  SaveOutlined,
  SendOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  HeartFilled,
  IdcardFilled,
} from '@ant-design/icons'
import { gsap } from 'gsap'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import type { AppState, QuietHour, Settings } from '../common/types'
import './Popup.css'
import { getNextLesson, openSidePanel, sendMessage } from '../common/helpers'
import { countMasteredInLesson, getOrCreateProgress, progressKey } from '../domain/progress'
import logoTree from '../assets/logo_tree.svg?raw'
import logo from '../assets/logo.svg'

gsap.registerPlugin(DrawSVGPlugin)

function AnimatedLogoTree() {
  const logoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!logoRef.current) return

    const context = gsap.context(() => {
      gsap.from('.branch', {
        duration: 1,
        drawSVG: '50% 50%',
        ease: 'power2.out',
        repeat: 0,
      })

      gsap.from('.outward-path', {
        duration: 1,
        delay: 0.9,
        drawSVG: '0% 0%',
        ease: 'power2.out',
        repeat: 0,
      })

      gsap.to('.shape', {
        duration: 1.4,
        x: 4,
        y: -4,
        rotation: 8,
        transformOrigin: '50% 50%',
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        stagger: 0.2,
      })
    }, logoRef)

    return () => context.revert()
  }, [])

  return <div ref={logoRef} className="brand-tree" dangerouslySetInnerHTML={{ __html: logoTree }} />
}

const { Content } = Layout
const { Title, Text, Paragraph } = Typography

const loggedOutStats = [
  {
    stat: '200',
    desc: 'categorized vocab cards',
  },
  {
    stat: '15',
    desc: 'concepts to reach N5',
  },
  {
    stat: '5',
    desc: 'settings to tweak for learning',
  },
]

async function fetchState(): Promise<AppState> {
  const res = (await sendMessage({ type: 'GET_STATE' })) as { state: AppState }
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

const keysForChange = new Set([
  'currentLessonId',
  'completedLessonIds',
  'itemProgress',
  'settings',
  'pendingCard',
  'lessons',
])
export const Popup = () => {
  const [state, setState] = useState<AppState | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [settingsDraft, setSettingsDraft] = useState<Settings | null>(null)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [loggedOutStatIndex, setLoggedOutStatIndex] = useState(0)
  const [loggedInStatIndex, setLoggedInStatIndex] = useState(0)
  const posterRef = useRef<HTMLDivElement>(null)
  const loggedInPosterRef = useRef<HTMLDivElement>(null)
  const settingsIconRef = useRef<HTMLSpanElement>(null)

  const twistSettingsIconIn = () => {
    gsap.to(settingsIconRef.current, { rotate: 90, duration: 0.35, ease: 'back.out(2)' })
  }

  const twistSettingsIconOut = () => {
    gsap.to(settingsIconRef.current, { rotate: 0, duration: 0.3, ease: 'power2.out' })
  }

  useEffect(() => {
    async function getData() {
      const data = await browser.storage.local.get([...keysForChange])

      setState(data)
    }
    getData()

    browser.storage.onChanged.addListener(async (changes, areaName) => {
      if (areaName !== 'local') return

      if (Object.keys(changes).find((key) => keysForChange.has(key))) {
        getData()
        return
      }
    })
  }, [])

  useEffect(() => {
    if (!posterRef.current || isAuthenticated !== false) return

    const context = gsap.context(() => {
      const poster = posterRef.current
      if (!poster) return

      gsap.fromTo(
        poster.querySelector('.stat'),
        { autoAlpha: 0, y: 16 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.42,
          ease: 'power3.out',
          delay: loggedOutStatIndex === 0 ? 0 : 0.12,
        },
      )

      gsap.fromTo(
        poster.querySelector('.subtext'),
        { autoAlpha: 0, y: 16 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.42,
          ease: 'power3.out',
          delay: (loggedOutStatIndex === 0 ? 0 : 0.12) + 0.15,
        },
      )

      gsap.delayedCall(3.4, () => {
        gsap.to(poster, {
          autoAlpha: 0,
          y: -16,
          duration: 0.32,
          ease: 'power2.in',
          onComplete: () => {
            setLoggedOutStatIndex((index) => (index + 1) % loggedOutStats.length)
          },
        })
      })
    }, posterRef)

    return () => context.revert()
  }, [isAuthenticated, loggedOutStatIndex])

  const masteredVocabCount = state
    ? state.lessons.reduce((acc, lesson) => acc + countMasteredInLesson(state, lesson).mastered, 0)
    : 10
  const totalVocabCount = state
    ? state.lessons.reduce((acc, lesson) => acc + lesson.vocab.length, 0)
    : 230
  const completedLessonCount = state?.completedLessonIds?.length ?? 0
  const totalLessonCount = state?.lessons?.length ?? 12
  const totalConcepts =
    state?.lessons?.reduce((acc, lesson) => acc + lesson.concepts.length, 0) ?? 15
  const masteredConcepts =
    state?.lessons?.reduce(
      (acc, lesson) =>
        acc +
        lesson.concepts.filter(
          (c) => getOrCreateProgress(state, progressKey(lesson.id, 'concept', c.id)).conceptShown,
        ).length,
      0,
    ) ?? 6
  const conceptPercent =
    totalConcepts > 0 ? Math.round((masteredConcepts / totalConcepts) * 100) : 40

  const loggedinStats = [
    {
      underlay: 'JLPT N5 • VOCABULARY',
      title: 'Vocab Mastery',
      stat: `${masteredVocabCount} / ${totalVocabCount} words mastered`,
      tags: ['JLPT N5', 'VOCAB', 'IN PROGRESS'],
    },
    {
      underlay: 'GRAMMAR • FOUNDATIONS',
      title: 'Concept Retention',
      stat: `${conceptPercent}% core rules understood`,
      tags: ['GRAMMAR', 'N5', `${totalConcepts - masteredConcepts} REMAINING`],
    },
    {
      underlay: 'LEARNING RHYTHM • CADENCE',
      title: 'Review Intervals',
      stat: `${state?.settings?.minIntervalMin ?? 15}–${state?.settings?.maxIntervalMin ?? 30}m spaced repetitions`,
      tags: ['SPACED REPETITION', 'HABIT', state?.settings?.paused ? 'PAUSED' : 'ACTIVE'],
    },
    {
      underlay: 'MILESTONES • PROGRESSION',
      title: 'Lesson Progress',
      stat: `${completedLessonCount} of ${totalLessonCount} lessons completed`,
      tags: ['CURRICULUM', 'MILESTONE', `STAGE ${completedLessonCount + 1}`],
    },
  ]

  useEffect(() => {
    if (!loggedInPosterRef.current || !isAuthenticated) return

    const context = gsap.context(() => {
      const card = loggedInPosterRef.current
      if (!card) return

      gsap.fromTo(
        card.querySelectorAll('.poster-anim'),
        { autoAlpha: 0, y: 10 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.42,
          stagger: 0.07,
          ease: 'power3.out',
        },
      )

      gsap.delayedCall(3.5, () => {
        gsap.to(card.querySelectorAll('.poster-anim'), {
          autoAlpha: 0,
          y: -10,
          duration: 0.32,
          stagger: 0.04,
          ease: 'power2.in',
          onComplete: () => {
            setLoggedInStatIndex((index) => (index + 1) % loggedinStats.length)
          },
        })
      })
    }, loggedInPosterRef)

    return () => context.revert()
  }, [isAuthenticated, loggedInStatIndex, loggedinStats.length])

  const refresh = useCallback(async () => {
    try {
      const authResponse = (await sendMessage({ type: 'AUTH_TOKEN_STATUS' })) as {
        authenticated?: boolean
      } | null
      const authenticated = Boolean(authResponse?.authenticated)
      setIsAuthenticated(authenticated)

      if (!authenticated) {
        setState(null)
        return
      }

      // const s = await fetchState()
      // setState(s)
    } catch (error) {
      console.error('Unable to read authentication state', error)
      setIsAuthenticated(false)
      setState(null)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const togglePause = async () => {
    if (!state) return
    setBusy(true)
    setStatusMsg(null)
    const res = await sendMessage({
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
      const res = (await sendMessage({ type: 'FORCE_CARD' })) as {
        state?: AppState
        result?: { status: string }
      }
      if (res?.state) setState(res.state)
      else await refresh()
      setStatusMsg(forceResultMessage(res.result))
    } catch {
      setStatusMsg('Extension background failed to respond. Reload the extension.')
    }
    setBusy(false)
  }

  const openLearningPanel = () => {
    openSidePanel()
    window.close()
  }

  const logout = async () => {
    setBusy(true)
    try {
      await sendMessage({ type: 'LOGOUT' })
    } finally {
      setBusy(false)
    }
    setIsAuthenticated(false)
    setState(null)
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

  // TODO: Consume settings similar to lesson data
  // useEffect(() => {
  //   if (!state) return
  //   void (async () => {
  //     const response = (await sendMessage({ type: 'CONSUME_OPEN_SETTINGS' })) as {
  //       open: boolean
  //     }
  //     if (!response.open) return
  //     openSettings()
  //   })()
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [state])

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
    const res = await sendMessage({
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

  if (isAuthenticated === null || (isAuthenticated && !state)) {
    return (
      <ConfigProvider theme={{ token: { colorPrimary: '#b7f36b' } }}>
        <Layout className="popup loading-popup">
          <Spin size="large" />
        </Layout>
      </ConfigProvider>
    )
  }

  if (!isAuthenticated) {
    return getIsUnauthenticatedUI()
  }

  if (!state) return null

  const activeLesson =
    state &&
    state.lessons.find(
      (lesson) => lesson.id === (state.pendingCard?.lessonId ?? state.currentLessonId),
    )
  const currentLesson = state?.lessons.find((lesson) => lesson.id === state.currentLessonId)
  const upcomingLesson = currentLesson ? getNextLesson(state) : undefined
  const completedConcepts =
    activeLesson?.concepts.filter((concept) => {
      const key = progressKey(activeLesson.id, 'concept', concept.id)
      return getOrCreateProgress(state, key).conceptShown
    }).length ?? 0
  const conceptCount = activeLesson?.concepts.length ?? 0
  const totalLessonItems = (activeLesson?.vocab.length ?? 0) + conceptCount
  const completedPercentage = (completedConcepts / totalLessonItems) * 100

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

  function getIsUnauthenticatedUI() {
    const activeStat = loggedOutStats[loggedOutStatIndex]

    return (
      <Layout className="popup logged-out-popup">
        <div className="logged-out-shell">
          <header className="logged-out-header">
            <div className="brand-name primary">TANGO</div>
            <AnimatedLogoTree />
          </header>
          <div ref={posterRef} className="poster primary">
            <span className="stat">
              {activeStat.stat}
              <span>+</span>
            </span>
            <span className="subtext">{activeStat.desc}</span>
          </div>
          <Button
            className="google-login-button"
            icon={<GoogleOutlined />}
            onClick={() => void loginViaGoogle()}
            disabled={busy}
          >
            Login with Google
          </Button>
        </div>

        <span className="creator-pill">
          Created by{' '}
          <a href="https://github.com/himanshu" target="_blank" rel="noreferrer">
            Himanshu
          </a>
        </span>
      </Layout>
    )
  }

  function supportProject() {}

  return (
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
      {!isAuthenticated ? (
        getIsUnauthenticatedUI()
      ) : (
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
              <img className="brand-logo" src={logo} alt="" />
              <Title className="primary" level={5}>
                {showSettings ? 'Settings' : 'Tango'}
              </Title>
              {/* <Badge status={state.settings.paused ? 'default' : 'success'} /> */}
            </Space>
            <Flex className="popup-right" align="center">
              <Tooltip title={state.settings.paused ? 'Resume' : 'Pause'}>
                <Switch
                  aria-label="Pause extension"
                  className="pause-switch"
                  checked={!state.settings.paused}
                  onChange={() => void togglePause()}
                  disabled={busy}
                />
              </Tooltip>
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
                  <Tooltip title="Settings">
                    <Button
                      aria-label="Open settings"
                      type="text"
                      icon={
                        <span ref={settingsIconRef} className="settings-icon-twist">
                          <SettingOutlined />
                        </span>
                      }
                      onClick={openSettings}
                      onMouseEnter={twistSettingsIconIn}
                      onMouseLeave={twistSettingsIconOut}
                    />
                  </Tooltip>
                  <Tooltip title="Log out">
                    <Button
                      className="logout-button"
                      aria-label="Log out"
                      type="text"
                      icon={<PoweroffOutlined />}
                      onClick={() => void logout()}
                      disabled={busy}
                    />
                  </Tooltip>
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
              </Flex>
              <div className="lesson-progress" aria-label="Current block completion">
                <Progress
                  percent={completedPercentage}
                  showInfo={false}
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                />
              </div>

              <section className="quick-actions" aria-label="Quick actions">
                <Button
                  className="quick-action show-card-btn"
                  type="primary"
                  onClick={forceCard}
                  disabled={busy}
                >
                  Show card
                </Button>

                <Tooltip title="Open sidepanel">
                  <Button
                    className="quick-action sidepanel-btn"
                    type="text"
                    icon={<MenuUnfoldOutlined />}
                    onClick={openLearningPanel}
                    disabled={busy}
                    aria-label="Open sidepanel"
                  />
                </Tooltip>
                <Tooltip title="Support the project">
                  <Button
                    className="quick-action sidepanel-btn"
                    type="text"
                    icon={<HeartFilled style={{ color: 'pink' }} />}
                    onClick={supportProject}
                    disabled={busy}
                    aria-label="Support the project"
                  />
                </Tooltip>
              </section>

              {statusMsg && (
                <Alert className="force-card-status" message={statusMsg} type="info" showIcon />
              )}

              <Flex
                className="poster-container"
                justify="center"
                align="center"
                ref={loggedInPosterRef}
              >
                <div className="poster-underlay">
                  <Text className="underlay-text poster-anim">
                    {loggedinStats[loggedInStatIndex % loggedinStats.length].underlay}
                  </Text>
                </div>
                <Card className="poster-card" bordered={false}>
                  <Flex className="poster-header" align="center" gap={6}>
                    <img className="poster-logo" src={logo} alt="" />
                    <Text className="poster-brand">tango</Text>
                  </Flex>
                  <Title level={4} className="poster-title poster-anim">
                    {loggedinStats[loggedInStatIndex % loggedinStats.length].title}
                  </Title>
                  <Text className="poster-subtitle poster-anim">
                    {loggedinStats[loggedInStatIndex % loggedinStats.length].stat}
                  </Text>
                  <Flex className="poster-pills poster-anim" gap={4} wrap="wrap">
                    {loggedinStats[loggedInStatIndex % loggedinStats.length].tags.map((tag) => (
                      <Tag key={tag} className="poster-pill">
                        {tag}
                      </Tag>
                    ))}
                  </Flex>
                </Card>
              </Flex>
            </Content>
          )}

          <span className="creator-pill">
            Created by{' '}
            <a href="https://github.com/himanshu" target="_blank" rel="noreferrer">
              Himanshu
            </a>
          </span>
        </Layout>
      )}
    </ConfigProvider>
  )
}

export default Popup
