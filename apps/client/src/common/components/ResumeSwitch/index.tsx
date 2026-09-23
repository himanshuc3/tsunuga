import { Tooltip } from 'antd'
import './index.css'

export default function Switch({ switchProps, tooltip }) {
  return (
    <Tooltip title={tooltip}>
      <Switch
        // aria-label="Pause extension"
        className="switch"
        {...switchProps}
      />
    </Tooltip>
  )
}
