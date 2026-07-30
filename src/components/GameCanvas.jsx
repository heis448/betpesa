import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import styles from './GameCanvas.module.css'

// ── AUDIO ──
function createAudio() {
  let ctx = null
  function g() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
    return ctx
  }
  return {
    fly() {
      try {
        const c = g(), o = c.createOscillator(), v = c.createGain()
        o.connect(v); v.connect(c.destination)
        o.type = 'sine'
        o.frequency.setValueAtTime(180, c.currentTime)
        o.frequency.exponentialRampToValueAtTime(600, c.currentTime + 0.4)
        v.gain.setValueAtTime(0.07, c.currentTime)
        v.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.45)
        o.start(); o.stop(c.currentTime + 0.45)
      } catch {}
    },
    cashout() {
      try {
        const c = g()
        ;[0, 0.1, 0.2].forEach((d, i) => {
          const o = c.createOscillator(), v = c.createGain()
          o.connect(v); v.connect(c.destination)
          o.type = 'sine'
          o.frequency.value = [523, 659, 784][i]
          v.gain.setValueAtTime(0.12, c.currentTime + d)
          v.gain.exponentialRampToValueAtTime(0.001, c.currentTime + d + 0.3)
          o.start(c.currentTime + d); o.stop(c.currentTime + d + 0.3)
        })
      } catch {}
    },
    crash() {
      try {
        const c = g(), o = c.createOscillator(), v = c.createGain()
        o.connect(v); v.connect(c.destination)
        o.type = 'sawtooth'
        o.frequency.setValueAtTime(400, c.currentTime)
        o.frequency.exponentialRampToValueAtTime(40, c.currentTime + 0.7)
        v.gain.setValueAtTime(0.14, c.currentTime)
        v.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.7)
        o.start(); o.stop(c.currentTime + 0.7)
      } catch {}
    },
    tick() {
      try {
        const c = g(), o = c.createOscillator(), v = c.createGain()
        o.connect(v); v.connect(c.destination)
        o.frequency.value = 1100
        v.gain.setValueAtTime(0.035, c.currentTime)
        v.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.04)
        o.start(); o.stop(c.currentTime + 0.04)
      } catch {}
    },
  }
}
const sfx = createAudio()

// ── STARS ──
function makeStars(n = 120) {
  return Array.from({ length: n }, () => ({
    x: Math.random(), y: Math.random(),
    r: Math.random() * 1.4 + 0.3,
    o: Math.random() * 0.5 + 0.1,
    speed: Math.random() * 0.0005 + 0.0001,
    dir: Math.random() > 0.5 ? 1 : -1,
  }))
}

// ── CLOUDS ──
function makeClouds(n = 8) {
  return Array.from({ length: n }, (_, i) => ({
    x: 0.1 + Math.random() * 0.9,
    y: 0.1 + Math.random() * 0.75,
    scale: 0.5 + Math.random() * 1.2,
    opacity: 0,
    speed: 0.00015 + Math.random() * 0.0001,
    spawnMult: 1.5 + i * 1.8 + Math.random() * 1.5,
    puffs: Array.from({ length: 4 + Math.floor(Math.random() * 3) }, () => ({
      ox: (Math.random() - 0.5) * 80,
      oy: (Math.random() - 0.5) * 25,
      r:  20 + Math.random() * 28,
    })),
  }))
}

