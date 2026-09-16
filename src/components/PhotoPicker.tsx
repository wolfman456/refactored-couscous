import { useCallback, useEffect, useRef, useState } from 'react'
import { deleteMedia, fetchMedia, uploadMedia, type MediaAsset } from '../api/media'

interface PhotoPickerProps {
  selectedIds: number[]
  onToggle: (id: number) => void
}

export default function PhotoPicker({ selectedIds, onToggle }: PhotoPickerProps) {
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const refresh = useCallback(() => {
    fetchMedia()
      .then((assets) => {
        setError(null)
        setAssets(assets)
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Failed to load photo library'),
      )
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const handleUpload = async (file: File | undefined) => {
    if (!file) {
      return
    }
    setUploading(true)
    setError(null)
    try {
      const asset = await uploadMedia(file)
      onToggle(asset.id)
      await refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (asset: MediaAsset) => {
    try {
      await deleteMedia(asset.id)
      if (selectedIds.includes(asset.id)) {
        onToggle(asset.id)
      }
      await refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  if (loading) {
    return <p className="picker-note">Loading photos…</p>
  }

  if (error) {
    return (
      <div className="picker-error">
        <p>{error}</p>
        <button type="button" onClick={refresh}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="photo-picker">
      <div className="picker-actions">
        <input
          ref={fileInput}
          type="file"
          accept="image/*,video/*"
          hidden
          data-testid="picker-file-input"
          onChange={(e) => {
            const files = e.target.files
            void handleUpload(files?.[0])
            if (fileInput.current) {
              fileInput.current.value = ''
            }
          }}
        />
        <button type="button" onClick={() => fileInput.current?.click()} disabled={uploading}>
          {uploading ? 'Uploading…' : 'Upload photo'}
        </button>
        <span className="picker-count">{selectedIds.length} selected</span>
      </div>
      {assets.length === 0 ? (
        <p className="picker-empty">No photos in the library yet.</p>
      ) : (
        <div className="picker-grid">
          {assets.map((asset) => {
            const checked = selectedIds.includes(asset.id)
            return (
              <div key={asset.id} className="picker-cell-wrap">
                <button
                  type="button"
                  className={`picker-cell${checked ? ' picker-cell-checked' : ''}`}
                  onClick={() => onToggle(asset.id)}
                  aria-pressed={checked}
                >
                  {asset.assetType === 'VIDEO' ? (
                    <video
                      src={asset.url}
                      controls
                      playsInline
                      preload="metadata"
                      className="picker-cell-media"
                    />
                  ) : (
                    <img src={asset.url} alt={`Library photo ${asset.id}`} className="picker-cell-media" />
                  )}
                  <span className="picker-cell-check" aria-hidden="true">
                    {checked ? '✓' : ''}
                  </span>
                </button>
                <button
                  type="button"
                  className="picker-cell-remove"
                  onClick={() => {
                    void handleDelete(asset)
                  }}
                >
                  Remove
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}