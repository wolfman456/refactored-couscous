import { useState, type FormEvent } from 'react'
import { changePassword } from '../api/auth'
import { ApiError, encodeBasic, getUsername, setCredential } from '../api/client'

export default function PasswordPanel() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)
    if (newPassword !== confirmPassword) {
      setError('New password does not match the confirmation')
      setSaving(false)
      return
    }
    const username = getUsername()
    if (username === null) {
      setError('No active login')
      setSaving(false)
      return
    }
    try {
      await changePassword({ currentPassword, newPassword })
      setCredential(encodeBasic(username, newPassword))
      setSaved(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 400) {
        setError('Current password is incorrect')
      } else {
        setError(err instanceof Error ? err.message : 'Failed to change password')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <section>
      <h2>Change password</h2>
      <p className="panel-hint">
        Change the initial password to something only you know.
      </p>
      {error && <p className="form-error">{error}</p>}
      <form onSubmit={handleSubmit} className="admin-form">
        <label>
          Current password
          <input
            type="password"
            value={currentPassword}
            autoComplete="current-password"
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </label>
        <label>
          New password
          <input
            type="password"
            value={newPassword}
            autoComplete="new-password"
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </label>
        <label>
          Confirm new password
          <input
            type="password"
            value={confirmPassword}
            autoComplete="new-password"
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </label>
        <div className="admin-form-actions">
          <button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Change password'}
          </button>
          {saved && <span className="save-note">Password updated.</span>}
        </div>
      </form>
    </section>
  )
}