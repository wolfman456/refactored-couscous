import { useEffect, useState } from 'react'
import { fetchGallery, type GalleryItem } from '../api/gallery'
import { fetchCategories, type Category } from '../api/categories'
import { imageSrcSet, isVideoUrl } from '../lib/media'

type ActiveTab = 'all' | number

const message = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeTab, setActiveTab] = useState<ActiveTab>('all')
  const [galleryError, setGalleryError] = useState<string | null>(null)
  const [categoryError, setCategoryError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void Promise.allSettled([fetchGallery(), fetchCategories()]).then(([gallery, tabs]) => {
      if (gallery.status === 'fulfilled') {
        setItems(gallery.value)
      } else {
        setGalleryError(message(gallery.reason, 'Failed to load gallery'))
      }
      if (tabs.status === 'fulfilled') {
        setCategories(tabs.value)
      } else {
        setCategoryError(message(tabs.reason, 'Failed to load categories'))
      }
      setLoading(false)
    })
  }, [])

  if (loading) {
    return <p className="gallery-note">Loading gallery…</p>
  }

  const visible =
    activeTab === 'all'
      ? items
      : items.filter((item) => item.categoryId === activeTab)

  return (
    <>
      {(galleryError || categoryError) && (
        <p className="gallery-note gallery-error">{galleryError ?? categoryError}</p>
      )}
      {categories.length > 0 && (
        <nav className="gallery-tabs" aria-label="Gallery categories">
          <button
            type="button"
            className={`gallery-tab${activeTab === 'all' ? ' gallery-tab-active' : ''}`}
            onClick={() => setActiveTab('all')}
            aria-pressed={activeTab === 'all'}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              className={`gallery-tab${activeTab === category.id ? ' gallery-tab-active' : ''}`}
              onClick={() => setActiveTab(category.id)}
              aria-pressed={activeTab === category.id}
            >
              {category.name}
            </button>
          ))}
        </nav>
      )}
      {visible.length === 0 ? (
        <p className="gallery-note">
          {items.length === 0
            ? 'No pieces posted yet — check back soon.'
            : 'Nothing in this category yet.'}
        </p>
      ) : (
        <section className="gallery-grid">
          {visible.map((item) => (
            <article key={item.id} className="gallery-card">
              {item.images.length > 0 ? (
                isVideoUrl(item.images[0]) ? (
                  <video
                    src={item.images[0]}
                    controls
                    playsInline
                    preload="metadata"
                    aria-label={item.title}
                    className="gallery-card-img"
                  />
                ) : (
                  <img
                    src={item.thumbnails?.[0] ?? item.images[0]}
                    srcSet={imageSrcSet(item.images[0], item.thumbnails?.[0])}
                    sizes="(max-width: 700px) 100vw, 320px"
                    alt={item.title}
                    loading="lazy"
                    className="gallery-card-img"
                  />
                )
              ) : (
                <div className="gallery-card-img gallery-card-placeholder" />
              )}
              <div className="gallery-card-body">
                <h2>{item.title}</h2>
                {item.categoryName && (
                  <span className="gallery-card-category">{item.categoryName}</span>
                )}
                {item.description && <p>{item.description}</p>}
              </div>
            </article>
          ))}
        </section>
      )}
    </>
  )
}