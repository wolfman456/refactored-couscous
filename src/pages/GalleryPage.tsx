import { useEffect, useState } from 'react'
import { fetchGallery, type GalleryItem } from '../api/gallery'

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGallery()
      .then(setItems)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load gallery'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <p className="gallery-note">Loading gallery…</p>
  }

  if (error) {
    return <p className="gallery-note gallery-error">{error}</p>
  }

  if (items.length === 0) {
    return <p className="gallery-note">No pieces posted yet — check back soon.</p>
  }

  return (
    <section className="gallery-grid">
      {items.map((item) => (
        <article key={item.id} className="gallery-card">
          {item.images.length > 0 ? (
            <img
              src={item.images[0]}
              alt={item.title}
              loading="lazy"
              className="gallery-card-img"
            />
          ) : (
            <div className="gallery-card-img gallery-card-placeholder" />
          )}
          <div className="gallery-card-body">
            <h2>{item.title}</h2>
            {item.category && <span className="gallery-card-category">{item.category}</span>}
            {item.description && <p>{item.description}</p>}
          </div>
        </article>
      ))}
    </section>
  )
}