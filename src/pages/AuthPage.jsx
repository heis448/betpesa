import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useGameStore } from '../store/gameStore'
import styles from './AuthPage.module.css'

const API = ''

export default function AuthPage() {
  const [tab, setTab]   = useState('login')
  const [form, setForm] = useState({ username: '', email: '', password: '', phone: '' })
  const [err, setErr]   = useState('')
  const [loading, setLoading] = useState(false)

  const setToken = useGameStore(s => s.setToken)
  const setUser  = useGameStore(s => s.setUser)
  const navigate = useNavigate()

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); setErr('') }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setErr('')

    try {
      const endpoint = tab === 'login' ? '/backend/api/auth/login' : '/backend/api/auth/register'
      const payload  = tab === 'login'
        ? { email: form.email, password: form.password }
        : form

      const { data } = await axios.post(API + endpoint, payload)

      if (data.success) {
        setToken(data.token)
        setUser(data.user)
        navigate('/')
      } else {
        setErr(data.error || 'Something went wrong')
      }
    } catch (e) {
      setErr(e.response?.data?.error || 'Connection error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logo}>✈ <span>BetPesa</span></div>
        <div className={styles.tagline}>Aviator — Kenya's #1 Crash Game</div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === 'login' ? styles.active : ''}`} onClick={() => setTab('login')}>Login</button>
          <button className={`${styles.tab} ${tab === 'register' ? styles.active : ''}`} onClick={() => setTab('register')}>Register</button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {tab === 'register' && (
            <label className={styles.field}>
              <span>Username</span>
              <input
                type="text"
                value={form.username}
                onChange={e => set('username', e.target.value)}
                placeholder="e.g. john254"
                required
              />
            </label>
          )}

          <label className={styles.field}>
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label className={styles.field}>
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              placeholder="••••••••"
              required
            />
          </label>

          {tab === 'register' && (
            <label className={styles.field}>
              <span>M-Pesa Phone</span>
              <input
                type="tel"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                placeholder="0712 345 678"
                required
              />
            </label>
          )}

          {err && <div className={styles.error}>{err}</div>}

          <button className={styles.submitBtn} type="submit" disabled={loading}>
            {loading ? 'Please wait...' : tab === 'login' ? 'Login' : 'Create Account'}
          </button>
        </form>

        <div className={styles.footer}>
          {tab === 'login' ? (
            <span>New here? <button onClick={() => setTab('register')}>Create account</button></span>
          ) : (
            <span>Already have an account? <button onClick={() => setTab('login')}>Login</button></span>
          )}
        </div>
      </div>
    </div>
  )
}
