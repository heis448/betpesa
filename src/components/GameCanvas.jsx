import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import styles from './GameCanvas.module.css'

// ─────────────────────────────────────────────
//  AUDIO  — Spribe-accurate
//  • Rising: looping band-pass filtered white noise (jet engine hum)
//            + slow pitch ramp as multiplier climbs
//  • Flyaway: short sharp whoosh descending
//  • Crash:   same whoosh but cut dead (no extra tone)
//  • Cashout: bright upward 3-note ding (C5-E5-G5)
//  • Tick:    soft high click every whole-number multiplier
// ─────────────────────────────────────────────
let _ctx = null
function ac() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (_ctx.state === 'suspended') _ctx.resume()
  return _ctx
}

// Persistent engine node refs
let engineNodes = null

function startEngine(mult = 1) {
  try {
    const c = ac()
    stopEngine()

    // White noise source
    const bufSize = c.sampleRate * 2
    const buf = c.createBuffer(1, bufSize, c.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1
    const src = c.createBufferSource()
    src.buffer = buf
    src.loop = true

    // Band-pass filter — jet turbine character
    const bp = c.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 420
    bp.Q.value = 0.9

    // Low-pass to smooth it
    const lp = c.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 900

    // Gain
    const gain = c.createGain()
    gain.gain.value = 0.18

    src.connect(bp)
    bp.connect(lp)
    lp.connect(gain)
    gain.connect(c.destination)
    src.start()

    engineNodes = { src, bp, lp, gain }
  } catch (e) {}
}

function updateEngine(mult) {
  if (!engineNodes) return
  try {
    const c = ac()
    // Pitch rises subtly with multiplier (420 → 820 Hz over 1x→20x)
    const freq = 420 + Math.min(mult - 1, 19) * 21
    engineNodes.bp.frequency.setTargetAtTime(freq, c.currentTime, 0.4)
    // Volume also nudges up
    const vol = 0.18 + Math.min(mult - 1, 19) * 0.003
    engineNodes.gain.gain.setTargetAtTime(vol, c.currentTime, 0.4)
  } catch (e) {}
}

function stopEngine() {
  if (!engineNodes) return
  try { engineNodes.src.stop() } catch (e) {}
  engineNodes = null
}

const sfx = {
  cashout() {
    try {
      const c = ac()
      // Spribe cashout: bright 3-note arpeggio C5-E5-G5
      ;[[523.25, 0], [659.25, 0.11], [783.99, 0.22]].forEach(([freq, delay]) => {
        const o = c.createOscillator()
        const g = c.createGain()
        o.connect(g); g.connect(c.destination)
        o.type = 'sine'
        o.frequency.value = freq
        g.gain.setValueAtTime(0, c.currentTime + delay)
        g.gain.linearRampToValueAtTime(0.18, c.currentTime + delay + 0.01)
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + 0.28)
        o.start(c.currentTime + delay)
        o.stop(c.currentTime + delay + 0.3)
      })
    } catch (e) {}
  },

  flyaway() {
    try {
      const c = ac()
      stopEngine()
      // Whoosh: descending filtered noise burst
      const bufSize = c.sampleRate * 0.6
      const buf = c.createBuffer(1, bufSize, c.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1
      const src = c.createBufferSource()
      src.buffer = buf

      const hp = c.createBiquadFilter()
      hp.type = 'highpass'
      hp.frequency.setValueAtTime(2200, c.currentTime)
      hp.frequency.exponentialRampToValueAtTime(200, c.currentTime + 0.5)

      const g = c.createGain()
      g.gain.setValueAtTime(0.32, c.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.55)

      src.connect(hp); hp.connect(g); g.connect(c.destination)
      src.start(); src.stop(c.currentTime + 0.6)
    } catch (e) {}
  },

  tick() {
    try {
      const c = ac()
      const o = c.createOscillator()
      const g = c.createGain()
      o.connect(g); g.connect(c.destination)
      o.type = 'sine'
      o.frequency.value = 1320
      g.gain.setValueAtTime(0.04, c.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.035)
      o.start(); o.stop(c.currentTime + 0.04)
    } catch (e) {}
  },
}

// ─────────────────────────────────────────────
//  STARS
// ─────────────────────────────────────────────
function makeStars(n = 140) {
  return Array.from({ length: n }, () => ({
    x: Math.random(), y: Math.random(),
    r: Math.random() * 1.2 + 0.2,
    o: Math.random() * 0.55 + 0.08,
    speed: Math.random() * 0.0004 + 0.00008,
    dir: Math.random() > 0.5 ? 1 : -1,
  }))
}

// ─────────────────────────────────────────────
//  DRAW PLANE — Spribe-accurate simple cartoon red jet
//  Small, flat, bold — matches screenshots exactly
//  Origin = center of body, faces right (+x)
// ─────────────────────────────────────────────
function drawPlane(ctx, x, y, angle, scale = 1) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  ctx.scale(scale, scale)

  const RED  = '#e8192c'
  const DKRD = '#9a0f1e'

  // ── FLAME / EXHAUST — small warm glow behind tail ──
  const flame = ctx.createRadialGradient(-36, 0, 0, -36, 0, 12)
  flame.addColorStop(0,   'rgba(255,200,50,0.9)')
  flame.addColorStop(0.45,'rgba(255,90,10,0.65)')
  flame.addColorStop(1,   'rgba(255,40,0,0)')
  ctx.fillStyle = flame
  ctx.beginPath(); ctx.ellipse(-36, 0, 12, 5, 0, 0, Math.PI * 2); ctx.fill()

  // ── FUSELAGE — simple fat torpedo ──
  ctx.fillStyle = RED
  ctx.beginPath()
  ctx.moveTo(26, 0)
  ctx.bezierCurveTo(18, -5, -8, -6, -26, -3)
  ctx.lineTo(-36, 0)
  ctx.lineTo(-26,  3)
  ctx.bezierCurveTo(-8,  6, 18,  5, 26, 0)
  ctx.closePath()
  ctx.fill()
  // slight top sheen
  ctx.fillStyle = 'rgba(255,100,100,0.18)'
  ctx.beginPath()
  ctx.moveTo(20, -1)
  ctx.bezierCurveTo(10, -5, -8, -5.5, -24, -2)
  ctx.lineTo(-24, -3)
  ctx.bezierCurveTo(-8, -6, 10, -5, 20, 0)
  ctx.closePath()
  ctx.fill()

  // ── COCKPIT — small dark dome ──
  ctx.fillStyle = 'rgba(20,50,110,0.9)'
  ctx.beginPath(); ctx.ellipse(10, -2.5, 6, 3, -0.15, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.45)'
  ctx.beginPath(); ctx.ellipse(12, -3.8, 2, 1, -0.2, 0, Math.PI * 2); ctx.fill()

  // ── MAIN WINGS — swept back, both sides ──
  ctx.fillStyle = RED
  // top wing
  ctx.beginPath()
  ctx.moveTo(6, -4); ctx.lineTo(-8, -26); ctx.lineTo(-17, -20); ctx.lineTo(-3, -4)
  ctx.closePath(); ctx.fill()
  // bottom wing
  ctx.fillStyle = DKRD
  ctx.beginPath()
  ctx.moveTo(6,  4); ctx.lineTo(-8,  26); ctx.lineTo(-17, 20); ctx.lineTo(-3,  4)
  ctx.closePath(); ctx.fill()

  // ── TAIL FIN — upward ──
  ctx.fillStyle = RED
  ctx.beginPath()
  ctx.moveTo(-18, -3); ctx.lineTo(-26, -15); ctx.lineTo(-22, -3)
  ctx.closePath(); ctx.fill()

  // ── HORIZONTAL STABS ──
  ctx.fillStyle = DKRD
  ctx.beginPath()
  ctx.moveTo(-20, -2); ctx.lineTo(-28, -8); ctx.lineTo(-25, -2); ctx.closePath(); ctx.fill()
  ctx.beginPath()
  ctx.moveTo(-20,  2); ctx.lineTo(-28,  8); ctx.lineTo(-25,  2); ctx.closePath(); ctx.fill()

  ctx.restore()
}

