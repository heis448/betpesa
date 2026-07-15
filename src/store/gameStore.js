import { create } from 'zustand'

const DEMO_STARTING_BALANCE = 500

export const useGameStore = create((set, get) => ({
  // ── AUTH ──
  user:    null,
  token:   localStorage.getItem('bp_token') || null,
  setUser: (user)  => set({ user }),
  setToken:(token) => { localStorage.setItem('bp_token', token); set({ token }); },
  logout:  ()      => { localStorage.removeItem('bp_token'); set({ user: null, token: null }); },

  // ── MODE: live (default) | demo ──
  mode:        'live',
  demoBalance: DEMO_STARTING_BALANCE,

  setMode: (mode) => {
    set({
      mode,
      demoBalance: DEMO_STARTING_BALANCE, // reset demo balance on mode switch
      bets: {
        1: { placed: false, amount: 10,  cashedOut: false, autoEnabled: false, autoVal: 2.0, cashing: false },
        2: { placed: false, amount: 50,  cashedOut: false, autoEnabled: false, autoVal: 5.0, cashing: false },
      }
    })
  },

  resetDemo: () => set({ demoBalance: DEMO_STARTING_BALANCE }),

  updateDemoBalance: (delta) => set(s => ({
    demoBalance: Math.max(0, parseFloat((s.demoBalance + delta).toFixed(2)))
  })),

  // ── GAME ──
  phase:       'waiting',
  multiplier:  1.00,
  crashAt:     null,
  roundId:     null,
  seedHash:    null,
  serverSeed:  null,
  countdown:   5,

  // ── BETS ──
  bets: {
    1: { placed: false, amount: 10,  cashedOut: false, autoEnabled: false, autoVal: 2.0,  cashing: false },
    2: { placed: false, amount: 50,  cashedOut: false, autoEnabled: false, autoVal: 5.0,  cashing: false },
  },

  // ── HISTORY ──
  history:  [],
  liveBets: [],
  myBets:   [],
  chat:     [],

  // ── SETTINGS ──
  settings: { minBet: 10, maxBet: 50000 },

  // ── ACTIONS ──
  setPhase:      (phase)      => set({ phase }),
  setMultiplier: (multiplier) => set({ multiplier }),
  setCountdown:  (countdown)  => set({ countdown }),
  setRound:      (r)          => set({ roundId: r.roundId, seedHash: r.seedHash }),
  setSettings:   (settings)   => set({ settings }),

  setCrash: (data) => set({
    phase:      'crashed',
    crashAt:    data.crashAt,
    serverSeed: data.serverSeed,
  }),

  addHistory: (val) => set(s => ({
    history: [val, ...s.history].slice(0, 20)
  })),

  addLiveBet: (bet) => set(s => ({
    liveBets: [bet, ...s.liveBets].slice(0, 30)
  })),

  addChat: (msg) => set(s => ({
    chat: [...s.chat, msg].slice(-80)
  })),

  updateBet: (panel, patch) => set(s => ({
    bets: { ...s.bets, [panel]: { ...s.bets[panel], ...patch } }
  })),

  resetBets: () => set(s => ({
    bets: {
      1: { ...s.bets[1], placed: false, cashedOut: false, cashing: false },
      2: { ...s.bets[2], placed: false, cashedOut: false, cashing: false },
    }
  })),

  updateBalance: (balance) => set(s => ({
    user: s.user ? { ...s.user, balance } : s.user
  })),
}))
