# ✈ BetPesa — Frontend (React + Vite)

Aviator crash game frontend — matches Spribe UI, fully responsive mobile + desktop.

---

## 🚀 Quick Start

```bash
npm install
cp .env.example .env      # set your API URL
npm run dev               # starts on localhost:3000
```

---

## 📁 Structure

```
src/
├── components/
│   ├── GameCanvas.jsx     # Curve + plane animation (canvas)
│   ├── BetPanel.jsx       # Dual bet controls
│   ├── SidePanel.jsx      # Live bets / my bets / chat (desktop)
│   └── HistoryBar.jsx     # Top bar with round history chips
├── pages/
│   ├── GamePage.jsx       # Main game layout
│   ├── AuthPage.jsx       # Login / Register
│   ├── WalletPage.jsx     # Deposit + Withdraw via M-Pesa
│   └── MobilePages.jsx    # Mobile-only: LiveBets, MyBets, Chat
├── hooks/
│   └── useSocket.js       # Socket.io connection + events
├── store/
│   └── gameStore.js       # Zustand global state
└── index.css              # Design tokens + global resets
```

---

## 📱 Responsive Layout

### Mobile (< 768px)
```
┌────────────────────┐
│ ✈ BetPesa  [1.00×] │  ← HistoryBar
├────────────────────┤
│                    │
│   GAME CANVAS      │  ← Curve + plane + multiplier
│                    │
├────────────────────┤
│ [Bet 1] [Bet 2]    │  ← Two bet panels
├────────────────────┤
│ 💳  👥  📋  💬    │  ← Bottom nav (wallet, bets, chat)
└────────────────────┘
```

### Desktop (≥ 768px)
```
┌──────────────────────────────────┐
│ ✈ BetPesa  [chips]      [KSh bal]│  ← HistoryBar
├──────────────────────┬───────────┤
│                      │ Live Bets │
│   GAME CANVAS        │ My Bets   │  ← Side panel
│                      │ Chat      │
├──────────────────────┴───────────┤
│    [Bet Panel 1]  [Bet Panel 2]  │  ← Bet controls
└──────────────────────────────────┘
```

---

## 🔌 Socket Events Handled

| Event | Action |
|---|---|
| `round:waiting` | Show countdown, reset bets |
| `round:started` | Start canvas animation |
| `round:tick` | Update multiplier, trigger auto cashout |
| `round:crashed` | Show crash overlay, freeze curve |
| `bet:confirmed` | Mark bet placed, update balance |
| `cashout:success` | Show cashed out state |
| `livebets:new` | Add to live bets panel |
| `chat:message` | Add to chat |

---

## 🎨 Design Tokens (index.css)

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0d0f1e` | Page background |
| `--card` | `#1b2035` | Panel backgrounds |
| `--red` | `#ff3e3e` | Crash, buttons |
| `--orange` | `#ff6b35` | Curve line, accents |
| `--green` | `#26de81` | Bet button, wins |
| `--gold` | `#fed330` | Balance display |
