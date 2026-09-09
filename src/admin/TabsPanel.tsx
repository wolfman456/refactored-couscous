import { useCallback, useEffect, useState } from 'react'
import {
  deleteCategory,
  fetchAdminCategories,
  saveCategory,
  type Category,
} from '../api/categories'

export default function TabsPanel() {
  const [categories, setCategories] = useState<Category[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [sortOrder, setSortOrder] = useState('0')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    fetchAdminCategories()
      .then((categories) => {
        setError(null)
        setCategories(categories)
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Failed to load categories'),
      )
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const resetForm = () => {
    setEditingId(null)
    setName('')
    setSortOrder('0')
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await saveCategory(editingId, name, Number(sortOrder))
      resetForm()
      await refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save category')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    setError(null)
    try {
      await deleteCategory(id)
      if (editingId === id) {
        resetForm()
      }
      await refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete category')
    }
  }

  return (
    <section>
      <h2>Gallery tabs</h2>
      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <p className="picker-note">Loading categories…</p>
      ) : categories.length === 0 ? (
        <p className="picker-note">No categories yet.</p>
      ) : (
        <ul className="admin-list">
          {categories.map((category) => (
            <li key={category.id} className="admin-list-row">
              <span className="admin-list-label">
                {category.name} (order {category.sortOrder})
              </span>
              <span className="admin-list-actions">
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(category.id)
                    setName(category.name)
                    setSortOrder(String(category.sortOrder))
                    setError(null)
                  }}
                >
                  Edit
                </button>
                <button type="button" onClick={() => void handleDelete(category.id)}>
                  Delete
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="admin-form">
        <h3>{editingId === null ? 'Add a tab' : `Edit tab #${editingId}`}</h3>
        <label>
          Name
          <input
            type="text"
            value={name}
            required
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          Order
          <input
            type="number"
            step="1"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
        </label>
        <div className="admin-form-actions">
          <button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save tab'}
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