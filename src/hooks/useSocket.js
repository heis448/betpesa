import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { useGameStore } from '../store/gameStore'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

let socket = null

export function useSocket() {
  const initialized = useRef(false)
  const {
    token, setPhase, setMultiplier, setCountdown,
    setRound, setCrash, addHistory, addLiveBet,
    addChat, updateBet, resetBets, updateBalance,
    setSettings,
  } = useGameStore()

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    // ── Connect as guest OR authenticated user ──
    const authOpts = token ? { auth: { token } } : {}

    socket = io(SOCKET_URL, {
      ...authOpts,
      path: '/betpesa/socket.io',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    })

    socket.on('connect', () => {
      console.log('🔌 Socket connected', token ? '(authenticated)' : '(guest)')
      socket.emit('history:get')
    })

    socket.on('connect_error', (err) => {
      console.warn('Socket error:', err.message)
    })

    socket.on('disconnect', () => console.log('🔌 disconnected'))

    // ── ROUND EVENTS (available to everyone — guest + logged in) ──
    socket.on('round:waiting', (data) => {
      setPhase('waiting')
      setMultiplier(1.00)
      setCountdown(Math.round((data.waitMs || 5000) / 1000))
      setRound(data)
      resetBets()
      if (data.minBet) setSettings({ minBet: data.minBet, maxBet: data.maxBet })

      let c = Math.round((data.waitMs || 5000) / 1000)
      const iv = setInterval(() => {
        c--
        setCountdown(c)
        if (c <= 0) clearInterval(iv)
      }, 1000)
    })

    socket.on('round:started', (data) => {
      setPhase('flying')
      setRound(data)
    })

    socket.on('round:tick', ({ multiplier }) => {
      setMultiplier(multiplier)

      // Auto cashout — only in live mode + logged in
      const { bets, mode } = useGameStore.getState()
      if (mode === 'live' && token) {
        ;[1, 2].forEach(p => {
          const b = bets[p]
          if (b.placed && !b.cashedOut && !b.cashing && b.autoEnabled && multiplier >= b.autoVal) {
            requestCashout(p)
          }
        })
      }
    })

    socket.on('round:crashed', (data) => {
      setCrash(data)
      addHistory(data.crashAt)

      // Demo mode: settle uncashed bets as lost
      const { mode, bets, updateBet } = useGameStore.getState()
      if (mode === 'demo') {
        ;[1, 2].forEach(p => {
          const b = bets[p]
          if (b.placed && !b.cashedOut) {
            updateBet(p, { placed: false, cashedOut: false })
          }
        })
      }
    })

    socket.on('game:maintenance', () => setPhase('maintenance'))

    // ── BET EVENTS (authenticated only — server ignores guests) ──
    socket.on('bet:confirmed', ({ amount, balance, panel }) => {
      updateBet(panel || 1, { placed: true })
      updateBalance(balance)
    })

    socket.on('bet:error', ({ error, panel }) => {
      updateBet(panel || 1, { placed: false })
      alert(error)
    })

    socket.on('cashout:success', ({ multiplier, payout, profit, balance, panel }) => {
      updateBet(panel || 1, { cashedOut: true, cashedAtMult: multiplier, cashing: false })
      updateBalance(balance)
    })

    socket.on('cashout:capped', ({ message }) => console.warn('Capped:', message))
    socket.on('cashout:error',  () => { updateBet(1, { cashing: false }); updateBet(2, { cashing: false }) })

    // ── LIVE BETS (everyone sees) ──
    socket.on('livebets:new', (bet) => addLiveBet(bet))

    // ── HISTORY ──
    socket.on('history:data', (rounds) => {
      useGameStore.setState({ history: rounds.map(r => parseFloat(r.crash_at)) })
    })

    socket.on('mybets:data', (b) => useGameStore.setState({ myBets: b }))

    // ── CHAT (everyone sees, only logged in can send) ──
    socket.on('chat:message', (msg) => addChat(msg))

    return () => {
      socket?.disconnect()
      initialized.current = false
    }
  }, []) // only run once on mount

  // Re-auth socket when token changes (user logs in)
  useEffect(() => {
    if (socket && token) {
      socket.auth = { token }
      socket.disconnect().connect()
    }
  }, [token])

  return socket
}

export function placeBet(panel, amount, autoCashout = null) {
  const { mode } = useGameStore.getState()
  if (mode === 'demo') return
  socket?.emit('bet:place', { amount, autoCashout, panel })
}

export function requestCashout(panel) {
  const { mode } = useGameStore.getState()
  if (mode === 'demo') return
  useGameStore.getState().updateBet(panel, { cashing: true })
  socket?.emit('bet:cashout', { panel })
}

export function sendChat(msg) {
  socket?.emit('chat:send', msg)
}

export function getMyBets() {
  socket?.emit('mybets:get')
}
