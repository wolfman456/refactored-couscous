import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import GalleryPage from './GalleryPage'
import { jsonResponse, mockFetch, restoreFetch, sampleCategories, sampleGallery } from '../test/testUtils'

describe('GalleryPage', () => {
  beforeEach(() => {
    restoreFetch()
  })

  it('renders the default All tab with every piece', async () => {
    mockFetch((url) => {
      if (url === '/api/categories') {
        return jsonResponse(sampleCategories)
      }
      return jsonResponse(sampleGallery)
    })
    render(<GalleryPage />)
    expect(screen.getByText('Loading gallery…')).toBeInTheDocument()
    expect(await screen.findByText('Oak shelf')).toBeInTheDocument()
    expect(screen.getByText('Walnut box')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Shelves' })).toBeInTheDocument()
  })

  it('filters by the active category tab', async () => {
    mockFetch((url) => {
      if (url === '/api/categories') {
        return jsonResponse(sampleCategories)
      }
      return jsonResponse(sampleGallery)
    })
    render(<GalleryPage />)
    await screen.findByText('Oak shelf')
    fireEvent.click(screen.getByRole('button', { name: 'Shelves' }))
    expect(screen.getByText('Oak shelf')).toBeInTheDocument()
    expect(screen.queryByText('Walnut box')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'All' }))
    expect(screen.getByText('Walnut box')).toBeInTheDocument()
  })

  it('shows a fallback when the gallery is empty', async () => {
    mockFetch((url) => {
      if (url === '/api/categories') {
        return jsonResponse([])
      }
      return jsonResponse([])
    })
    render(<GalleryPage />)
    expect(await screen.findByText('No pieces posted yet — check back soon.')).toBeInTheDocument()
  })

  it('shows the fetch error message', async () => {
    mockFetch(() => jsonResponse({}, 500))
    render(<GalleryPage />)
    expect(await screen.findByText('Request failed with status 500')).toBeInTheDocument()
  })

  it('shows a note when the active category has no pieces', async () => {
    mockFetch((url) => {
      if (url === '/api/categories') {
        return jsonResponse([...sampleCategories, { id: 9, name: 'Empty tab', sortOrder: 9 }])
      }
      return jsonResponse(sampleGallery)
    })
    render(<GalleryPage />)
    await screen.findByText('Oak shelf')
    fireEvent.click(screen.getByRole('button', { name: 'Empty tab' }))
    expect(screen.getByText('Nothing in this category yet.')).toBeInTheDocument()
  })

  it('surfaces a load failure with a non-Error', async () => {
    mockFetch(() => {
      throw 'boom'
    })
    render(<GalleryPage />)
    expect(await screen.findByText('Failed to load gallery')).toBeInTheDocument()
  })

  it('prefers the thumbnail for grid cards and falls back to the full image', async () => {
    mockFetch((url) => {
      if (url === '/api/categories') {
        return jsonResponse(sampleCategories)
      }
      return jsonResponse([
        { ...sampleGallery[0], thumbnails: ['/uploads/a_thumb.jpg'] },
        { ...sampleGallery[1], images: ['/uploads/b.jpg'], thumbnails: [] },
      ])
    })
    const { container } = render(<GalleryPage />)
    await screen.findByText('Oak shelf')
    const imgs = container.querySelectorAll('img.gallery-card-img')
    expect(imgs[0].getAttribute('src')).toBe('/uploads/a_thumb.jpg')
    expect(imgs[0].getAttribute('srcset')).toBe('/uploads/a_thumb.jpg 480w, /uploads/a.jpg 2000w')
    expect(imgs[1].getAttribute('src')).toBe('/uploads/b.jpg')
    expect(imgs[1].getAttribute('srcset')).toBeNull()
  })
})