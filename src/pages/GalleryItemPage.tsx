import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchGalleryItem, type GalleryItem } from '../api/gallery'
import Lightbox from '../components/Lightbox'
import { imageSrcSet, isVideoUrl } from '../lib/media'
import { metaDescription, useSeo } from '../lib/seo'

const FALLBACK_DESCRIPTION = 'A handcrafted piece by Six Kids Crafts.'

export default function GalleryItemPage() {
  const { id } = useParams()
  const [item, setItem] = useState<GalleryItem | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(!!id)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  useSeo({
    title: item ? `${item.title} · Six Kids Crafts` : 'Piece · Six Kids Crafts',
    description: item ? metaDescription(item.description, FALLBACK_DESCRIPTION) : FALLBACK_DESCRIPTION,
    image: item?.images[0],
  })

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

  const photoUrls = item.images.filter((url) => !isVideoUrl(url))

  const renderMedia = () => {
    let photoIndex = 0
    return item.images.map((url) => {
      if (isVideoUrl(url)) {
        return (
          <video
            key={url}
            src={url}
            controls
            playsInline
            preload="metadata"
            aria-label={item.title}
            className="gallery-detail-media"
          />
        )
      }
      const current = photoIndex
      photoIndex += 1
      return (
        <button
          key={url}
          type="button"
          className="gallery-detail-photo-btn"
          aria-label={`Enlarge photo ${current + 1} of ${item.title}`}
          onClick={() => setLightboxIndex(current)}
        >
          <img
            src={item.thumbnails?.[current] ?? url}
            srcSet={imageSrcSet(url, item.thumbnails?.[current])}
            sizes="(max-width: 700px) 100vw, 360px"
            alt={`${item.title} photo ${current + 1}`}
            loading="lazy"
            className="gallery-detail-media"
          />
        </button>
      )
    })
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
        <div className="gallery-detail-grid">{renderMedia()}</div>
      )}
      {lightboxIndex !== null && (
        <Lightbox
          images={photoUrls}
          title={item.title}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </article>
  )
}
