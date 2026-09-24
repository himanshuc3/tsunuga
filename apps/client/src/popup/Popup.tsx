import { useEffect, useRef, useState } from 'react'
import { ConfigProvider, Layout, Spin } from 'antd'

import browser from 'webextension-polyfill'
import { gsap } from 'gsap'
import type { AppState, QuietHour, Settings } from '../common/types'
import './Popup.css'
import { openSidePanel, sendMessage } from '../common/helpers'
import { countMasteredInLesson, getOrCreateProgress, progressKey } from '../domain/progress'
import LoggedOut from './LoggedOut'
import LoggedIn from './LoggedIn'

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
  'authToken',
])

const STATUS = {
  IDLE: 0,
  PROGRESS: 1,
  SUCCESS: 2,
  FAILURE: 3,
} as const

export const Popup = () => {
  const [state, setState] = useState<AppState | null>(null)
  const [status, setStatus] = useState<keyof [typeof STATUS]>(STATUS.IDLE)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)

  const [showSettings, setShowSettings] = useState(false)
  const [settingsDraft, setSettingsDraft] = useState<Settings | null>(null)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [loggedInStatIndex, setLoggedInStatIndex] = useState(0)
  const loggedInPosterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function getData() {
      const data = await browser.storage.local.get([...keysForChange])
      if (data.authToken) {
        setIsAuthenticated(true)
      }
      setState(data as AppState)
    }
    getData()

    const handleStorageChange = (
      changes: Record<string, browser.Storage.StorageChange>,
      areaName: string,
    ) => {
      if (areaName !== 'local') return

      if (Object.keys(changes).find((key) => keysForChange.has(key))) {
        void getData()
      }
    }

    browser.storage.onChanged.addListener(handleStorageChange)
    return () => browser.storage.onChanged.removeListener(handleStorageChange)
  }, [])

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

  const togglePause = async () => {
    if (!state) return
    // setBusy(true)
    const res = await sendMessage({
      type: 'SET_PAUSED',
      paused: !state.settings.paused,
    })
    const nextState = res as { state: AppState }
    setState(nextState.state)
    setSettingsDraft((previous) =>
      previous ? { ...previous, paused: nextState.state.settings.paused } : previous,
    )
    // setBusy(false)
  }

  const forceCard = async () => {
    // setBusy(true)
    try {
      const res = (await sendMessage({ type: 'FORCE_CARD' })) as {
        state?: AppState
        result?: { status: string }
      }
      if (res?.state) setState(res.state)
      // else await refresh()
    } catch {}
    // setBusy(false)
  }

  const openLearningPanel = () => {
    openSidePanel()
    window.close()
  }

  const logout = async () => {
    try {
      await sendMessage({ type: 'LOGOUT' })
    } catch (err) {}
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

  useEffect(() => {
    if (!state || showSettings) return
    void (async () => {
      const response = (await sendMessage({ type: 'CONSUME_OPEN_SETTINGS' })) as {
        open: boolean
      }
      if (response?.open) openSettings()
    })()
    // Only consume the navigation flag when initial state hydration completes.
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

    // setBusy(true)
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
    // setBusy(false)
  }

  async function loginViaGoogle() {
    try {
      setStatus(STATUS.PROGRESS)
      await sendMessage({ type: 'AUTH_TOKEN' })
      // await refresh()
      setStatus(STATUS.SUCCESS)
    } catch (error) {
      setStatus(STATUS.FAILURE)

      console.error('Unable to get auth token', error)
    } finally {
    }
  }

  function supportProject() {}

  function renderRoutes() {
    switch (true) {
      case !isAuthenticated: {
        return <LoggedOut login={loginViaGoogle} disabled={status === STATUS.PROGRESS} />
      }
      case status === STATUS.PROGRESS:
        return (
          <Layout className="popup loading-popup">
            <Spin size="large" />
          </Layout>
        )
      case state !== null:
        return (
          <LoggedIn
            state={state}
            isBusy={status === STATUS.PROGRESS}
            showSettings={showSettings}
            setShowSettings={setShowSettings}
            settingsDraft={settingsDraft}
            settingsError={settingsError}
            settingsSaved={settingsSaved}
            loggedInStatIndex={loggedInStatIndex}
            loggedInPosterRef={loggedInPosterRef}
            loggedinStats={loggedinStats}
            togglePause={togglePause}
            forceCard={forceCard}
            openLearningPanel={openLearningPanel}
            logout={logout}
            openSettings={openSettings}
            saveSettings={saveSettings}
            updateSetting={updateSetting}
            updateQuietHour={updateQuietHour}
            supportProject={supportProject}
          />
        )
      default:
        return <div>Pooping in code</div>
    }
  }

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
      {renderRoutes()}
    </ConfigProvider>
  )
}

export default Popup
