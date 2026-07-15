import { useEffect, useRef } from 'react'
import { useGameStore } from '../store/gameStore'
import styles from './GameCanvas.module.css'

export default function GameCanvas() {
  const canvasRef  = useRef(null)
  const pointsRef  = useRef([])
  const startRef   = useRef(null)
  const animRef    = useRef(null)

  const phase      = useGameStore(s => s.phase)
  const mode       = useGameStore(s => s.mode)
  const updateDemoBalance = useGameStore(s => s.updateDemoBalance)
  const bets       = useGameStore(s => s.bets)
  const updateBet  = useGameStore(s => s.updateBet)
  const multiplier = useGameStore(s => s.multiplier)
  const countdown  = useGameStore(s => s.countdown)
  const crashAt    = useGameStore(s => s.crashAt)

  // reset points on new round
  useEffect(() => {
    if (phase === 'waiting') {
      pointsRef.current = []
      startRef.current  = null
    }
    if (phase === 'flying' && !startRef.current) {
      startRef.current = Date.now()
    }
  }, [phase])

  // Demo auto cashout check
  useEffect(() => {
    if (mode !== 'demo' || phase !== 'flying') return
    ;[1, 2].forEach(p => {
      const b = bets[p]
      if (b.placed && !b.cashedOut && !b.cashing && b.autoEnabled && multiplier >= b.autoVal) {
        const payout = parseFloat((b.amount * multiplier).toFixed(2))
        updateDemoBalance(payout)
        updateBet(p, { cashedOut: true, cashedAtMult: multiplier })
      }
    })
  }, [multiplier, mode])


  // draw loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    function resize() {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    function draw() {
      const W = canvas.width
      const H = canvas.height
      ctx.clearRect(0, 0, W, H)

      drawGrid(ctx, W, H)

      if (phase === 'flying' || phase === 'crashed') {
        if (phase === 'flying' && startRef.current) {
          const elapsed = (Date.now() - startRef.current) / 1000
          const mult    = Math.pow(Math.E, elapsed * 0.65)
          pointsRef.current.push({ t: elapsed, m: mult })
        }
        drawCurve(ctx, W, H, pointsRef.current, multiplier, phase === 'crashed')
      }

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(animRef.current)
      ro.disconnect()
    }
  }, [phase, multiplier])

  const crashed = phase === 'crashed'
  const flying  = phase === 'flying'
  const waiting = phase === 'waiting'

  return (
    <div className={styles.wrap}>
      <canvas ref={canvasRef} className={styles.canvas} />

      {/* MULTIPLIER */}
      {!waiting && (
        <div className={styles.multOverlay}>
          <div className={`${styles.multValue} ${crashed ? styles.crashed : ''}`}>
            {crashed ? crashAt?.toFixed(2) : multiplier.toFixed(2)}×
          </div>
          <div className={styles.multSub}>
            {crashed ? 'Flew Away!' : 'Flying...'}
          </div>
        </div>
      )}

      {/* WAITING OVERLAY */}
      {waiting && (
        <div className={styles.waitOverlay}>
          <div className={styles.waitPlane}>✈</div>
          <div className={styles.waitTitle}>PLACING BETS</div>
          <div className={styles.waitSub}>Next round starts in</div>
          <div className={styles.waitCount}>{countdown}s</div>
        </div>
      )}

      {/* DEMO WATERMARK */}
      {mode === 'demo' && (
        <div className={styles.demoWatermark}><span>DEMO</span></div>
      )}

      {/* CRASH BANNER */}
      {crashed && (
        <div className={styles.crashBanner}>
          <div className={styles.crashTitle}>FLEW AWAY!</div>
          <div className={styles.crashMult}>@ {crashAt?.toFixed(2)}×</div>
        </div>
      )}
    </div>
  )
}

// ── DRAW HELPERS ──
function drawGrid(ctx, W, H) {
  ctx.save()
  ctx.strokeStyle = 'rgba(37,42,69,0.6)'
  ctx.lineWidth   = 1
  for (let y = 0; y < H; y += H / 5) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
  }
  for (let x = 0; x < W; x += W / 7) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
  }
  ctx.restore()
}

