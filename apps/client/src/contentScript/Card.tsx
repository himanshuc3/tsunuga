import { useState } from 'react'
import { Button, Card as AntCard, ConfigProvider, Flex, Space, Tag, Typography } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import type { PendingCard } from '../domain/types'

type Props = {
  card: PendingCard
  onAnswer: (choice: string, correct: boolean) => void
  onAck: () => void
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
  const handleChoice = (choice: string) => {
    if (card.kind !== 'test' || feedback) return
    const correct = choice === card.answer
    setPicked(choice)
    setFeedback(correct ? 'correct' : 'incorrect')
    window.setTimeout(
      () => {
        onAnswer(choice, correct)
      },
      correct ? 650 : 1100,
    )
  }

  function RenderBasedOnType() {
    switch (card.kind) {
      case 'intro':
        return (
          <>
            <Flex className="tsunagu-pair">
              <Flex className="tsunagu-half left" vertical align="center" gap={4}>
                <Flex justify="center" className="label-container">
                  <Typography.Text className="tsunagu-half-label">Romaji</Typography.Text>
                </Flex>
                <Flex flex="1" justify="center" align="center">
                  <Typography.Text className="tsunagu-half-text">{card.romaji}</Typography.Text>
                </Flex>
              </Flex>
              <Flex className="tsunagu-half right" vertical align="center" gap={4}>
                <Flex justify="center" className="label-container">
                  <Typography.Text className="tsunagu-half-label">English</Typography.Text>
                </Flex>
                <Flex flex="1" justify="center" align="center">
                  <Typography.Text className="tsunagu-half-text">{card.en}</Typography.Text>
                </Flex>
              </Flex>
            </Flex>
            {card.meta && <Typography.Text className="tsunagu-meta">{card.meta}</Typography.Text>}
            <Flex className="tsunagu-actions">
              <Button type="default" onClick={onAck}>
                Review later
              </Button>
              <Button type="primary" onClick={onAck}>
                Next card
              </Button>
              <Button type="primary" onClick={onAck}>
                Got it
              </Button>
            </Flex>
          </>
        )
      case 'concept':
        return (
          <>
            <Typography.Title level={2} className="tsunagu-title">
              {card.title}
            </Typography.Title>
            <Typography.Paragraph className="tsunagu-detail">{card.body}</Typography.Paragraph>
            {card.meta && <Typography.Text className="tsunagu-meta">{card.meta}</Typography.Text>}
            <Flex className="tsunagu-actions">
              <Button type="primary" onClick={onAck}>
                Continue
              </Button>
            </Flex>
          </>
        )
      case 'test':
        return (
          <>
            <Flex className="tsunagu-pair" gap={12}>
              <Flex className="tsunagu-half" vertical align="center" justify="center" gap={4}>
                <Typography.Text className="tsunagu-half-label">Romaji</Typography.Text>
                <Typography.Text className="tsunagu-half-text">{card.romaji}</Typography.Text>
              </Flex>
              <Flex className="tsunagu-half" vertical align="center" justify="center" gap={4}>
                <Typography.Text className="tsunagu-half-label">English</Typography.Text>
                <Typography.Text className="tsunagu-half-text">{card.en}</Typography.Text>
              </Flex>
            </Flex>
            <Typography.Paragraph className="tsunagu-prompt small">
              {card.prompt}
            </Typography.Paragraph>
            {card.meta && <Typography.Text className="tsunagu-meta">{card.meta}</Typography.Text>}
            <Space className="tsunagu-choices" direction="vertical" size={8}>
              {card.choices.map((choice) => {
                let state: 'correct' | 'wrong' | undefined
                if (feedback) {
                  if (choice === card.answer) state = 'correct'
                  else if (choice === picked) state = 'wrong'
                }
                return (
                  <Button
                    key={choice}
                    className="tsunagu-choice"
                    type="default"
                    block
                    data-state={state}
                    disabled={Boolean(feedback)}
                    onClick={() => handleChoice(choice)}
                  >
                    {choice}
                  </Button>
                )
              })}
            </Space>
            {feedback === 'correct' && (
              <Typography.Text className="tsunagu-feedback ok">Correct</Typography.Text>
            )}
            {feedback === 'incorrect' && (
              <Typography.Text className="tsunagu-feedback bad">
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
      <Flex
        className="tsunagu-card"
        data-kind={card.kind}
        data-feedback={feedback ?? undefined}
        role="dialog"
        orientation="vertical"
        aria-label="Tsunagu lesson card"
      >
        <Flex className="tsunagu-header" align="center" justify="space-between">
          <Tag color={KIND_COLOR[card.kind]} className="tsunagu-kind">
            {KIND_LABEL[card.kind]}
          </Tag>
          {card.kind === 'intro' ? (
            <Typography.Text className="tsunagu-script">
              {card.itemType.toUpperCase()}
            </Typography.Text>
          ) : (
            <Typography.Text className="tsunagu-header-spacer" aria-hidden="true" />
          )}
          <Button
            className="tsunagu-close"
            type="text"
            icon={<CloseOutlined />}
            aria-label="Dismiss"
            onClick={onDismiss}
          />
        </Flex>
        <Space className="tsunagu-body" direction="vertical" size={12}>
          {RenderBasedOnType()}
        </Space>
      </Flex>
    </ConfigProvider>
  )
}
