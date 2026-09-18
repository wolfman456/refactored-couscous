import { apiFetch } from './client'

export interface GalleryItem {
  id: number
  title: string
  description: string | null
  categoryId: number | null
  categoryName: string | null
  sortOrder: number
  published: boolean
  createdAt: string
  images: string[]
  thumbnails?: string[]
  mediaIds: number[]
}

export interface GalleryItemForm {
  title: string
  description: string
  categoryId: number | null
  sortOrder: number
  published: boolean
  mediaIds: number[]
}

export function fetchGallery(): Promise<GalleryItem[]> {
  return apiFetch<GalleryItem[]>('/api/gallery')
}

export function fetchGalleryItem(id: number): Promise<GalleryItem> {
  return apiFetch<GalleryItem>(`/api/gallery/${id}`)
}

export function fetchAdminGallery(): Promise<GalleryItem[]> {
  return apiFetch<GalleryItem[]>('/api/admin/gallery', { auth: true })
}

export function saveGalleryItem(
  id: number | null,
  form: GalleryItemForm,
  image?: File,
): Promise<GalleryItem> {
  const fd = new FormData()
  fd.append('item', new Blob([JSON.stringify(form)], { type: 'application/json' }), 'item.json')
  if (image) {
    fd.append('image', image)
  }
  const method = id === null ? 'POST' : 'PUT'
  return apiFetch<GalleryItem>(id === null ? '/api/admin/gallery' : `/api/admin/gallery/${id}`, {
    method,
    body: fd,
    auth: true,
  })
}

export function deleteGalleryItem(id: number): Promise<void> {
  return apiFetch<void>(`/api/admin/gallery/${id}`, { method: 'DELETE', auth: true })
}