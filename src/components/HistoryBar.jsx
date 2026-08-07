import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import styles from './HistoryBar.module.css'

export default function HistoryBar({ onLoginClick }) {
  const history     = useGameStore(s => s.history)
  const user        = useGameStore(s => s.user)
  const logout      = useGameStore(s => s.logout)
  const mode        = useGameStore(s => s.mode)
  const demoBalance = useGameStore(s => s.demoBalance)
  const setMode     = useGameStore(s => s.setMode)
  const navigate    = useNavigate()

  function chipClass(v) {
    if (v < 2)  return styles.lo
    if (v < 5)  return styles.md
    if (v < 10) return styles.hi
    return styles.xhi
  }

  const balance = mode === 'demo'
    ? demoBalance
    : parseFloat(user?.balance || 0)

  return (
    <div className={styles.bar}>
      <div className={styles.logo}>✈ <span>BetPesa</span></div>

      <div className={styles.chips}>
        {history.map((v, i) => (
          <span key={i} className={`${styles.chip} ${chipClass(v)}`}>
            {v.toFixed(2)}×
          </span>
        ))}
        {history.length === 0 && <span className={styles.noHistory}>No rounds yet</span>}
      </div>

      <div className={styles.right}>
        {/* DEMO / LIVE toggle — always visible */}
        <div className={styles.modeToggle}>
          <button
            className={`${styles.modeBtn} ${mode === 'demo' ? styles.modeDemoActive : styles.modeInactive}`}
            onClick={() => setMode('demo')}
          >
            DEMO
          </button>
          <button
            className={`${styles.modeBtn} ${mode === 'live' ? styles.modeLiveActive : styles.modeInactive}`}
            onClick={() => { setMode('live'); if (!user) onLoginClick() }}
          >
            LIVE
          </button>
        </div>

        {/* Balance or Login button */}
        {user ? (
          <>
            <button
              className={`${styles.balance} ${mode === 'demo' ? styles.demoBalance : ''}`}
              onClick={() => mode === 'live' && navigate('/wallet')}
              title={mode === 'live' ? 'Tap to deposit' : 'Demo balance'}
            >
              {mode === 'demo' && <span className={styles.demoTag}>DEMO</span>}
              KSh {balance.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
            </button>
            <button className={styles.logoutBtn} onClick={logout} title="Logout">✕</button>
          </>
        ) : (
          <>
            {mode === 'demo' && (
              <div className={styles.balance} style={{ cursor: 'default' }}>
                <span className={styles.demoTag}>DEMO</span>
                KSh {demoBalance.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
              </div>
            )}
            <button className={styles.loginBtn} onClick={onLoginClick}>
              Login / Register
            </button>
          </>
        )}
      </div>
    </div>
  )
}
