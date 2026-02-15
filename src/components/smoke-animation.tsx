'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  life: number
  maxLife: number
}

export function SmokeAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const scrollProgressRef = useRef(0)
  const animFrameRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Canvas covers from top of page down through the factory
    const resize = () => {
      const rect = container.getBoundingClientRect()
      const scrollY = window.scrollY
      const containerTop = rect.top + scrollY
      canvas.width = container.clientWidth
      // Canvas height = from page top to bottom of container
      canvas.height = containerTop + container.clientHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const onScroll = () => {
      const rect = container.getBoundingClientRect()
      const windowH = window.innerHeight
      const progress = Math.max(0, Math.min(1, (windowH - rect.top) / (windowH + rect.height)))
      scrollProgressRef.current = progress
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    const stacks = [0.35, 0.42, 0.58, 0.65]

    // Factory is drawn at the bottom of the canvas (which aligns with the container)
    const getFactoryBaseY = () => {
      return canvas.height - container.clientHeight * 0.65
    }

    const spawnParticle = (stackX: number) => {
      const w = canvas.width
      const factoryTop = getFactoryBaseY()
      const stackTop = factoryTop - container.clientHeight * 0.14
      return {
        x: stackX * w + (Math.random() - 0.5) * 8,
        y: stackTop,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -(0.6 + Math.random() * 1.4),
        size: 4 + Math.random() * 10,
        opacity: 0.12 + Math.random() * 0.2,
        life: 0,
        maxLife: 250 + Math.random() * 300,
      }
    }

    let spawnTimer = 0

    const drawFactory = (w: number) => {
      const ch = container.clientHeight
      const factoryTop = canvas.height - ch * 0.65
      ctx.fillStyle = '#14532d'

      // Main building: from factoryTop to bottom of canvas
      ctx.fillRect(w * 0.28, factoryTop, w * 0.44, canvas.height - factoryTop)

      // Smokestacks
      const stackH = ch * 0.14
      for (const sx of stacks) {
        ctx.fillRect(sx * w - 4, factoryTop - stackH, 8, stackH)
        ctx.fillRect(sx * w - 6, factoryTop - stackH, 12, 4)
      }

      // Windows
      ctx.fillStyle = '#dcfce7'
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 6; col++) {
          const wx = w * 0.30 + col * (w * 0.065)
          const wy = factoryTop + 20 + row * 35
          ctx.fillRect(wx, wy, w * 0.035, 14)
        }
      }

      // Roofline
      ctx.fillStyle = '#14532d'
      ctx.fillRect(w * 0.26, factoryTop - 2, w * 0.48, 4)
    }

    const animate = () => {
      const w = canvas.width
      const h = canvas.height
      const progress = scrollProgressRef.current

      ctx.clearRect(0, 0, w, h)

      spawnTimer++
      if (progress > 0.05 && spawnTimer % 2 === 0) {
        const intensity = Math.min(1, (progress - 0.05) / 0.4)
        for (const sx of stacks) {
          if (Math.random() < intensity * 0.8) {
            particlesRef.current.push(spawnParticle(sx))
          }
        }
      }

      const alive: Particle[] = []
      for (const p of particlesRef.current) {
        p.life++
        if (p.life > p.maxLife) continue
        // Remove particles that have gone above the canvas
        if (p.y < -20) continue

        const lifeRatio = p.life / p.maxLife
        p.x += p.vx + Math.sin(p.life * 0.015) * 0.4
        p.y += p.vy
        p.vx += (Math.random() - 0.5) * 0.04
        p.size += 0.18
        const alpha = p.opacity * (1 - lifeRatio) * Math.min(1, progress * 3)

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(160, 170, 165, ${alpha})`
        ctx.fill()

        alive.push(p)
      }
      particlesRef.current = alive

      drawFactory(w)

      animFrameRef.current = requestAnimationFrame(animate)
    }

    animFrameRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <div ref={containerRef} className="relative w-full h-[280px]" style={{ zIndex: 1 }}>
      <canvas
        ref={canvasRef}
        className="absolute bottom-0 left-0 w-full pointer-events-none"
      />
    </div>
  )
}
