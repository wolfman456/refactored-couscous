import { apiFetch } from './client'

export interface MediaAsset {
  id: number
  assetType: 'IMAGE' | 'VIDEO'
  url: string
  contentType: string | null
  sizeBytes: number | null
  uploadedAt: string
}

export function fetchMedia(): Promise<MediaAsset[]> {
  return apiFetch<MediaAsset[]>('/api/admin/media', { auth: true })
}

export function uploadMedia(file: File): Promise<MediaAsset> {
  const fd = new FormData()
  fd.append('file', file)
  return apiFetch<MediaAsset>('/api/admin/media', { method: 'POST', body: fd, auth: true })
}

export function deleteMedia(id: number): Promise<void> {
  return apiFetch<void>(`/api/admin/media/${id}`, { method: 'DELETE', auth: true })
}