// ── DRAW SPRIBE-STYLE RED JET ──
function drawPlane(ctx, x, y, angle) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)

  // Long fire exhaust trail
  for (let i = 6; i >= 0; i--) {
    const ex = -(30 + i * 16)
    const spread = i * 1.4
    const alpha = (0.7 - i * 0.09)
    const radius = 10 - i * 0.9
    const colors = [
      `rgba(255,255,200,${alpha})`,
      `rgba(255,220,80,${alpha})`,
      `rgba(255,140,20,${alpha * 0.85})`,
      `rgba(255,60,0,${alpha * 0.7})`,
      `rgba(200,20,0,${alpha * 0.5})`,
      `rgba(120,10,0,${alpha * 0.3})`,
      `rgba(60,10,0,${alpha * 0.15})`,
    ]
    ctx.beginPath()
    ctx.arc(ex, (Math.random() - 0.5) * spread, Math.max(1, radius), 0, Math.PI * 2)
    ctx.fillStyle = colors[i]
    ctx.fill()
  }

  // Glow aura around plane
  const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, 50)
  glow.addColorStop(0, 'rgba(255,100,50,0.18)')
  glow.addColorStop(1, 'rgba(255,100,50,0)')
  ctx.fillStyle = glow
  ctx.beginPath(); ctx.arc(0, 0, 50, 0, Math.PI * 2); ctx.fill()

  // Shadow/depth under fuselage
  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  ctx.beginPath()
  ctx.ellipse(0, 6, 26, 5, 0, 0, Math.PI * 2)
  ctx.fill()

  // Main fuselage — red body
  const bodyGrad = ctx.createLinearGradient(0, -8, 0, 8)
  bodyGrad.addColorStop(0, '#ff5533')
  bodyGrad.addColorStop(0.4, '#cc2200')
  bodyGrad.addColorStop(1, '#881100')
  ctx.fillStyle = bodyGrad
  ctx.beginPath()
  ctx.moveTo(32, 0)
  ctx.bezierCurveTo(24, -6, -14, -7, -24, -3)
  ctx.lineTo(-26, 0)
  ctx.lineTo(-24, 3)
  ctx.bezierCurveTo(-14, 7, 24, 6, 32, 0)
  ctx.fill()

  // Fuselage highlight stripe
  ctx.strokeStyle = 'rgba(255,150,120,0.5)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(28, -2)
  ctx.bezierCurveTo(18, -5, -10, -5, -22, -2)
  ctx.stroke()

  // Nose cone — pointed
  const noseGrad = ctx.createLinearGradient(28, 0, 42, 0)
  noseGrad.addColorStop(0, '#ff6644')
  noseGrad.addColorStop(1, '#ffddcc')
  ctx.fillStyle = noseGrad
  ctx.beginPath()
  ctx.moveTo(28, -4); ctx.lineTo(44, 0); ctx.lineTo(28, 4); ctx.closePath()
  ctx.fill()

  // Cockpit
  const cockpitGrad = ctx.createRadialGradient(18, -4, 1, 16, -3, 9)
  cockpitGrad.addColorStop(0, 'rgba(180,230,255,0.9)')
  cockpitGrad.addColorStop(0.5, 'rgba(80,160,220,0.7)')
  cockpitGrad.addColorStop(1, 'rgba(20,60,120,0.5)')
  ctx.fillStyle = cockpitGrad
  ctx.beginPath(); ctx.ellipse(16, -3, 7, 4, -0.2, 0, Math.PI * 2); ctx.fill()
  // cockpit glint
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.beginPath(); ctx.ellipse(18, -5, 2.5, 1.5, -0.3, 0, Math.PI * 2); ctx.fill()

  // Main wings — swept delta
  const wingGrad = ctx.createLinearGradient(0, 0, 0, -32)
  wingGrad.addColorStop(0, '#dd2200')
  wingGrad.addColorStop(1, '#881100')
  ctx.fillStyle = wingGrad
  // top wing
  ctx.beginPath()
  ctx.moveTo(10, -5); ctx.lineTo(-2, -34); ctx.lineTo(-14, -28); ctx.lineTo(-6, -5)
  ctx.closePath(); ctx.fill()
  // top wing highlight
  ctx.strokeStyle = 'rgba(255,120,80,0.4)'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(8, -6); ctx.lineTo(-2, -30); ctx.stroke()

  // bottom wing
  ctx.fillStyle = wingGrad
  ctx.beginPath()
  ctx.moveTo(10, 5); ctx.lineTo(-2, 34); ctx.lineTo(-14, 28); ctx.lineTo(-6, 5)
  ctx.closePath(); ctx.fill()

  // Wing tip lights
  ctx.fillStyle = '#fff'
  ctx.shadowColor = '#fff'; ctx.shadowBlur = 6
  ctx.beginPath(); ctx.arc(-3, -34, 2, 0, Math.PI*2); ctx.fill()
  ctx.beginPath(); ctx.arc(-3,  34, 2, 0, Math.PI*2); ctx.fill()
  ctx.shadowBlur = 0

  // Tail vertical fin
  const tailGrad = ctx.createLinearGradient(-14, 0, -14, -20)
  tailGrad.addColorStop(0, '#cc2200'); tailGrad.addColorStop(1, '#ff4422')
  ctx.fillStyle = tailGrad
  ctx.beginPath()
  ctx.moveTo(-16, -4); ctx.lineTo(-24, -20); ctx.lineTo(-20, -20); ctx.lineTo(-14, -4)
  ctx.closePath(); ctx.fill()

  // Horizontal stabilisers
  ctx.fillStyle = '#bb1100'
  ctx.beginPath()
  ctx.moveTo(-18, -3); ctx.lineTo(-28, -12); ctx.lineTo(-26, -3); ctx.closePath(); ctx.fill()
  ctx.beginPath()
  ctx.moveTo(-18,  3); ctx.lineTo(-28,  12); ctx.lineTo(-26,  3); ctx.closePath(); ctx.fill()

  // Engine nacelles
  const nacGrad = ctx.createLinearGradient(0, -16, 0, -10)
  nacGrad.addColorStop(0, '#993300'); nacGrad.addColorStop(1, '#551100')
  ctx.fillStyle = nacGrad
  ctx.beginPath(); ctx.ellipse(-2, -16, 6, 3, -0.3, 0, Math.PI*2); ctx.fill()
  ctx.beginPath(); ctx.ellipse(-2,  16, 6, 3,  0.3, 0, Math.PI*2); ctx.fill()

  // Engine glow
  ctx.fillStyle = '#ffaa00'
  ctx.shadowColor = '#ffaa00'; ctx.shadowBlur = 14
  ctx.beginPath(); ctx.arc(-20, 0, 3.5, 0, Math.PI*2); ctx.fill()
  ctx.shadowBlur = 0

  ctx.restore()
}

