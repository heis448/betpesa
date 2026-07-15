import { useState } from 'react'
import axios from 'axios'
import { useGameStore } from '../store/gameStore'
import { useNavigate } from 'react-router-dom'
import styles from './WalletPage.module.css'

const API = ''

export default function WalletPage() {
  const [tab, setTab]         = useState('deposit')
  const [amount, setAmount]   = useState(100)
  const [phone, setPhone]     = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg]         = useState(null)
  const [txId, setTxId]       = useState(null)
  const [polling, setPolling] = useState(false)

  const token    = useGameStore(s => s.token)
  const user     = useGameStore(s => s.user)
  const navigate = useNavigate()

  const headers = { Authorization: `Bearer ${token}` }

  async function handleDeposit() {
    if (amount < 10) return setMsg({ type: 'error', text: 'Minimum deposit is KSh 10' })
    setLoading(true)
    setMsg(null)

    try {
      const { data } = await axios.post(API + '/backend/api/wallet/deposit',
        { amount, phone: phone || user?.phone },
        { headers }
      )

      if (data.success) {
        setTxId(data.transactionId)
        setMsg({ type: 'info', text: '📲 Check your phone and enter M-Pesa PIN...' })
        pollStatus(data.transactionId)
      } else {
        setMsg({ type: 'error', text: data.error })
      }
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.error || 'Error occurred' })
    } finally {
      setLoading(false)
    }
  }

  async function pollStatus(id) {
    setPolling(true)
    for (let i = 0; i < 20; i++) {
      await sleep(3000)
      try {
        const { data } = await axios.get(`${API}/backend/api/wallet/deposit/${id}/status`, { headers })
        if (data.status === 'completed') {
          setMsg({ type: 'success', text: `✅ KSh ${amount} deposited successfully!` })
          setPolling(false)
          return
        }
        if (['cancelled', 'failed', 'rejected'].includes(data.status)) {
          setMsg({ type: 'error', text: `❌ Payment ${data.status}` })
          setPolling(false)
          return
        }
      } catch {}
    }
    setMsg({ type: 'error', text: '⏰ Payment timed out. Try again.' })
    setPolling(false)
  }

  async function handleWithdraw() {
    if (amount < 100) return setMsg({ type: 'error', text: 'Minimum withdrawal is KSh 100' })
    if (amount > (user?.balance || 0)) return setMsg({ type: 'error', text: 'Insufficient balance' })
    setLoading(true)
    setMsg(null)

    try {
      const { data } = await axios.post(API + '/backend/api/wallet/withdraw',
        { amount, phone: phone || user?.phone },
        { headers }
      )
      if (data.success) {
        setMsg({ type: 'success', text: '✅ Withdrawal request submitted. Processing within 24 hours.' })
      } else {
        setMsg({ type: 'error', text: data.error })
      }
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.error || 'Error occurred' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <button className={styles.back} onClick={() => navigate('/')}>← Back</button>
          <div className={styles.title}>✈ Wallet</div>
          <div className={styles.bal}>
            KSh {parseFloat(user?.balance || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className={styles.tabs}>
          {['deposit', 'withdraw'].map(t => (
            <button
              key={t}
              className={`${styles.tab} ${tab === t ? styles.active : ''}`}
              onClick={() => { setTab(t); setMsg(null) }}
            >
              {t === 'deposit' ? '💳 Deposit' : '💸 Withdraw'}
            </button>
          ))}
        </div>

        <div className={styles.body}>
          <div className={styles.amtLabel}>Amount (KSh)</div>
          <div className={styles.amtRow}>
            <input
              type="number"
              className={styles.amtInput}
              value={amount}
              onChange={e => setAmount(parseFloat(e.target.value) || 0)}
              min={tab === 'deposit' ? 10 : 100}
            />
          </div>

          <div className={styles.quickRow}>
            {[100, 500, 1000, 5000].map(v => (
              <button key={v} className={styles.quick} onClick={() => setAmount(v)}>
                {v >= 1000 ? `${v/1000}K` : v}
              </button>
            ))}
          </div>

          <div className={styles.phoneLabel}>M-Pesa Phone</div>
          <input
            type="tel"
            className={styles.phoneInput}
            value={phone || user?.phone || ''}
            onChange={e => setPhone(e.target.value)}
            placeholder="0712 345 678"
          />

          {msg && (
            <div className={`${styles.msg} ${styles[msg.type]}`}>
              {msg.text}
              {polling && <div className={styles.spinner} />}
            </div>
          )}

          <button
            className={styles.actionBtn}
            onClick={tab === 'deposit' ? handleDeposit : handleWithdraw}
            disabled={loading || polling}
          >
            {loading ? 'Processing...' :
             polling ? '⏳ Waiting for payment...' :
             tab === 'deposit' ? `Deposit KSh ${amount.toLocaleString()}` : `Withdraw KSh ${amount.toLocaleString()}`}
          </button>

          {tab === 'deposit' && (
            <div className={styles.hint}>
              An M-Pesa STK push will be sent to your phone. Enter your PIN to complete.
            </div>
          )}
          {tab === 'withdraw' && (
            <div className={styles.hint}>
              Withdrawals are processed within 24 hours via M-Pesa B2C.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }
