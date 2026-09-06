import { apiFetch } from './client'

export interface Category {
  id: number
  name: string
  sortOrder: number
}

export function fetchCategories(): Promise<Category[]> {
  return apiFetch<Category[]>('/api/categories')
}

export function fetchAdminCategories(): Promise<Category[]> {
  return apiFetch<Category[]>('/api/admin/categories', { auth: true })
}

export function saveCategory(id: number | null, name: string, sortOrder: number): Promise<Category> {
  const body = JSON.stringify({ name, sortOrder })
  const method = id === null ? 'POST' : 'PUT'
  return apiFetch<Category>(id === null ? '/api/admin/categories' : `/api/admin/categories/${id}`, {
    method,
    body,
    auth: true,
  })
}

export function deleteCategory(id: number): Promise<void> {
  return apiFetch<void>(`/api/admin/categories/${id}`, { method: 'DELETE', auth: true })
}