// ── DRAW CLOUD ──
function drawCloud(ctx, cx, cy, scale, opacity, puffs) {
  if (opacity <= 0) return
  ctx.save()
  ctx.globalAlpha = opacity
  ctx.translate(cx, cy)
  ctx.scale(scale, scale * 0.65)
  puffs.forEach(p => {
    const cg = ctx.createRadialGradient(p.ox, p.oy, 0, p.ox, p.oy, p.r)
    cg.addColorStop(0, 'rgba(255,255,255,0.55)')
    cg.addColorStop(0.5, 'rgba(220,230,255,0.28)')
    cg.addColorStop(1, 'rgba(180,200,255,0)')
    ctx.fillStyle = cg
    ctx.beginPath(); ctx.arc(p.ox, p.oy, p.r, 0, Math.PI*2); ctx.fill()
  })
  ctx.restore()
}

// ── DRAW GRID ──
function drawGrid(ctx, W, H, mult) {
  const pad = { left: 48, bottom: 32, right: 16, top: 16 }
  const alpha = Math.max(0.015, 0.06 - (mult - 1) * 0.003)
  ctx.save()
  ctx.strokeStyle = `rgba(255,255,255,${alpha})`
  ctx.lineWidth = 1
  const rows = 5, cols = 8
  for (let i = 0; i <= rows; i++) {
    const y = pad.top + ((H - pad.top - pad.bottom) / rows) * i
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke()
  }
  for (let i = 0; i <= cols; i++) {
    const x = pad.left + ((W - pad.left - pad.right) / cols) * i
    ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, H - pad.bottom); ctx.stroke()
  }
  ctx.restore()
}

