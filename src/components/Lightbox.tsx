import { useEffect, useRef, useState } from 'react'

interface LightboxProps {
  images: string[]
  title: string
  initialIndex: number
  onClose: () => void
}

export default function Lightbox({ images, title, initialIndex, onClose }: LightboxProps) {
  const [index, setIndex] = useState(
    initialIndex >= 0 && initialIndex < images.length ? initialIndex : 0,
  )
  const closeButton = useRef<HTMLButtonElement>(null)

  const current = images[index]

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButton.current?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      } else if (event.key === 'ArrowLeft') {
        setIndex((i) => (i > 0 ? i - 1 : images.length - 1))
      } else if (event.key === 'ArrowRight') {
        setIndex((i) => (i < images.length - 1 ? i + 1 : 0))
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [images.length, onClose])

  return (
    <div
      className="lightbox-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div className="lightbox-frame" onClick={(e) => e.stopPropagation()}>
        <button
          ref={closeButton}
          type="button"
          className="lightbox-close"
          aria-label="Close enlarged photo"
          onClick={onClose}
        >
          ✕
        </button>
        <img src={current} alt={`${title} photo ${index + 1}`} className="lightbox-media" />
      </div>
      {images.length > 1 && (
        <>
          <button
            type="button"
            className="lightbox-nav lightbox-prev"
            aria-label="Previous photo"
            onClick={(e) => {
              e.stopPropagation()
              setIndex((i) => (i > 0 ? i - 1 : images.length - 1))
            }}
          >
            ‹
          </button>
          <button
            type="button"
            className="lightbox-nav lightbox-next"
            aria-label="Next photo"
            onClick={(e) => {
              e.stopPropagation()
              setIndex((i) => (i < images.length - 1 ? i + 1 : 0))
            }}
          >
            ›
          </button>
          <p className="lightbox-counter" aria-hidden="true">
            {index + 1} / {images.length}
          </p>
        </>
      )}
    </div>
  )
}