// ─────────────────────────────────────────────
//  DRAW CURVE — Spribe-accurate red line + fill
// ─────────────────────────────────────────────
function drawCurve(ctx, W, H, points, currentMult, isCrashed) {
  if (points.length < 2) return

  const pad = { left: 52, bottom: 36, right: 20, top: 20 }
  const pw  = W - pad.left - pad.right
  const ph  = H - pad.top  - pad.bottom
  const maxT = Math.max(points[points.length - 1]?.t || 1, 1)
  const maxM  = Math.max(currentMult * 1.35, 2)

  function toS(t, m) {
    return {
      x: pad.left + (t / maxT) * pw,
      y: H - pad.bottom - ((m - 1) / (maxM - 1)) * ph,
    }
  }

  // ── Spribe uses RED for the curve, always ──
  const lineColor = isCrashed ? '#f23645' : '#f23645'
  const glowColor = isCrashed ? 'rgba(242,54,69,0.18)' : 'rgba(242,54,69,0.18)'
  const fillTop   = isCrashed ? 'rgba(242,54,69,0.08)' : 'rgba(242,54,69,0.08)'

  // fill under curve
  ctx.beginPath()
  const p0 = toS(points[0].t, points[0].m)
  ctx.moveTo(p0.x, H - pad.bottom)
  ctx.lineTo(p0.x, p0.y)
  for (let i = 1; i < points.length; i++) {
    const p = toS(points[i].t, points[i].m)
    ctx.lineTo(p.x, p.y)
  }
  const last = toS(points[points.length - 1].t, points[points.length - 1].m)
  ctx.lineTo(last.x, H - pad.bottom)
  ctx.closePath()
  const fillGrad = ctx.createLinearGradient(0, pad.top, 0, H - pad.bottom)
  fillGrad.addColorStop(0, fillTop)
  fillGrad.addColorStop(1, 'rgba(242,54,69,0.01)')
  ctx.fillStyle = fillGrad; ctx.fill()

  // glow pass
  ctx.beginPath()
  const g0 = toS(points[0].t, points[0].m); ctx.moveTo(g0.x, g0.y)
  for (let i = 1; i < points.length; i++) {
    const p = toS(points[i].t, points[i].m); ctx.lineTo(p.x, p.y)
  }
  ctx.strokeStyle = glowColor
  ctx.lineWidth = 10
  ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke()

  // main line
  ctx.beginPath()
  const l0 = toS(points[0].t, points[0].m); ctx.moveTo(l0.x, l0.y)
  for (let i = 1; i < points.length; i++) {
    const p = toS(points[i].t, points[i].m); ctx.lineTo(p.x, p.y)
  }
  ctx.strokeStyle = lineColor
  ctx.lineWidth = 2.5
  ctx.shadowColor = lineColor; ctx.shadowBlur = 8
  ctx.stroke(); ctx.shadowBlur = 0

  // Y-axis labels
  ctx.fillStyle = 'rgba(255,255,255,0.18)'
  ctx.font = '10px "Roboto Mono", monospace'
  ctx.textAlign = 'right'
  const step = Math.ceil(maxM / 5)
  for (let m = 1; m <= Math.ceil(maxM); m += step) {
    const py = toS(0, m).y
    if (py > pad.top + 4 && py < H - pad.bottom - 4)
      ctx.fillText(m + '×', pad.left - 6, py + 4)
  }

  // plane at tip (only when flying)
  if (!isCrashed && points.length >= 2) {
    const tip  = toS(points[points.length - 1].t, points[points.length - 1].m)
    const prev = toS(points[points.length - 2].t, points[points.length - 2].m)
    const angle = Math.atan2(tip.y - prev.y, tip.x - prev.x)
    const planeScale = Math.min(W, H) / 480  // responsive scale
    drawPlane(ctx, tip.x, tip.y, angle, planeScale)
  }
}

