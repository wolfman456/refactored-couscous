import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchGalleryItem, type GalleryItem } from '../api/gallery'
import { imageSrcSet, isVideoUrl } from '../lib/media'

export default function GalleryItemPage() {
  const { id } = useParams()
  const [item, setItem] = useState<GalleryItem | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(!!id)

  useEffect(() => {
    if (!id) {
      return
    }
    fetchGalleryItem(Number(id))
      .then((item) => {
        setError(null)
        setItem(item)
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Failed to load piece'),
      )
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <p className="gallery-note">Loading piece…</p>
  }

  if (error || !item) {
    return (
      <section className="gallery-detail">
        <p className="gallery-note gallery-error">{error ?? 'Piece not found.'}</p>
        <p className="gallery-note-back">
          <Link to="/">← All pieces</Link>
        </p>
      </section>
    )
  }

  return (
    <article className="gallery-detail">
      <p className="gallery-note-back">
        <Link to="/">← All pieces</Link>
      </p>
      <h1 className="gallery-detail-title">{item.title}</h1>
      {item.categoryName && <p className="gallery-detail-category">{item.categoryName}</p>}
      {item.description && <p className="gallery-detail-description">{item.description}</p>}
      {item.images.length === 0 ? (
        <p className="gallery-note">No photos for this piece yet.</p>
      ) : (
        <div className="gallery-detail-grid">
          {item.images.map((url, index) =>
            isVideoUrl(url) ? (
              <video
                key={url}
                src={url}
                controls
                playsInline
                preload="metadata"
                aria-label={item.title}
                className="gallery-detail-media"
              />
            ) : (
              <img
                key={url}
                src={item.thumbnails?.[index] ?? url}
                srcSet={imageSrcSet(url, item.thumbnails?.[index])}
                sizes="(max-width: 700px) 100vw, 360px"
                alt={`${item.title} photo ${index + 1}`}
                loading="lazy"
                className="gallery-detail-media"
              />
            ),
          )}
        </div>
      )}
    </article>
  )
}
