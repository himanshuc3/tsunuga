import React from 'react'
import './index.scss'
import { HeartFilled } from '@ant-design/icons'

export default function MadeBy() {
  return (
    <span className="creator-pill">
      Made with <HeartFilled style={{ color: 'red' }} /> by
      <a href="https://github.com/himanshuc3" target="_blank" rel="noreferrer">
        Himanshu
      </a>
    </span>
  )
}
