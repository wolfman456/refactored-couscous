import { useState, type FormEvent } from 'react'
import { encodeBasic, setCredential } from '../api/client'
import { fetchAdminSettings } from '../api/settings'

export default function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    setCredential(encodeBasic(username, password))
    try {
      await fetchAdminSettings()
      onSuccess()
    } catch (err: unknown) {
      setCredential(null)
      setError(err instanceof Error ? 'Incorrect username or password' : 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="contact">
      <h1>Admin login</h1>
      <form onSubmit={handleSubmit} className="admin-form">
        <label>
          Username
          <input
            type="text"
            value={username}
            autoComplete="username"
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </section>
  )
}