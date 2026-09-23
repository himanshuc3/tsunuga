import { Tooltip, Switch } from 'antd'
import './index.css'

export default function CustomSwitch({
  switchProps,
  tooltip,
}: {
  switchProps: object
  tooltip: 'string'
}) {
  return (
    <Tooltip title={tooltip}>
      <Switch
        // aria-label="Pause extension"
        {...switchProps}
      />
    </Tooltip>
  )
}