// ── DRAW CURVE ──
function drawCurve(ctx, W, H, points, currentMult, isCrashed) {
  if (points.length < 2) return
  const pad  = { left: 48, bottom: 32, right: 16, top: 16 }
  const pw   = W - pad.left - pad.right
  const ph   = H - pad.top - pad.bottom
  const maxT = Math.max(points[points.length-1]?.t || 1, 1)
  const maxM = Math.max(currentMult * 1.35, 2)

  function toS(t, m) {
    return {
      x: pad.left + (t / maxT) * pw,
      y: H - pad.bottom - ((m - 1) / (maxM - 1)) * ph,
    }
  }

  const mc = isCrashed ? '#f23645' : '#00e5a0'
  const gc = isCrashed ? 'rgba(242,54,69,' : 'rgba(0,229,160,'

  // Fill under curve
  ctx.beginPath()
  const p0 = toS(points[0].t, points[0].m)
  ctx.moveTo(p0.x, H - pad.bottom); ctx.lineTo(p0.x, p0.y)
  for (let i = 1; i < points.length; i++) {
    const p = toS(points[i].t, points[i].m); ctx.lineTo(p.x, p.y)
  }
  const last = toS(points[points.length-1].t, points[points.length-1].m)
  ctx.lineTo(last.x, H - pad.bottom); ctx.closePath()
  const grad = ctx.createLinearGradient(0, pad.top, 0, H - pad.bottom)
  grad.addColorStop(0, gc + '0.15)'); grad.addColorStop(1, gc + '0.01)')
  ctx.fillStyle = grad; ctx.fill()

  // Glow line
  ctx.beginPath()
  const g0 = toS(points[0].t, points[0].m); ctx.moveTo(g0.x, g0.y)
  for (let i = 1; i < points.length; i++) {
    const p = toS(points[i].t, points[i].m); ctx.lineTo(p.x, p.y)
  }
  ctx.strokeStyle = gc + '0.2)'; ctx.lineWidth = 10
  ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke()

  // Main line
  ctx.beginPath()
  const l0 = toS(points[0].t, points[0].m); ctx.moveTo(l0.x, l0.y)
  for (let i = 1; i < points.length; i++) {
    const p = toS(points[i].t, points[i].m); ctx.lineTo(p.x, p.y)
  }
  ctx.strokeStyle = mc; ctx.lineWidth = 2.5
  ctx.shadowColor = mc; ctx.shadowBlur = 8; ctx.stroke(); ctx.shadowBlur = 0

  // Y-axis labels
  ctx.fillStyle = 'rgba(255,255,255,0.22)'
  ctx.font = '10px Roboto Mono, monospace'; ctx.textAlign = 'right'
  const step = Math.ceil(maxM / 5)
  for (let m = 1; m <= Math.ceil(maxM); m += step) {
    const py = toS(0, m).y
    if (py > pad.top + 4 && py < H - pad.bottom - 4)
      ctx.fillText(m + '×', pad.left - 6, py + 4)
  }

  // Plane at tip
  if (!isCrashed && points.length >= 2) {
    const tip  = toS(points[points.length-1].t, points[points.length-1].m)
    const prev = toS(points[points.length-2].t, points[points.length-2].m)
    const angle = Math.atan2(tip.y - prev.y, tip.x - prev.x)
    drawPlane(ctx, tip.x, tip.y, angle)
  }
}

// ── CASHOUT POPUP ──
function CashoutPopup({ payout, mult, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2600); return () => clearTimeout(t) }, [])
  return (
    <div className={styles.cashoutPopup}>
      <div className={styles.cashoutInner}>
        <div className={styles.cashoutMult}>{parseFloat(mult).toFixed(2)}×</div>
        <div className={styles.cashoutLabel}>YOU CASHED OUT</div>
        <div className={styles.cashoutPayout}>
          KSh {parseFloat(payout).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
        </div>
      </div>
    </div>
  )
}

