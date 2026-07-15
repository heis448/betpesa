import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { sendChat, getMyBets } from '../hooks/useSocket'
import { useState, useEffect } from 'react'
import styles from './MobilePages.module.css'

const COLORS = ['#e74c3c','#3498db','#9b59b6','#e67e22','#1abc9c','#27ae60','#f39c12']

function MobileShell({ title, children }) {
  const navigate = useNavigate()
  return (
    <div className={styles.shell}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate('/')}>← Back</button>
        <div className={styles.title}>{title}</div>
        <div />
      </div>
      <div className={styles.body}>{children}</div>
    </div>
  )
}

export function LiveBetsPage() {
  const liveBets = useGameStore(s => s.liveBets)
  return (
    <MobileShell title="👥 Live Bets">
      {liveBets.length === 0 && <div className={styles.empty}>No bets yet this round</div>}
      {liveBets.map((b, i) => {
        const color = COLORS[b.username?.charCodeAt(0) % COLORS.length] || COLORS[0]
        const init  = b.username?.substring(0, 2).toUpperCase() || '??'
        return (
          <div key={i} className={styles.row}>
            <div className={styles.avatar} style={{ background: color + '22', color, border: `1px solid ${color}44` }}>{init}</div>
            <span className={styles.uname}>{b.username}</span>
            <span className={styles.amt}>KSh {parseFloat(b.amount).toLocaleString()}</span>
            {b.cashedAt && <span className={styles.badge}>{parseFloat(b.cashedAt).toFixed(2)}×</span>}
          </div>
        )
      })}
    </MobileShell>
  )
}

export function MyBetsPage() {
  const myBets = useGameStore(s => s.myBets)

  useEffect(() => { getMyBets() }, [])

  return (
    <MobileShell title="📋 My Bets">
      {myBets.length === 0 && <div className={styles.empty}>No bets found</div>}
      {myBets.map((b, i) => (
        <div key={i} className={styles.row}>
          <div className={`${styles.dot} ${b.status === 'won' ? styles.won : b.status === 'lost' ? styles.lost : styles.active}`} />
          <div className={styles.betInfo}>
            <span className={styles.amt}>KSh {parseFloat(b.amount).toLocaleString()}</span>
            <span className={styles.sub}>Crash @ {parseFloat(b.crash_at).toFixed(2)}×</span>
          </div>
          {b.cashed_at_mult && <span className={styles.badge}>{parseFloat(b.cashed_at_mult).toFixed(2)}×</span>}
          <span className={`${styles.profit} ${parseFloat(b.profit) >= 0 ? styles.pos : styles.neg}`}>
            {parseFloat(b.profit) >= 0 ? '+' : ''}{parseFloat(b.profit || 0).toFixed(0)}
          </span>
        </div>
      ))}
    </MobileShell>
  )
}

export function ChatPage() {
  const chat = useGameStore(s => s.chat)
  const user = useGameStore(s => s.user)
  const [msg, setMsg] = useState('')

  function handleSend(e) {
    e.preventDefault()
    if (!msg.trim()) return
    sendChat(msg.trim())
    setMsg('')
  }

  return (
    <MobileShell title="💬 Chat">
      <div className={styles.chatList}>
        {chat.map((m, i) => (
          <div key={i} className={styles.chatMsg}>
            <span className={styles.chatUser}>{m.username}</span>
            <span className={styles.chatText}>{m.message}</span>
          </div>
        ))}
        {chat.length === 0 && <div className={styles.empty}>No messages yet</div>}
      </div>
      <form className={styles.chatForm} onSubmit={handleSend}>
        <input
          className={styles.chatInput}
          value={msg}
          onChange={e => setMsg(e.target.value)}
          placeholder={user ? 'Say something...' : 'Login to chat'}
          disabled={!user}
          maxLength={200}
        />
        <button className={styles.chatSend} type="submit" disabled={!user}>Send</button>
      </form>
    </MobileShell>
  )
}
