import { useEffect, useState } from 'react'
import PhotoPicker from '../components/PhotoPicker'
import { fetchAdminSettings, updateSettings } from '../api/settings'
import { useSiteSettingsActions } from '../components/SiteSettingsContext'

export default function PhotosPanel() {
  const { setSettings } = useSiteSettingsActions()
  const [selected, setSelected] = useState<number[]>([])
  const [backgroundId, setBackgroundId] = useState<number | null>(null)
  const [savingBackground, setSavingBackground] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAdminSettings()
      .then((settings) => setBackgroundId(settings.backgroundMediaId))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Failed to load site settings'),
      )
  }, [])

  const handleSetBackground = async (id: number | null) => {
    if (savingBackground) {
      return
    }
    setSavingBackground(true)
    setError(null)
    try {
      const settings = await updateSettings({ backgroundMediaId: id })
      setBackgroundId(settings.backgroundMediaId)
      setSettings(settings)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to set background')
    } finally {
      setSavingBackground(false)
    }
  }

  return (
    <section>
      <h2>Photo library</h2>
      <p className="panel-hint">
        Upload images once here, then pick them for gallery pieces and articles. Use
        &ldquo;Set background&rdquo; to make a photo the site-wide background.
      </p>
      {error && <p className="form-error">{error}</p>}
      <PhotoPicker
        selectedIds={selected}
        onToggle={(id) =>
          setSelected((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
          )
        }
        backgroundId={backgroundId}
        onSetBackground={(id) => void handleSetBackground(id)}
      />
    </section>
  )
}
