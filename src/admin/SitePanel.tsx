import { useCallback, useEffect, useState } from 'react'
import {
  fetchAdminSettings,
  updateSettings,
  type SiteSettings,
} from '../api/settings'
import PhotoPicker from '../components/PhotoPicker'

function toForm(settings: SiteSettings): {
  siteTitle: string
  backgroundMediaId: number | null
  contactEmail: string
  etsyUrl: string
  instagramUrl: string
  facebookUrl: string
} {
  return {
    siteTitle: settings.siteTitle,
    backgroundMediaId: settings.backgroundMediaId,
    contactEmail: settings.contactEmail ?? '',
    etsyUrl: settings.etsyUrl ?? '',
    instagramUrl: settings.instagramUrl ?? '',
    facebookUrl: settings.facebookUrl ?? '',
  }
}

export default function SitePanel() {
  const [siteTitle, setSiteTitle] = useState('')
  const [backgroundMediaId, setBackgroundMediaId] = useState<number | null>(null)
  const [contactEmail, setContactEmail] = useState('')
  const [etsyUrl, setEtsyUrl] = useState('')
  const [instagramUrl, setInstagramUrl] = useState('')
  const [facebookUrl, setFacebookUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)

  const refresh = useCallback(() => {
    fetchAdminSettings()
      .then((settings) => {
        setError(null)
        const form = toForm(settings)
        setSiteTitle(form.siteTitle)
        setBackgroundMediaId(form.backgroundMediaId)
        setContactEmail(form.contactEmail)
        setEtsyUrl(form.etsyUrl)
        setInstagramUrl(form.instagramUrl)
        setFacebookUrl(form.facebookUrl)
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Failed to load settings'),
      )
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await updateSettings({
        siteTitle,
        backgroundMediaId,
        contactEmail,
        etsyUrl,
        instagramUrl,
        facebookUrl,
      })
      setSaved(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="picker-note">Loading settings…</p>
  }

  return (
    <section>
      <h2>Site settings</h2>
      {error && <p className="form-error">{error}</p>}
      <form onSubmit={handleSubmit} className="admin-form">
        <label>
          Site title
          <input
            type="text"
            value={siteTitle}
            onChange={(e) => setSiteTitle(e.target.value)}
          />
        </label>
        <p className="panel-hint">Background photo (pick one from the library):</p>
        <PhotoPicker
          selectedIds={backgroundMediaId === null ? [] : [backgroundMediaId]}
          onToggle={(id) =>
            setBackgroundMediaId((prev) => (prev === id ? null : id))
          }
        />
        <label>
          Contact email
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
          />
        </label>
        <label>
          Etsy shop URL
          <input type="url" value={etsyUrl} onChange={(e) => setEtsyUrl(e.target.value)} />
        </label>
        <label>
          Instagram URL
          <input
            type="url"
            value={instagramUrl}
            onChange={(e) => setInstagramUrl(e.target.value)}
          />
        </label>
        <label>
          Facebook URL
          <input
            type="url"
            value={facebookUrl}
            onChange={(e) => setFacebookUrl(e.target.value)}
          />
        </label>
        <div className="admin-form-actions">
          <button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save settings'}
          </button>
          {saved && <span className="save-note">Saved.</span>}
        </div>
      </form>
    </section>
  )
}