// ─────────────────────────────────────────────
//  GRID
// ─────────────────────────────────────────────
function drawGrid(ctx, W, H) {
  const pad = { left: 52, bottom: 36, right: 20, top: 20 }
  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.04)'
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

// ─────────────────────────────────────────────
//  CASHOUT POPUP — Spribe style
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
//  FLYBY CANVAS — renders the actual plane flying
//  across the bottom during waiting phase
// ─────────────────────────────────────────────
function FlybyCanvas() {
  const ref = useRef(null)
  const progRef = useRef(0)
  const animRef = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    function resize() {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const SPEED = 0.0028   // fraction of width per frame
    progRef.current = -0.12 // start offscreen left

    function draw() {
      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)

      progRef.current += SPEED
      if (progRef.current > 1.12) progRef.current = -0.12

      const px = progRef.current * W
      const py = H * 0.55
      const scale = Math.min(W, H) / 220  // smaller than in-game

      // fade near edges
      const edge = W * 0.08
      let alpha = 1
      if (px < edge)       alpha = Math.max(0, px / edge)
      if (px > W - edge)   alpha = Math.max(0, (W - px) / edge)
      ctx.globalAlpha = alpha

      drawPlane(ctx, px, py, 0, scale)
      ctx.globalAlpha = 1

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(animRef.current); ro.disconnect() }
  }, [])

  return <canvas ref={ref} className={styles.flybyCanvas} />
}

