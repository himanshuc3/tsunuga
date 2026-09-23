import { Tooltip, Switch } from 'antd'
import type { ComponentProps } from 'react'
import './index.css'

export default function CustomSwitch({
  switchProps,
  tooltip,
}: {
  switchProps: ComponentProps<typeof Switch>
  tooltip: string
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
