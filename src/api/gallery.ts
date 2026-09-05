export interface GalleryItem {
  id: number
  title: string
  description: string | null
  category: string | null
  sortOrder: number
  published: boolean
  createdAt: string
  images: string[]
}

export async function fetchGallery(): Promise<GalleryItem[]> {
  const res = await fetch('/api/gallery')
  if (!res.ok) {
    throw new Error(`Gallery request failed: ${res.status}`)
  }
  return res.json()
}