// ─────────────────────────────────────────────
//  WAITING SPLASH — Spribe/UFC style
//  Aviator branding center + SPRIBE badge
//  Plane flyby at bottom using actual canvas plane
//  Countdown fades in last 3 seconds
// ─────────────────────────────────────────────
function WaitingSplash({ countdown }) {
  const showCountdown = countdown <= 3

  return (
    <div className={styles.waitOverlay}>

      {/* ── CENTER: Aviator brand + SPRIBE badge ── */}
      <div className={styles.splashCenter}>

        {/* Aviator wordmark with plane icon — mirrors Spribe's own brand block */}
        <div className={styles.splashAviatorRow}>
          <svg className={styles.splashSvgPlane} viewBox="0 0 60 36" fill="none">
            {/* mini plane silhouette in red */}
            <path d="M52 18 C44 13 18 12 4 15 L0 18 L4 21 C18 24 44 23 52 18Z" fill="#e8192c"/>
            <path d="M30 16 L22 2 L14 6 L24 16Z" fill="#e8192c"/>
            <path d="M30 20 L22 34 L14 30 L24 20Z" fill="#9a0f1e"/>
            <path d="M6 17 L0 12 L4 17Z" fill="#9a0f1e"/>
            <path d="M6 19 L0 24 L4 19Z" fill="#9a0f1e"/>
            <ellipse cx="40" cy="15" rx="7" ry="3.5" fill="rgba(20,50,110,0.85)"/>
          </svg>
          <span className={styles.splashAviatorText}>Aviator</span>
        </div>

        <div className={styles.splashTagline}>POWERED BY</div>

        {/* SPRIBE badge — green border, exact Spribe style */}
        <div className={styles.splashBadge}>
          <div className={styles.splashBadgeLeft}>
            <div className={styles.splashSpribeS}>S</div>
          </div>
          <div className={styles.splashBadgeRight}>
            <div className={styles.splashBadgeName}>SPRIBE</div>
            <div className={styles.splashBadgeSub}>Official Game ✓ &nbsp;Since 2019</div>
          </div>
        </div>

      </div>

      {/* ── COUNTDOWN — fades in at last 3s ── */}
      <div className={`${styles.splashCountdown} ${showCountdown ? styles.splashCountdownVisible : ''}`}>
        <div className={styles.waitSub}>STARTING IN</div>
        <div className={styles.waitCount}>{countdown}s</div>
        <div className={styles.waitBar}>
          <div className={styles.waitFill} style={{ width: `${((5 - countdown) / 5) * 100}%` }} />
        </div>
        <div className={styles.waitHint}>Place your bets!</div>
      </div>

      {/* ── PLANE FLYBY — actual canvas plane ── */}
      <div className={styles.flybyTrack}>
        <FlybyCanvas />
      </div>

    </div>
  )
}

