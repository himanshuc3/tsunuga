import { useState } from 'react'
import { Button, Card as AntCard, ConfigProvider, Flex, Space, Tag, Typography } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import type { PendingCard } from '../common/types'

type Props = {
  card: PendingCard
  onAnswer: (choice: string, correct: boolean) => Promise<void>
  onAck: () => Promise<void>
  onDismiss: () => void
}

const KIND_LABEL: Record<PendingCard['kind'], string> = {
  intro: 'New',
  concept: 'Concept',
  test: 'Test',
}

const KIND_COLOR: Record<PendingCard['kind'], string> = {
  intro: '#b7f36b',
  concept: '#9a99a5',
  test: '#f0a35b',
}
// TODO[development]: Resolve every tab reloading on content-script updates
// TODO[Styles]: Add animations for smoother inpage transitions and grabbing attention
export function Card({ card, onAnswer, onAck, onDismiss }: Props) {
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [picked, setPicked] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = async (action: () => Promise<void>) => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      await action()
    } catch (error) {
      console.error('Unable to record card progress', error)
      setIsSubmitting(false)
    }
  }

  const handleChoice = (choice: string) => {
    if (card.kind !== 'test' || feedback || isSubmitting) return
    const correct = choice === card.answer
    setPicked(choice)
    setFeedback(correct ? 'correct' : 'incorrect')
    window.setTimeout(
      () => {
        void submit(() => onAnswer(choice, correct))
      },
      correct ? 650 : 1100,
    )
  }

  function RenderFooterBased() {
    switch (card.kind) {
      case 'intro':
        return (
          <Flex className="tango-actions">
            <Button type="default" disabled={isSubmitting} onClick={() => void submit(onAck)}>
              Review later
            </Button>
            <Button type="primary" disabled={isSubmitting} onClick={() => void submit(onAck)}>
              Next card
            </Button>
            <Button
              type="primary"
              disabled={isSubmitting}
              onClick={() => void submit(() => onAnswer(card.romaji, true))}
            >
              Got it
            </Button>
          </Flex>
        )
      case 'concept':
        return (
          <Flex className="tango-actions">
            <Button type="primary" disabled={isSubmitting} onClick={() => void submit(onAck)}>
              Continue
            </Button>
          </Flex>
        )
      case 'test':
        return <></>
    }
  }

  function RenderBasedOnType() {
    switch (card.kind) {
      case 'intro':
        return (
          <>
            <Flex className="tango-pair">
              <Flex className="tango-half left" vertical align="center" gap={4}>
                <Flex justify="center" className="label-container">
                  <Typography.Text className="tango-half-label">Romaji</Typography.Text>
                </Flex>
                <Flex flex="1" justify="center" align="center">
                  <Typography.Text className="tango-half-text">{card.romaji}</Typography.Text>
                </Flex>
              </Flex>
              <Flex className="tango-half right" vertical align="center" gap={4}>
                <Flex justify="center" className="label-container">
                  <Typography.Text className="tango-half-label">English</Typography.Text>
                </Flex>
                <Flex flex="1" justify="center" align="center">
                  <Typography.Text className="tango-half-text">{card.en}</Typography.Text>
                </Flex>
              </Flex>
            </Flex>
            {card.meta && <Typography.Text className="tango-meta">{card.meta}</Typography.Text>}
          </>
        )
      case 'concept':
        return (
          <>
            <Typography.Title level={2} className="tango-title">
              {card.title}
            </Typography.Title>
            <Typography.Paragraph className="tango-detail">{card.body}</Typography.Paragraph>
            {card.meta && <Typography.Text className="tango-meta">{card.meta}</Typography.Text>}
          </>
        )
      case 'test':
        return (
          <>
            <Flex className="tango-pair" gap={12}>
              <Flex className="tango-half" vertical align="center" justify="center" gap={4}>
                <Typography.Text className="tango-half-label">Romaji</Typography.Text>
                <Typography.Text className="tango-half-text">{card.romaji}</Typography.Text>
              </Flex>
              <Flex className="tango-half" vertical align="center" justify="center" gap={4}>
                <Typography.Text className="tango-half-label">English</Typography.Text>
                <Typography.Text className="tango-half-text">{card.en}</Typography.Text>
              </Flex>
            </Flex>
            <Typography.Paragraph className="tango-prompt small">
              {card.prompt}
            </Typography.Paragraph>
            {card.meta && <Typography.Text className="tango-meta">{card.meta}</Typography.Text>}
            <Space className="tango-choices" direction="vertical" size={8}>
              {card.choices.map((choice) => {
                let state: 'correct' | 'wrong' | undefined
                if (feedback) {
                  if (choice === card.answer) state = 'correct'
                  else if (choice === picked) state = 'wrong'
                }
                return (
                  <Button
                    key={choice}
                    className="tango-choice"
                    type="default"
                    block
                    data-state={state}
                    disabled={Boolean(feedback) || isSubmitting}
                    onClick={() => handleChoice(choice)}
                  >
                    {choice}
                  </Button>
                )
              })}
            </Space>
            {feedback === 'correct' && (
              <Typography.Text className="tango-feedback ok">Correct</Typography.Text>
            )}
            {feedback === 'incorrect' && (
              <Typography.Text className="tango-feedback bad">
                Answer: {card.answer}
              </Typography.Text>
            )}
          </>
        )
    }
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: KIND_COLOR[card.kind],
          colorText: '#f7f7f8',
          colorTextSecondary: '#9a99a5',
          colorBgContainer: '#202024',
          colorBorder: '#323238',
          borderRadius: 10,
          fontFamily: "'Avenir Next', 'Segoe UI', sans-serif",
        },
      }}
    >
      <Flex className="outer-card">
        <Flex
          className="tango-card"
          data-kind={card.kind}
          data-feedback={feedback ?? undefined}
          role="dialog"
          orientation="vertical"
          aria-label="Tango lesson card"
        >
          <Flex className="tango-header" align="center" justify="space-between">
            <Tag color={KIND_COLOR[card.kind]} className="tango-kind">
              {KIND_LABEL[card.kind]}
            </Tag>
            {card.kind === 'intro' ? (
              <Typography.Text className="tango-script">
                {card.itemType.toUpperCase()}
              </Typography.Text>
            ) : (
              <Typography.Text className="tango-header-spacer" aria-hidden="true" />
            )}
            <Button
              className="tango-close"
              type="text"
              icon={<CloseOutlined />}
              aria-label="Dismiss"
              disabled={isSubmitting}
              onClick={onDismiss}
            />
          </Flex>
          <Space className="tango-body" direction="vertical" size={12}>
            {RenderBasedOnType()}
          </Space>
        </Flex>
        <Flex>{RenderFooterBased()}</Flex>
      </Flex>
    </ConfigProvider>
  )
}
