import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { useSocket } from '../hooks/useSocket'
import GameCanvas from '../components/GameCanvas'
import BetPanel   from '../components/BetPanel'
import SidePanel  from '../components/SidePanel'
import HistoryBar from '../components/HistoryBar'
import AuthModal  from '../components/AuthModal'
import styles from './GamePage.module.css'

export default function GamePage() {
  const [showAuth, setShowAuth] = useState(false)
  const token = useGameStore(s => s.token)
  const user  = useGameStore(s => s.user)

  // Socket connects immediately — guest or authenticated
  useSocket()

  // Called by BetPanel when user tries to bet without login
  function requireAuth() {
    if (!token) { setShowAuth(true); return false }
    return true
  }

  return (
    <div className={styles.root}>
      {/* Auth modal — shown when guest tries to bet */}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      {/* TOP BAR */}
      <HistoryBar onLoginClick={() => setShowAuth(true)} />

      {/* MIDDLE */}
      <div className={styles.middle}>
        <div className={styles.canvasArea}>
          <GameCanvas />
        </div>
        <div className={styles.sideDesktop}>
          <SidePanel onLoginClick={() => setShowAuth(true)} />
        </div>
      </div>

      {/* BOTTOM */}
      <div className={styles.bottom}>
        <div className={styles.betPanels}>
          <BetPanel panel={1} requireAuth={requireAuth} />
          <BetPanel panel={2} requireAuth={requireAuth} />
        </div>

        {/* Mobile nav */}
        <MobileNav onLoginClick={() => setShowAuth(true)} />
      </div>
    </div>
  )
}

function MobileNav({ onLoginClick }) {
  const navigate = useNavigate()
  const token    = useGameStore(s => s.token)
  const logout   = useGameStore(s => s.logout)

  return (
    <div className={styles.mobileNav}>
      <button className={styles.navBtn} onClick={() => token ? navigate('/wallet') : onLoginClick()}>
        <span className={styles.navIcon}>💳</span>
        <span className={styles.navLabel}>Wallet</span>
      </button>
      <button className={styles.navBtn} onClick={() => navigate('/livebets')}>
        <span className={styles.navIcon}>👥</span>
        <span className={styles.navLabel}>Live Bets</span>
      </button>
      <button className={styles.navBtn} onClick={() => token ? navigate('/mybets') : onLoginClick()}>
        <span className={styles.navIcon}>📋</span>
        <span className={styles.navLabel}>My Bets</span>
      </button>
      <button className={styles.navBtn} onClick={() => token ? navigate('/chat') : onLoginClick()}>
        <span className={styles.navIcon}>💬</span>
        <span className={styles.navLabel}>Chat</span>
      </button>
      {token ? (
        <button className={styles.navBtn} onClick={logout}>
          <span className={styles.navIcon}>🚪</span>
          <span className={styles.navLabel}>Logout</span>
        </button>
      ) : (
        <button className={`${styles.navBtn} ${styles.navLogin}`} onClick={onLoginClick}>
          <span className={styles.navIcon}>👤</span>
          <span className={styles.navLabel}>Login</span>
        </button>
      )}
    </div>
  )
}