// ─────────────────────────────────────────────
//  MAIN
// ─────────────────────────────────────────────
export default function GameCanvas() {
  const canvasRef  = useRef(null)
  const pointsRef  = useRef([])
  const startRef   = useRef(null)
  const animRef    = useRef(null)
  const starsRef   = useRef(makeStars())
  const prevPhase  = useRef(null)
  const prevMult   = useRef(1)

  const [cashouts, setCashouts] = useState([])

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
      stopEngine()
      pointsRef.current = []
      startRef.current  = null
      prevMult.current  = 1
    }
    if (phase === 'flying') {
      startEngine(1)
      startRef.current = Date.now()
    }
    if (phase === 'crashed') {
      sfx.flyaway()
    }
    prevPhase.current = phase
  }, [phase])

  // Engine pitch update + tick sound
  useEffect(() => {
    if (phase !== 'flying') return
    updateEngine(multiplier)
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

    function resize() {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    function draw() {
      const W = canvas.width, H = canvas.height
      const mult = multiplier || 1

      ctx.clearRect(0, 0, W, H)

      // ── BACKGROUND — Spribe: flat very dark navy, no colour shift ──
      ctx.fillStyle = '#0b0e1a'
      ctx.fillRect(0, 0, W, H)

      // subtle radial vignette
      const vig = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, W * 0.75)
      vig.addColorStop(0, 'rgba(0,0,0,0)')
      vig.addColorStop(1, 'rgba(0,0,0,0.35)')
      ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H)

      // ── STARS — always visible (Spribe keeps them throughout) ──
      starsRef.current.forEach(s => {
        s.o += s.speed * s.dir
        if (s.o > 0.55 || s.o < 0.05) s.dir *= -1
        ctx.beginPath()
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200,215,255,${s.o})`
        ctx.fill()
      })

      // crash red flash overlay
      if (phase === 'crashed') {
        const flash = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.65)
        flash.addColorStop(0, 'rgba(242,54,69,0.10)')
        flash.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = flash; ctx.fillRect(0, 0, W, H)
      }

      drawGrid(ctx, W, H)

      if ((phase === 'flying' || phase === 'crashed') && startRef.current) {
        if (phase === 'flying') {
          const elapsed = (Date.now() - startRef.current) / 1000
          pointsRef.current.push({ t: elapsed, m: Math.pow(Math.E, elapsed * 0.65) })
          // cap buffer
          if (pointsRef.current.length > 800) pointsRef.current = pointsRef.current.slice(-600)
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
      <canvas ref={canvasRef} className={styles.canvas} />

      {/* ── MULTIPLIER — Spribe: white, left-center, no subtitle ── */}
      {flying && (
        <div className={styles.multOverlay}>
          <div className={styles.multValue}>{multiplier.toFixed(2)}×</div>
        </div>
      )}

      {/* ── CRASH — "Flew Away!" in red, multiplier in white below ── */}
      {crashed && (
        <div className={styles.crashOverlay}>
          <div className={styles.crashLabel}>FLEW AWAY!</div>
          <div className={styles.crashMult}>{crashAt?.toFixed(2)}×</div>
        </div>
      )}

      {/* ── WAITING — branded splash + flyby + countdown ── */}
      {waiting && <WaitingSplash countdown={countdown} />}

      {/* ── CASHOUT POPUPS ── */}
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
