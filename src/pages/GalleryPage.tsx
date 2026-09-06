import { useEffect, useState } from 'react'
import { fetchGallery, type GalleryItem } from '../api/gallery'
import { fetchCategories, type Category } from '../api/categories'

type ActiveTab = 'all' | number

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeTab, setActiveTab] = useState<ActiveTab>('all')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchGallery(), fetchCategories()])
      .then(([galleryItems, tabs]) => {
        setItems(galleryItems)
        setCategories(tabs)
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Failed to load gallery'),
      )
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <p className="gallery-note">Loading gallery…</p>
  }

  if (error) {
    return <p className="gallery-note gallery-error">{error}</p>
  }

  const visible =
    activeTab === 'all'
      ? items
      : items.filter((item) => item.categoryId === activeTab)

  return (
    <>
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