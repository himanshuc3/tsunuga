import { SaveOutlined, SettingOutlined } from '@ant-design/icons'
import { Button, Tooltip } from 'antd'
import './index.css'
import { useRef } from 'react'

export default function Settings({ onClick }) {
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
