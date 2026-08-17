import { type FormEvent, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { login } from '../api'
import { useAuthStore } from '../authStore'

export function AdminLoginPage() {
  const token = useAuthStore((s) => s.token)
  const setSession = useAuthStore((s) => s.setSession)
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/manage'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (token) return <Navigate to="/manage" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const data = await login(username, password)
      setSession(data.token, data.user)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="manage-login">
      <div className="manage-login__glow" aria-hidden="true" />
      <form className="manage-login__card" onSubmit={onSubmit}>
        <p className="manage-brand__eyebrow">United Gas & Home Appliances</p>
        <h1>Staff sign in</h1>
        <p className="manage-login__hint">
          Manage catalogue, enquiries, and homepage content — not visible to shoppers.
        </p>
        {error ? <p className="manage-alert">{error}</p> : null}
        <label className="manage-field">
          <span>Username</span>
          <input
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
          />
        </label>
        <label className="manage-field">
          <span>Password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button className="manage-btn manage-btn--primary manage-btn--block" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Enter manage panel'}
        </button>
        <a className="manage-storefront-link" href="/">
          ← Back to storefront
        </a>
      </form>
    </div>
  )
}
