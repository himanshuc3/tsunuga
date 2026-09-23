import {
  ArrowDownOutlined,
  HeartFilled,
  MenuUnfoldOutlined,
  PoweroffOutlined,
  SaveOutlined,
  SettingOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import {
  Alert,
  Button,
  Card,
  Flex,
  Layout,
  Progress,
  Slider,
  Space,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import type { RefObject } from 'react'
import Switch from '../../common/components/ResumeSwitch/index'
import type { AppState, QuietHour, Settings } from '../../common/types'
import { getNextLesson } from '../../common/helpers'
import { getOrCreateProgress, progressKey } from '../../domain/progress'
import logo from '../../assets/logo.svg'

const { Content } = Layout
const { Title, Text } = Typography

type LoggedInStat = {
  underlay: string
  title: string
  stat: string
  tags: string[]
}

type LoggedInProps = {
  state: AppState
  isBusy: boolean
  statusMsg: string | null
  showSettings: boolean
  setShowSettings: (show: boolean) => void
  settingsDraft: Settings | null
  settingsError: string | null
  settingsSaved: boolean
  loggedInStatIndex: number
  loggedInPosterRef: RefObject<HTMLDivElement>
  settingsIconRef: RefObject<HTMLSpanElement>
  loggedinStats: LoggedInStat[]
  togglePause: () => Promise<void>
  forceCard: () => Promise<void>
  openLearningPanel: () => void
  logout: () => Promise<void>
  openSettings: () => void
  saveSettings: () => Promise<void>
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void
  updateQuietHour: (index: number, patch: Partial<QuietHour>) => void
  twistSettingsIconIn: () => void
  twistSettingsIconOut: () => void
  supportProject: () => void
}

export default function LoggedIn({
  state,
  isBusy,
  statusMsg,
  showSettings,
  setShowSettings,
  settingsDraft,
  settingsError,
  settingsSaved,
  loggedInStatIndex,
  loggedInPosterRef,
  settingsIconRef,
  loggedinStats,
  togglePause,
  forceCard,
  openLearningPanel,
  logout,
  openSettings,
  saveSettings,
  updateSetting,
  updateQuietHour,
  twistSettingsIconIn,
  twistSettingsIconOut,
  supportProject,
}: LoggedInProps) {
  const activeLesson = state.lessons.find(
    (lesson) => lesson.id === (state.pendingCard?.lessonId ?? state.currentLessonId),
  )
  const currentLesson = state.lessons.find((lesson) => lesson.id === state.currentLessonId)
  const upcomingLesson = currentLesson && state ? getNextLesson(state) : undefined
  const completedConcepts =
    activeLesson?.concepts.filter((concept) => {
      const key = progressKey(activeLesson.id, 'concept', concept.id)
      return getOrCreateProgress(state, key).conceptShown
    }).length ?? 0
  const conceptCount = activeLesson?.concepts.length ?? 0
  const totalLessonItems = (activeLesson?.vocab.length ?? 0) + conceptCount
  const completedPercentage = (completedConcepts / totalLessonItems) * 100

  return (
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
        </Space>
        <Flex className="popup-right" align="center">
          <Switch
            tooltip={state.settings.paused ? 'Resume' : 'Pause'}
            switchProps={{
              checked: !state.settings.paused,
              onChange: () => void togglePause(),
              disabled: isBusy,
            }}
          />

          {showSettings && (
            <Button
              className="settings-save-button"
              aria-label="Save settings"
              type="text"
              icon={<SaveOutlined />}
              onClick={() => void saveSettings()}
              disabled={isBusy}
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
                  disabled={isBusy}
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
              <div className="quiet-hour-row" key={`${quietHour.start}-${quietHour.end}-${index}`}>
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
              disabled={isBusy}
            >
              Show card
            </Button>

            <Tooltip title="Open sidepanel">
              <Button
                className="quick-action sidepanel-btn"
                type="text"
                icon={<MenuUnfoldOutlined />}
                onClick={openLearningPanel}
                disabled={isBusy}
                aria-label="Open sidepanel"
              />
            </Tooltip>
            <Tooltip title="Support the project">
              <Button
                className="quick-action sidepanel-btn"
                type="text"
                icon={<HeartFilled style={{ color: 'pink' }} />}
                onClick={supportProject}
                disabled={isBusy}
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
  )
}