// ── LOADING SCREEN ──
function LoadingIntro({ onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2400); return () => clearTimeout(t) }, [])
  return (
    <div className={styles.loadingScreen}>
      <div className={styles.loadingBg} />
      <div className={styles.loadingContent}>
        <div className={styles.loadingPlaneWrap}>
          <span className={styles.loadingPlaneShadow} />
          <span className={styles.loadingPlane}>✈</span>
        </div>
        <div className={styles.loadingLogo}>
          <span className={styles.loadingLogoText}>BetPesa</span>
          <span className={styles.loadingLogoSub}>AVIATOR</span>
        </div>
        <div className={styles.loadingBar}>
          <div className={styles.loadingFill} />
        </div>
        <div className={styles.loadingHint}>Connecting to server…</div>
      </div>
    </div>
  )
}

// ── MAIN ──
export default function GameCanvas() {
  const canvasRef   = useRef(null)
  const pointsRef   = useRef([])
  const startRef    = useRef(null)
  const animRef     = useRef(null)
  const starsRef    = useRef(makeStars())
  const cloudsRef   = useRef(makeClouds())
  const prevPhase   = useRef(null)
  const prevMult    = useRef(1)

  const [showIntro, setShowIntro] = useState(true)
  const [cashouts,  setCashouts]  = useState([])

  const phase      = useGameStore(s => s.phase)
  const mode       = useGameStore(s => s.mode)
  const multiplier = useGameStore(s => s.multiplier)
  const countdown  = useGameStore(s => s.countdown)
  const crashAt    = useGameStore(s => s.crashAt)
  const bets       = useGameStore(s => s.bets)
  const updateBet  = useGameStore(s => s.updateBet)
  const updateDemoBalance = useGameStore(s => s.updateDemoBalance)

  function triggerCashout(payout, mult) {
    sfx.cashout()
    setCashouts(c => [...c, { id: Date.now() + Math.random(), payout, mult }])
  }

  useEffect(() => {
    window.__betpesaCashout = triggerCashout
    return () => { delete window.__betpesaCashout }
  }, [])

  // Phase transitions
  useEffect(() => {
    if (phase === prevPhase.current) return
    if (phase === 'waiting') {
      pointsRef.current = []
      startRef.current  = null
      cloudsRef.current = makeClouds()
      prevMult.current  = 1
    }
    if (phase === 'flying') { sfx.fly(); startRef.current = Date.now() }
    if (phase === 'crashed') sfx.crash()
    prevPhase.current = phase
  }, [phase])

  // Tick sound
  useEffect(() => {
    if (phase !== 'flying') return
    if (Math.floor(multiplier) > Math.floor(prevMult.current)) sfx.tick()
    prevMult.current = multiplier
  }, [multiplier, phase])

  // Demo auto-cashout
  useEffect(() => {
    if (mode !== 'demo' || phase !== 'flying') return
    ;[1, 2].forEach(p => {
      const b = bets[p]
      if (b.placed && !b.cashedOut && !b.cashing && b.autoEnabled && multiplier >= b.autoVal) {
        const payout = parseFloat((b.amount * multiplier).toFixed(2))
        updateDemoBalance(payout)
        updateBet(p, { cashedOut: true, cashedAtMult: multiplier })
        triggerCashout(payout, multiplier)
      }
    })
  }, [multiplier, mode])

  // Draw loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    function resize() { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    function draw() {
      const W = canvas.width, H = canvas.height
      const mult = multiplier || 1

      ctx.clearRect(0, 0, W, H)

      // ── BACKGROUND — shifts from dark night to dusk/blue as mult rises ──
      const skyPct = Math.min((mult - 1) / 15, 1)   // 0 at 1x → 1 at 15x+
      const r0 = Math.round(8  + skyPct * 10)
      const g0 = Math.round(10 + skyPct * 18)
      const b0 = Math.round(22 + skyPct * 40)
      const bg = ctx.createRadialGradient(W * 0.15, H * 0.85, 0, W * 0.5, H * 0.5, W)
      bg.addColorStop(0, `rgb(${r0+8},${g0+14},${b0+20})`)
      bg.addColorStop(0.6, `rgb(${r0},${g0},${b0})`)
      bg.addColorStop(1, `rgb(${Math.max(4,r0-4)},${Math.max(6,g0-4)},${Math.max(14,b0-6)})`)
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)

      // ── STARS — fade out as mult rises (clouds replace them) ──
      const starAlpha = Math.max(0, 1 - (mult - 1) / 8)
      if (starAlpha > 0) {
        starsRef.current.forEach(s => {
          s.o += s.speed * s.dir
          if (s.o > 0.55 || s.o < 0.05) s.dir *= -1
          ctx.beginPath()
          ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(200,215,255,${s.o * starAlpha})`
          ctx.fill()
        })
      }

      // ── CLOUDS — appear & drift as mult increases ──
      cloudsRef.current.forEach(cloud => {
        // Fade in when mult passes their spawn point
        const targetOpacity = mult >= cloud.spawnMult
          ? Math.min(0.75, (mult - cloud.spawnMult) / 2)
          : 0
        cloud.opacity += (targetOpacity - cloud.opacity) * 0.04
        // Drift left slowly
        if (cloud.opacity > 0.01) cloud.x -= cloud.speed
        if (cloud.x < -0.3) cloud.x = 1.2
        drawCloud(ctx, cloud.x * W, cloud.y * H, cloud.scale, cloud.opacity, cloud.puffs)
      })

      // Crash red flash
      if (phase === 'crashed') {
        const flash = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W * 0.7)
        flash.addColorStop(0, 'rgba(242,54,69,0.12)')
        flash.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = flash; ctx.fillRect(0, 0, W, H)
      }

      drawGrid(ctx, W, H, mult)

      if ((phase === 'flying' || phase === 'crashed') && startRef.current) {
        if (phase === 'flying') {
          const elapsed = (Date.now() - startRef.current) / 1000
          pointsRef.current.push({ t: elapsed, m: Math.pow(Math.E, elapsed * 0.65) })
        }
        if (pointsRef.current.length > 1)
          drawCurve(ctx, W, H, pointsRef.current, multiplier, phase === 'crashed')
      }

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(animRef.current); ro.disconnect() }
  }, [phase, multiplier])

  const crashed = phase === 'crashed'
  const flying  = phase === 'flying'
  const waiting = phase === 'waiting'

  return (
    <div className={styles.wrap}>
      {showIntro && <LoadingIntro onDone={() => setShowIntro(false)} />}

      <canvas ref={canvasRef} className={styles.canvas} />

      {/* MULTIPLIER — left aligned, Spribe style */}
      {flying && (
        <div className={styles.multOverlay}>
          <div className={styles.multValue}>{multiplier.toFixed(2)}×</div>
          <div className={styles.multSub}>✈ FLYING</div>
        </div>
      )}

      {/* CRASH — single overlay, no duplicate */}
      {crashed && (
        <div className={styles.crashOverlay}>
          <div className={styles.crashEmoji}>💥</div>
          <div className={styles.crashLabel}>FLEW AWAY!</div>
          <div className={styles.crashMult}>{crashAt?.toFixed(2)}×</div>
        </div>
      )}

      {/* WAITING */}
      {waiting && (
        <div className={styles.waitOverlay}>
          <div className={styles.waitInner}>
            <div className={styles.waitPlane}>✈</div>
            <div className={styles.waitTitle}>PLACING BETS</div>
            <div className={styles.waitSub}>Next flight in</div>
            <div className={styles.waitCount}>{countdown}s</div>
            <div className={styles.waitBar}>
              <div className={styles.waitFill} style={{ width: `${Math.max(0,((5-countdown)/5))*100}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* CASHOUT POPUPS */}
      {cashouts.map(c => (
        <CashoutPopup
          key={c.id} payout={c.payout} mult={c.mult}
          onDone={() => setCashouts(cs => cs.filter(x => x.id !== c.id))}
        />
      ))}

      {mode === 'demo' && (
        <div className={styles.demoWatermark}><span>DEMO</span></div>
      )}
    </div>
  )
}
