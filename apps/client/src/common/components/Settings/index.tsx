import { SettingOutlined } from '@ant-design/icons'
import { Button, Tooltip } from 'antd'
import { gsap } from 'gsap'
import { useRef, type MouseEventHandler } from 'react'
import './index.css'

type SettingsProps = {
  onClick: MouseEventHandler<HTMLElement>
}

export default function Settings({ onClick }: SettingsProps) {
  const settingsIconRef = useRef<HTMLSpanElement>(null)

  const twistSettingsIconIn = () => {
    gsap.to(settingsIconRef.current, { rotate: 90, duration: 0.35, ease: 'back.out(2)' })
  }

  const twistSettingsIconOut = () => {
    gsap.to(settingsIconRef.current, { rotate: 0, duration: 0.3, ease: 'power2.out' })
  }
  return (
    <Tooltip title="Settings">
      <Button
        aria-label="Open settings"
        type="text"
        icon={
          <span ref={settingsIconRef} className="settings-icon-twist">
            <SettingOutlined />
          </span>
        }
        onClick={onClick}
        onMouseEnter={twistSettingsIconIn}
        onMouseLeave={twistSettingsIconOut}
      />
    </Tooltip>
  )
}
