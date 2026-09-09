import { useCallback, useEffect, useState } from 'react'
import {
  deleteArticle,
  fetchAdminArticles,
  saveArticle,
  type Article,
} from '../api/articles'
import PhotoPicker from '../components/PhotoPicker'

interface DraftForm {
  title: string
  slug: string
  bodyMd: string
  published: boolean
  featuredMediaId: number | null
  mediaIds: number[]
}

function emptyDraft(): DraftForm {
  return {
    title: '',
    slug: '',
    bodyMd: '',
    published: false,
    featuredMediaId: null,
    mediaIds: [],
  }
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function ArticlesPanel() {
  const [articles, setArticles] = useState<Article[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [draft, setDraft] = useState<DraftForm>(emptyDraft)
  const [slugTouched, setSlugTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    fetchAdminArticles()
      .then((articles) => {
        setError(null)
        setArticles(articles)
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Failed to load articles'),
      )
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const resetForm = () => {
    setEditingId(null)
    setDraft(emptyDraft())
    setSlugTouched(false)
  }

  const toggleMedia = (id: number) => {
    const next = draft.mediaIds.includes(id)
      ? draft.mediaIds.filter((x) => x !== id)
      : [...draft.mediaIds, id]
    const featuredStillValid = draft.featuredMediaId === null || next.includes(draft.featuredMediaId)
    setDraft((prev) => ({
      ...prev,
      mediaIds: next,
      featuredMediaId: featuredStillValid ? prev.featuredMediaId : null,
    }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await saveArticle(editingId, {
        title: draft.title,
        slug: draft.slug,
        bodyMd: draft.bodyMd,
        published: draft.published,
        featuredMediaId: draft.featuredMediaId,
        mediaIds: draft.mediaIds,
      })
      resetForm()
      await refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save article')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    setError(null)
    try {
      await deleteArticle(id)
      if (editingId === id) {
        resetForm()
      }
      await refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete article')
    }
  }

  const startEdit = (article: Article) => {
    setEditingId(article.id)
    setDraft({
      title: article.title,
      slug: article.slug,
      bodyMd: article.bodyMd,
      published: article.published,
      featuredMediaId: article.featuredMediaId,
      mediaIds: [...(article.mediaIds ?? [])],
    })
    setSlugTouched(true)
    setError(null)
  }

  return (
    <section>
      <h2>Articles</h2>
      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <p className="picker-note">Loading articles…</p>
      ) : articles.length === 0 ? (
        <p className="picker-note">No articles yet.</p>
      ) : (
        <ul className="admin-list">
          {articles.map((article) => (
            <li key={article.id} className="admin-list-row">
              <span className="admin-list-label">
                {article.title} ({article.slug})
                {!article.published && <span className="draft-badge">draft</span>}
              </span>
              <span className="admin-list-actions">
                <button type="button" onClick={() => startEdit(article)}>
                  Edit
                </button>
                <button type="button" onClick={() => void handleDelete(article.id)}>
                  Delete
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="admin-form">
        <h3>{editingId === null ? 'Write an article' : `Edit article #${editingId}`}</h3>
        <label>
          Title
          <input
            type="text"
            value={draft.title}
            onChange={(e) => {
              const title = e.target.value
              setDraft((prev) => ({
                ...prev,
                title,
                slug: slugTouched ? prev.slug : slugify(title),
              }))
            }}
          />
        </label>
        <label>
          Slug
          <input
            type="text"
            value={draft.slug}
            required
            onChange={(e) => {
              setSlugTouched(true)
              setDraft((prev) => ({ ...prev, slug: e.target.value }))
            }}
          />
        </label>
        <label>
          Body (markdown)
          <textarea
            value={draft.bodyMd}
            rows={10}
            onChange={(e) => setDraft((prev) => ({ ...prev, bodyMd: e.target.value }))}
          />
        </label>
        <label className="admin-checkbox">
          <input
            type="checkbox"
            checked={draft.published}
            onChange={(e) => setDraft((prev) => ({ ...prev, published: e.target.checked }))}
          />
          Published
        </label>
        <p className="panel-hint">
          Photos for this article — pick one cover image from the selection below:
        </p>
        <PhotoPicker
          selectedIds={draft.mediaIds}
          onToggle={toggleMedia}
        />
        {draft.mediaIds.length > 0 && (
          <label>
            Cover image
            <select
              value={draft.featuredMediaId ?? ''}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  featuredMediaId: e.target.value === '' ? null : Number(e.target.value),
                }))
              }
            >
              <option value="">None</option>
              {draft.mediaIds.map((id) => (
                <option key={id} value={id}>
                  Photo #{id}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="admin-form-actions">
          <button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save article'}
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