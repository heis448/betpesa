import { useGameStore } from '../store/gameStore'
import { placeBet, requestCashout } from '../hooks/useSocket'
import styles from './BetPanel.module.css'

export default function BetPanel({ panel, requireAuth }) {
  const phase             = useGameStore(s => s.phase)
  const bet               = useGameStore(s => s.bets[panel])
  const settings          = useGameStore(s => s.settings)
  const user              = useGameStore(s => s.user)
  const mode              = useGameStore(s => s.mode)
  const demoBalance       = useGameStore(s => s.demoBalance)
  const multiplier        = useGameStore(s => s.multiplier)
  const updateBet         = useGameStore(s => s.updateBet)
  const updateDemoBalance = useGameStore(s => s.updateDemoBalance)
  const resetDemo         = useGameStore(s => s.resetDemo)

  const isDemo = mode === 'demo'
  const { placed, amount, cashedOut, autoEnabled, autoVal, cashing, cashedAtMult } = bet

  function setAmount(v) {
    const val = Math.max(settings.minBet || 10, Math.min(settings.maxBet || 50000, parseFloat(v) || 10))
    updateBet(panel, { amount: val })
  }

  function handleMain() {
    if (isDemo) {
      if (phase === 'waiting' && !placed) {
        if (demoBalance <= 0) { resetDemo(); return }
        if (amount > demoBalance) return alert(`Demo balance too low! You have KSh ${demoBalance.toFixed(2)}`)
        updateDemoBalance(-amount)
        updateBet(panel, { placed: true })
      } else if (phase === 'waiting' && placed) {
        updateDemoBalance(amount)
        updateBet(panel, { placed: false })
      } else if (phase === 'flying' && placed && !cashedOut && !cashing) {
        const payout = parseFloat((amount * multiplier).toFixed(2))
        if (window.__betpesaCashout) window.__betpesaCashout(payout, multiplier)
        updateDemoBalance(payout)
        updateBet(panel, { cashedOut: true, cashedAtMult: multiplier })
      }
      return
    }

    if (!requireAuth()) return

    if (phase === 'waiting' && !placed) {
      if (!user || user.balance < amount) return alert('Insufficient balance. Please deposit.')
      placeBet(panel, amount, autoEnabled ? autoVal : null)
      updateBet(panel, { placed: true })
    } else if (phase === 'waiting' && placed) {
      updateBet(panel, { placed: false })
    } else if (phase === 'flying' && placed && !cashedOut && !cashing) {
      requestCashout(panel)
    }
  }

  const demoEmpty = isDemo && demoBalance <= 0 && !placed
  const livePayout = (amount * multiplier).toFixed(0)
  let btnLabel = '', btnClass = ''

  if (demoEmpty) {
    btnLabel = '🔄 Reset Demo'; btnClass = styles.btnReset
  } else if (phase === 'waiting') {
    if (!placed) {
      btnLabel = isDemo ? `BET  KSh ${amount.toLocaleString()}` : user ? `BET  KSh ${amount.toLocaleString()}` : 'LOGIN TO BET'
      btnClass = styles.btnBet
    } else {
      btnLabel = `CANCEL  KSh ${amount.toLocaleString()}`; btnClass = styles.btnCancel
    }
  } else if (phase === 'flying') {
    if (!placed)        { btnLabel = 'NEXT ROUND';                              btnClass = styles.btnIdle }
    else if (cashedOut) { btnLabel = `✓ CASHED  ${cashedAtMult?.toFixed(2)}×`; btnClass = styles.btnDone }
    else if (cashing)   { btnLabel = 'CASHING OUT...';                          btnClass = styles.btnCash }
    else                { btnLabel = `CASH OUT  KSh ${parseInt(livePayout).toLocaleString()}`; btnClass = styles.btnCash }
  } else if (phase === 'crashed') {
    btnLabel = isDemo ? 'BET' : user ? 'BET' : 'LOGIN TO BET'; btnClass = styles.btnBet
  }

  const disabled =
    !demoEmpty &&
    ((phase === 'flying' && (!placed || cashedOut || cashing)) || phase === 'crashed')

  return (
    <div className={`${styles.panel} ${isDemo ? styles.demoPanel : ''}`}>

      {/* Demo balance badge */}
      {isDemo && (
        <div className={styles.demoBadge}>
          🎮 DEMO &nbsp;·&nbsp; KSh {demoBalance.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
        </div>
      )}
      {!isDemo && !user && (
        <div className={styles.guestBadge}>👤 Login to place real bets</div>
      )}

      {/* Panel tabs */}
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${styles.tabActive}`}>
          {isDemo ? '🎮 Demo' : `Bet ${panel}`}
        </button>
        <button className={`${styles.tab} ${styles.tabInactive}`}>Auto</button>
      </div>

      {/* Amount row */}
      <div className={styles.amtRow}>
        <button className={styles.adj} onClick={() => setAmount(amount - 10)}>−</button>
        <div className={styles.amtWrap}>
          <input
            type="number"
            className={styles.amtInput}
            value={amount}
            onChange={e => setAmount(e.target.value)}
            disabled={placed && phase === 'flying'}
          />
          <span className={styles.currency}>KSh</span>
        </div>
        <button className={styles.adj} onClick={() => setAmount(amount + 10)}>+</button>
      </div>

      {/* Quick amounts */}
      <div className={styles.quickRow}>
        {[10, 50, 100, 500, 1000].map(v => (
          <button key={v} className={styles.quick} onClick={() => setAmount(v)}>
            {v >= 1000 ? `${v/1000}K` : v}
          </button>
        ))}
      </div>

      {/* Auto cashout */}
      <div className={styles.autoRow}>
        <span className={styles.autoLabel}>Auto Cash Out</span>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={autoEnabled}
            onChange={e => updateBet(panel, { autoEnabled: e.target.checked })}
          />
          <span className={styles.slider} />
        </label>
        <input
          type="number"
          className={styles.autoInput}
          value={autoVal}
          min="1.10"
          step="0.1"
          disabled={!autoEnabled}
          onChange={e => updateBet(panel, { autoVal: parseFloat(e.target.value) || 2 })}
        />
        <span className={styles.autoX}>×</span>
      </div>

      {/* Main button */}
      <button
        className={`${styles.mainBtn} ${btnClass}`}
        onClick={demoEmpty ? resetDemo : handleMain}
        disabled={disabled}
      >
        {btnLabel}
      </button>
    </div>
  )
}
