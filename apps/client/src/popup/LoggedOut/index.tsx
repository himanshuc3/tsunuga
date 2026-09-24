import { Button, Layout } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { GoogleOutlined } from '@ant-design/icons'
import logoTree from '../../assets/logo_tree.svg?raw'
import './index.scss'

gsap.registerPlugin(DrawSVGPlugin)

function AnimatedLogoTree() {
  const logoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!logoRef.current) return

    const context = gsap.context(() => {
      gsap.from('.branch', {
        duration: 1,
        drawSVG: '50% 50%',
        ease: 'power2.out',
        repeat: 1,
      })

      gsap.from('.outward-path', {
        duration: 1,
        delay: 0.9,
        drawSVG: '0% 0%',
        ease: 'power2.out',
        repeat: 0,
      })

      gsap.to('.shape', {
        duration: 1.4,
        x: 4,
        y: -4,
        rotation: 8,
        transformOrigin: '50% 50%',
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        stagger: 0.2,
      })
    }, logoRef)

    return () => context.revert()
  }, [])

  return <div ref={logoRef} className="brand-tree" dangerouslySetInnerHTML={{ __html: logoTree }} />
}

const loggedOutStats = [
  {
    stat: '200',
    desc: 'categorized vocab cards',
  },
  {
    stat: '15',
    desc: 'concepts to reach N5',
  },
  {
    stat: '5',
    desc: 'settings to tweak for learning',
  },
]

type LoggedOutProps = {
  login: () => Promise<void>
  disabled: boolean
}

export default function LoggedOut({ login, disabled }: LoggedOutProps) {
  const [loggedOutStatIndex, setLoggedOutStatIndex] = useState(0)
  const posterRef = useRef<HTMLDivElement>(null)
  const activeStat = loggedOutStats[loggedOutStatIndex]

  useEffect(() => {
    if (!posterRef.current) return

    const context = gsap.context(() => {
      const poster = posterRef.current
      if (!poster) return

      gsap.fromTo(
        poster.querySelector('.stat'),
        { autoAlpha: 0, y: 16 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.42,
          ease: 'power3.out',
          delay: loggedOutStatIndex === 0 ? 0 : 0.12,
        },
      )

      gsap.fromTo(
        poster.querySelector('.subtext'),
        { autoAlpha: 0, y: 16 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.42,
          ease: 'power3.out',
          delay: (loggedOutStatIndex === 0 ? 0 : 0.12) + 0.15,
        },
      )

      gsap.delayedCall(3.4, () => {
        gsap.to(poster, {
          autoAlpha: 0,
          y: -16,
          duration: 0.32,
          ease: 'power2.in',
          onComplete: () => {
            setLoggedOutStatIndex((index) => (index + 1) % loggedOutStats.length)
          },
        })
      })
    }, posterRef)

    return () => context.revert()
  }, [loggedOutStatIndex])

  return (
    <Layout className="popup logged-out-popup">
      <div className="logged-out-shell">
        <header className="logged-out-header">
          <div className="brand-name primary">TANGO</div>
          <AnimatedLogoTree />
        </header>
        <div ref={posterRef} className="poster primary">
          <span className="stat">
            {activeStat.stat}
            <span>+</span>
          </span>
          <span className="subtext">{activeStat.desc}</span>
        </div>
        <Button
          className="google-login-button"
          icon={<GoogleOutlined />}
          onClick={() => void login()}
          disabled={disabled}
        >
          Login with Google
        </Button>
      </div>

      <span className="creator-pill">
        Created by{' '}
        <a href="https://github.com/himanshu" target="_blank" rel="noreferrer">
          Himanshu
        </a>
      </span>
    </Layout>
  )
}
