import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { sendChat, getMyBets } from '../hooks/useSocket'
import styles from './SidePanel.module.css'

const COLORS = ['#e74c3c','#3498db','#9b59b6','#e67e22','#1abc9c','#27ae60','#f39c12','#16a085']

export default function SidePanel({ onLoginClick }) {
  const [tab, setTab]     = useState('live')
  const [msg, setMsg]     = useState('')
  const liveBets  = useGameStore(s => s.liveBets)
  const myBets    = useGameStore(s => s.myBets)
  const chat      = useGameStore(s => s.chat)
  const user      = useGameStore(s => s.user)

  function handleTabChange(t) {
    setTab(t)
    if (t === 'mine') getMyBets()
  }

  function handleSend(e) {
    e.preventDefault()
    if (!msg.trim()) return
    sendChat(msg.trim())
    setMsg('')
  }

  return (
    <div className={styles.panel}>
      <div className={styles.tabs}>
        {[
          { id: 'live', label: 'Live Bets' },
          { id: 'mine', label: 'My Bets' },
          { id: 'chat', label: 'Chat' },
        ].map(t => (
          <button
            key={t.id}
            className={`${styles.tab} ${tab === t.id ? styles.active : ''}`}
            onClick={() => handleTabChange(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {/* ── LIVE BETS ── */}
        {tab === 'live' && (
          <div className={styles.list}>
            {liveBets.length === 0 && (
              <div className={styles.empty}>No bets yet this round</div>
            )}
            {liveBets.map((b, i) => {
              const color = COLORS[b.username?.charCodeAt(0) % COLORS.length] || COLORS[0]
              const init  = b.username?.substring(0, 2).toUpperCase() || '??'
              return (
                <div key={i} className={styles.betRow}>
                  <div className={styles.avatar} style={{ background: color + '22', color, border: `1px solid ${color}44` }}>
                    {init}
                  </div>
                  <span className={styles.uname}>{b.username}</span>
                  <span className={styles.amt}>KSh {parseFloat(b.amount).toLocaleString()}</span>
                  {b.cashedAt && (
                    <span className={styles.multBadge}>{parseFloat(b.cashedAt).toFixed(2)}×</span>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── MY BETS ── */}
        {tab === 'mine' && (
          <div className={styles.list}>
            {myBets.length === 0 && (
              <div className={styles.empty}>No bets yet</div>
            )}
            {myBets.map((b, i) => (
              <div key={i} className={styles.betRow}>
                <div className={`${styles.statusDot} ${b.status === 'won' ? styles.won : b.status === 'lost' ? styles.lost : styles.active}`} />
                <span className={styles.amt}>KSh {parseFloat(b.amount).toLocaleString()}</span>
                {b.cashed_at_mult && (
                  <span className={styles.multBadge}>{parseFloat(b.cashed_at_mult).toFixed(2)}×</span>
                )}
                <span className={`${styles.profitBadge} ${parseFloat(b.profit) >= 0 ? styles.pos : styles.neg}`}>
                  {parseFloat(b.profit) >= 0 ? '+' : ''}{parseFloat(b.profit || 0).toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ── CHAT ── */}
        {tab === 'chat' && (
          <div className={styles.chatWrap}>
            <div className={styles.chatMsgs}>
              {chat.map((m, i) => (
                <div key={i} className={styles.chatMsg}>
                  <span className={styles.chatUser}>{m.username}</span>
                  <span className={styles.chatText}>{m.message}</span>
                </div>
              ))}
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
              <button className={styles.chatSend} type="submit" disabled={!user}>→</button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
