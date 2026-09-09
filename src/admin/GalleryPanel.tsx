import { useCallback, useEffect, useState } from 'react'
import {
  deleteGalleryItem,
  fetchAdminGallery,
  saveGalleryItem,
  type GalleryItem,
} from '../api/gallery'
import { fetchAdminCategories, type Category } from '../api/categories'
import PhotoPicker from '../components/PhotoPicker'

interface DraftForm {
  title: string
  description: string
  categoryId: string
  sortOrder: string
  published: boolean
  mediaIds: number[]
}

const EMPTY_DRAFT: DraftForm = {
  title: '',
  description: '',
  categoryId: '',
  sortOrder: '0',
  published: false,
  mediaIds: [],
}

function emptyDraft(): DraftForm {
  return { ...EMPTY_DRAFT, mediaIds: [] }
}

function draftFrom(item: GalleryItem): DraftForm {
  return {
    title: item.title,
    description: item.description ?? '',
    categoryId: item.categoryId === null ? '' : String(item.categoryId),
    sortOrder: String(item.sortOrder),
    published: item.published,
    mediaIds: [...(item.mediaIds ?? [])],
  }
}

export default function GalleryPanel() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [draft, setDraft] = useState<DraftForm>(emptyDraft)
  const [extraImage, setExtraImage] = useState<File | undefined>()
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    Promise.all([fetchAdminGallery(), fetchAdminCategories()])
      .then(([galleryItems, tabs]) => {
        setError(null)
        setItems(galleryItems)
        setCategories(tabs)
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Failed to load gallery'),
      )
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const resetForm = () => {
    setEditingId(null)
    setDraft(emptyDraft())
    setExtraImage(undefined)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await saveGalleryItem(
        editingId,
        {
          title: draft.title,
          description: draft.description,
          categoryId: draft.categoryId === '' ? null : Number(draft.categoryId),
          sortOrder: Number(draft.sortOrder),
          published: draft.published,
          mediaIds: draft.mediaIds,
        },
        extraImage,
      )
      resetForm()
      await refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save piece')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    setError(null)
    try {
      await deleteGalleryItem(id)
      if (editingId === id) {
        resetForm()
      }
      await refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete piece')
    }
  }

  const setDraftField = (patch: Partial<DraftForm>) => {
    setDraft((prev) => ({ ...prev, ...patch }))
  }

  return (
    <section>
      <h2>Gallery pieces</h2>
      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <p className="picker-note">Loading gallery…</p>
      ) : items.length === 0 ? (
        <p className="picker-note">No pieces yet.</p>
      ) : (
        <ul className="admin-list">
          {items.map((item) => (
            <li key={item.id} className="admin-list-row">
              <span className="admin-list-label">
                {item.images.length > 0 && (
                  <img src={item.images[0]} alt="" className="admin-list-thumb" />
                )}
                {item.title}
                {!item.published && <span className="draft-badge">draft</span>}
              </span>
              <span className="admin-list-actions">
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(item.id)
                    setDraft(draftFrom(item))
                    setError(null)
                  }}
                >
                  Edit
                </button>
                <button type="button" onClick={() => void handleDelete(item.id)}>
                  Delete
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="admin-form">
        <h3>{editingId === null ? 'Add a piece' : `Edit piece #${editingId}`}</h3>
        <label>
          Title
          <input
            type="text"
            value={draft.title}
            required
            onChange={(e) => setDraftField({ title: e.target.value })}
          />
        </label>
        <label>
          Description
          <textarea
            value={draft.description}
            onChange={(e) => setDraftField({ description: e.target.value })}
          />
        </label>
        <label>
          Category
          <select
            value={draft.categoryId}
            onChange={(e) => setDraftField({ categoryId: e.target.value })}
          >
            <option value="">None</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Sort order
          <input
            type="number"
            step="1"
            value={draft.sortOrder}
            onChange={(e) => setDraftField({ sortOrder: e.target.value })}
          />
        </label>
        <label className="admin-checkbox">
          <input
            type="checkbox"
            checked={draft.published}
            onChange={(e) => setDraftField({ published: e.target.checked })}
          />
          Published
        </label>
        <p className="panel-hint">Photos for this piece:</p>
        <PhotoPicker
          selectedIds={draft.mediaIds}
          onToggle={(id) =>
            setDraftField({
              mediaIds: draft.mediaIds.includes(id)
                ? draft.mediaIds.filter((x) => x !== id)
                : [...draft.mediaIds, id],
            })
          }
        />
        <label>
          Upload a cover photo
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setExtraImage(e.target.files?.[0])}
          />
        </label>
        <div className="admin-form-actions">
          <button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save piece'}
          </button>
          {editingId !== null && (
            <button type="button" onClick={resetForm}>
              Cancel edit
            </button>
          )}
        </div>
      </form>
    </section>
  )
}