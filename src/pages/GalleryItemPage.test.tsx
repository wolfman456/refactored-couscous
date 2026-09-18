import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import GalleryItemPage from './GalleryItemPage'
import { jsonResponse, mockFetch, restoreFetch, sampleGallery } from '../test/testUtils'

function renderAt(id: string | null) {
  return render(
    <MemoryRouter initialEntries={[`/gallery/${id ?? ''}`]}>
      <Routes>
        <Route path="/gallery/:id" element={<GalleryItemPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

const sampleItem = {
  ...sampleGallery[0],
  images: ['/uploads/a.jpg', '/uploads/b.jpg'],
  thumbnails: ['/uploads/a_thumb.jpg', '/uploads/b_thumb.jpg'],
}

describe('GalleryItemPage', () => {
  beforeEach(() => {
    restoreFetch()
  })

  it('renders every photo for a piece with thumbnails', async () => {
    mockFetch((url) => {
      expect(url).toBe('/api/gallery/1')
      return jsonResponse(sampleItem)
    })
    const { container } = renderAt('1')
    expect(screen.getByText('Loading piece…')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Oak shelf' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '← All pieces' })).toBeInTheDocument()
    expect(screen.getByText('A small oak shelf.')).toBeInTheDocument()
    expect(document.title).toBe('Oak shelf · Six Kids Crafts')
    const imgs = container.querySelectorAll('img.gallery-detail-media')
    expect(imgs).toHaveLength(2)
    expect(imgs[0].getAttribute('src')).toBe('/uploads/a_thumb.jpg')
    expect(imgs[0].getAttribute('srcset')).toBe('/uploads/a_thumb.jpg 480w, /uploads/a.jpg 2000w')
    expect(imgs[1].getAttribute('src')).toBe('/uploads/b_thumb.jpg')
  })

  it('falls back to the full image when no thumbnail exists', async () => {
    mockFetch(() => jsonResponse({ ...sampleItem, thumbnails: undefined }))
    const { container } = renderAt('1')
    await screen.findByRole('heading', { name: 'Oak shelf' })
    const imgs = container.querySelectorAll('img.gallery-detail-media')
    expect(imgs[0].getAttribute('src')).toBe('/uploads/a.jpg')
    expect(imgs[0].getAttribute('srcset')).toBeNull()
  })

  it('renders a video for video media', async () => {
    mockFetch(() => jsonResponse({ ...sampleItem, images: ['/uploads/clip.mp4'], thumbnails: [] }))
    const { container } = renderAt('1')
    await screen.findByRole('heading', { name: 'Oak shelf' })
    expect(container.querySelector('video.gallery-detail-media')?.getAttribute('src')).toBe(
      '/uploads/clip.mp4',
    )
    expect(container.querySelectorAll('img.gallery-detail-media')).toHaveLength(0)
  })

  it('hides the category and description when absent', async () => {
    mockFetch(() => jsonResponse({ ...sampleItem, categoryName: null, description: null }))
    const { container } = renderAt('1')
    await screen.findByRole('heading', { name: 'Oak shelf' })
    expect(container.querySelector('.gallery-detail-category')).toBeNull()
    expect(container.querySelector('.gallery-detail-description')).toBeNull()
  })

  it('notes when a piece has no photos', async () => {
    mockFetch(() => jsonResponse({ ...sampleItem, images: [], thumbnails: [] }))
    renderAt('1')
    expect(await screen.findByText('No photos for this piece yet.')).toBeInTheDocument()
  })

  it('shows not found when no id is provided', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="*" element={<GalleryItemPage />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(await screen.findByText('Piece not found.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '← All pieces' })).toBeInTheDocument()
  })

  it('shows the fetch error message', async () => {
    mockFetch(() => jsonResponse({}, 500))
    renderAt('1')
    expect(await screen.findByText('Request failed with status 500')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '← All pieces' })).toBeInTheDocument()
  })

  it('surfaces a generic message when loading fails with a non-Error', async () => {
    mockFetch(() => {
      throw 'boom'
    })
    renderAt('1')
    expect(await screen.findByText('Failed to load piece')).toBeInTheDocument()
  })
})