function drawCurve(ctx, W, H, points, currentMult, isCrashed) {
  if (points.length < 2) return

  const pad  = { left: 48, bottom: 32, right: 48, top: 24 }
  const pw   = W - pad.left - pad.right
  const ph   = H - pad.top  - pad.bottom
  const maxT = Math.max(points[points.length - 1]?.t || 1, 1)
  const maxM = Math.max(currentMult * 1.25, 2)

  function toScreen(t, m) {
    return {
      x: pad.left + (t / maxT) * pw,
      y: H - pad.bottom - ((m - 1) / (maxM - 1)) * ph,
    }
  }

  const color = isCrashed ? '#ff3e3e' : '#ff6b35'
  const glow  = isCrashed ? 'rgba(255,62,62,0.25)' : 'rgba(255,107,53,0.2)'

  // Fill under curve
  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0, isCrashed ? 'rgba(255,62,62,0.2)' : 'rgba(255,107,53,0.18)')
  grad.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.beginPath()
  const p0 = toScreen(points[0].t, points[0].m)
  ctx.moveTo(p0.x, H - pad.bottom)
  ctx.lineTo(p0.x, p0.y)
  for (let i = 1; i < points.length; i++) {
    const p = toScreen(points[i].t, points[i].m)
    ctx.lineTo(p.x, p.y)
  }
  const last = toScreen(points[points.length - 1].t, points[points.length - 1].m)
  ctx.lineTo(last.x, H - pad.bottom)
  ctx.closePath()
  ctx.fillStyle = grad
  ctx.fill()

  // Glow line
  ctx.beginPath()
  ctx.moveTo(toScreen(points[0].t, points[0].m).x, toScreen(points[0].t, points[0].m).y)
  for (let i = 1; i < points.length; i++) {
    const p = toScreen(points[i].t, points[i].m)
    ctx.lineTo(p.x, p.y)
  }
  ctx.strokeStyle = glow
  ctx.lineWidth   = 10
  ctx.lineJoin    = 'round'
  ctx.stroke()

  // Main line
  ctx.beginPath()
  ctx.moveTo(toScreen(points[0].t, points[0].m).x, toScreen(points[0].t, points[0].m).y)
  for (let i = 1; i < points.length; i++) {
    const p = toScreen(points[i].t, points[i].m)
    ctx.lineTo(p.x, p.y)
  }
  ctx.strokeStyle = color
  ctx.lineWidth   = 3
  ctx.stroke()

  // Y-axis labels
  ctx.fillStyle  = 'rgba(90,97,128,0.8)'
  ctx.font       = '10px Roboto Mono, monospace'
  ctx.textAlign  = 'right'
  for (let m = 1; m <= Math.floor(maxM); m++) {
    const py = toScreen(0, m).y
    if (py > pad.top && py < H - pad.bottom) {
      ctx.fillText(m + '×', pad.left - 6, py + 3)
    }
  }

  // Plane at tip
  if (!isCrashed) {
    const tip = toScreen(points[points.length - 1].t, points[points.length - 1].m)
    drawPlane(ctx, tip.x, tip.y)
  }
}

function drawPlane(ctx, x, y) {
  ctx.save()
  ctx.translate(x, y)
  ctx.shadowColor = 'rgba(255,107,53,0.9)'
  ctx.shadowBlur  = 16

  // Body
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.ellipse(0, 0, 20, 6, 0, 0, Math.PI * 2)
  ctx.fill()

  // Nose
  ctx.beginPath()
  ctx.moveTo(20, 0); ctx.lineTo(30, 0); ctx.lineTo(22, -4); ctx.closePath(); ctx.fill()
  ctx.beginPath()
  ctx.moveTo(20, 0); ctx.lineTo(30, 0); ctx.lineTo(22, 4); ctx.closePath(); ctx.fill()

  // Top wing
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.beginPath()
  ctx.moveTo(2, -5); ctx.lineTo(14, -18); ctx.lineTo(18, -12); ctx.lineTo(6, -5)
  ctx.closePath(); ctx.fill()

  // Bottom wing
  ctx.beginPath()
  ctx.moveTo(2, 5); ctx.lineTo(14, 18); ctx.lineTo(18, 12); ctx.lineTo(6, 5)
  ctx.closePath(); ctx.fill()

  // Engine glow
  ctx.fillStyle = '#fed330'
  ctx.shadowColor = '#fed330'
  ctx.shadowBlur = 8
  ctx.beginPath()
  ctx.arc(-6, 0, 3.5, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}
