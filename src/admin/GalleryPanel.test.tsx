import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import GalleryPanel from './GalleryPanel'
import {
  jsonResponse,
  mockFetch,
  noContent,
  restoreFetch,
  sampleCategories,
  sampleGallery,
  sampleMedia,
} from '../test/testUtils'

describe('GalleryPanel', () => {
  beforeEach(() => {
    restoreFetch()
    sessionStorage.setItem('adminAuth', 'YWRtaW46cHc=')
  })

  const listMock = () =>
    mockFetch((url) => {
      if (url === '/api/admin/categories') {
        return jsonResponse(sampleCategories)
      }
      if (url === '/api/admin/gallery') {
        return jsonResponse(sampleGallery)
      }
      return jsonResponse({}, 404)
    })

  it('loads the pieces and categories into a list', async () => {
    listMock()
    render(<GalleryPanel />)
    expect(await screen.findByText('Oak shelf')).toBeInTheDocument()
    expect(screen.getByText('draft')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Add a piece' })).toBeInTheDocument()
  })

  it('shows the empty state', async () => {
    mockFetch((url) => {
      if (url === '/api/admin/categories') {
        return jsonResponse([])
      }
      return jsonResponse([])
    })
    render(<GalleryPanel />)
    expect(await screen.findByText('No pieces yet.')).toBeInTheDocument()
  })

  it('creates a new piece', async () => {
    const fn = mockFetch((url, init) => {
      if (url === '/api/admin/categories') {
        return jsonResponse(sampleCategories)
      }
      if (url === '/api/admin/gallery' && init?.method === 'POST') {
        expect(init?.body).toBeInstanceOf(FormData)
        return jsonResponse({ id: 3, title: 'New shelf', images: [], mediaIds: [] })
      }
      if (url === '/api/admin/gallery') {
        return jsonResponse([...sampleGallery, { id: 3, title: 'New shelf', categoryId: 1, categoryName: 'Shelves', sortOrder: 3, published: false, createdAt: '2026-01-01T00:00:00Z', images: [], mediaIds: [] }])
      }
      return jsonResponse({}, 404)
    })
    render(<GalleryPanel />)
    await screen.findByText('Oak shelf')
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'New shelf' } })
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'A new shelf.' } })
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: '1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save piece' }))
    expect(await screen.findByText('New shelf')).toBeInTheDocument()
    expect(fn).toHaveBeenCalledWith(
      '/api/admin/gallery',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('edits an existing piece', async () => {
    const fn = mockFetch((url, init) => {
      if (url === '/api/admin/categories') {
        return jsonResponse(sampleCategories)
      }
      if (url === '/api/admin/gallery/1' && init?.method === 'PUT') {
        return jsonResponse({ id: 1, title: 'Oak shelf (edited)' })
      }
      if (url === '/api/admin/gallery') {
        return jsonResponse([{ ...sampleGallery[0], title: 'Oak shelf (edited)' }])
      }
      return jsonResponse({}, 404)
    })
    render(<GalleryPanel />)
    await screen.findByText(/Oak shelf/)
    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0])
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Oak shelf (edited)' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save piece' }))
    expect(await screen.findByText(/Oak shelf \(edited\)/)).toBeInTheDocument()
    expect(fn).toHaveBeenCalledWith(
      '/api/admin/gallery/1',
      expect.objectContaining({ method: 'PUT' }),
    )
  })

  it('deletes a piece', async () => {
    let deleted = false
    const fn = mockFetch((url, init) => {
      if (url === '/api/admin/categories') {
        return jsonResponse(sampleCategories)
      }
      if (url === '/api/admin/gallery/1' && init?.method === 'DELETE') {
        deleted = true
        return noContent()
      }
      if (url === '/api/admin/gallery') {
        return jsonResponse(deleted ? sampleGallery.slice(1) : sampleGallery)
      }
      return jsonResponse({}, 404)
    })
    render(<GalleryPanel />)
    await screen.findByText('Oak shelf')
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0])
    await waitFor(() =>
      expect(fn).toHaveBeenCalledWith(
        '/api/admin/gallery/1',
        expect.objectContaining({ method: 'DELETE' }),
      ),
    )
    expect(await screen.findByText('Walnut box')).toBeInTheDocument()
    expect(screen.queryByText('Oak shelf')).not.toBeInTheDocument()
  })

  it('surfaces delete failures', async () => {
    mockFetch((url, init) => {
      if (url === '/api/admin/categories') {
        return jsonResponse(sampleCategories)
      }
      if (url === '/api/admin/gallery/1' && init?.method === 'DELETE') {
        return jsonResponse({}, 409)
      }
      if (url === '/api/admin/gallery') {
        return jsonResponse(sampleGallery)
      }
      return jsonResponse({}, 404)
    })
    render(<GalleryPanel />)
    await screen.findByText('Oak shelf')
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0])
    expect(await screen.findByText('Request failed with status 409')).toBeInTheDocument()
  })

  it('shows a load failure message', async () => {
    mockFetch(() => jsonResponse({}, 500))
    render(<GalleryPanel />)
    const messages = await screen.findAllByText('Request failed with status 500')
    expect(messages.length).toBeGreaterThan(0)
  })

  it('edits a piece with selected photos and a cover upload', async () => {
    let putForm: { mediaIds: number[]; sortOrder: number; published: boolean } | null = null
    let putImage: File | null = null
    const fn = mockFetch(async (url, init) => {
      if (url === '/api/admin/categories') {
        return jsonResponse(sampleCategories)
      }
      if (url === '/api/admin/media') {
        return jsonResponse(sampleMedia)
      }
      if (url === '/api/admin/gallery/2' && init?.method === 'PUT') {
        const fd = init?.body as FormData
        putForm = JSON.parse(await (fd.get('item') as Blob).text()) as {
          mediaIds: number[]
          sortOrder: number
          published: boolean
        }
        putImage = (fd.get('image') as File) ?? null
        return jsonResponse({ id: 2, title: 'Walnut box' })
      }
      if (url === '/api/admin/gallery') {
        return jsonResponse(sampleGallery)
      }
      return jsonResponse({}, 404)
    })
    render(<GalleryPanel />)
    await screen.findByText('Walnut box')
    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[1])
    await screen.findByAltText('Library photo 11')
    fireEvent.click(screen.getByAltText('Library photo 11'))
    fireEvent.click(screen.getByAltText('Library photo 12'))
    expect(screen.getByText('2 selected')).toBeInTheDocument()
    fireEvent.click(screen.getByAltText('Library photo 11'))
    expect(screen.getByText('1 selected')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Sort order'), { target: { value: '7' } })
    fireEvent.click(screen.getByLabelText('Published'))
    const cover = screen.getByLabelText('Upload a cover photo')
    fireEvent.change(cover, { target: { files: [new File(['x'], 'cover.png')] } })
    fireEvent.click(screen.getByRole('button', { name: 'Save piece' }))
    await waitFor(() =>
      expect(fn).toHaveBeenCalledWith(
        '/api/admin/gallery/2',
        expect.objectContaining({ method: 'PUT' }),
      ),
    )
    expect(putForm!.mediaIds).toEqual([12])
    expect(putForm!.sortOrder).toBe(7)
    expect(putForm!.published).toBe(true)
    expect(putImage!.name).toBe('cover.png')
  })

  it('cancels an edit and resets the form', async () => {
    mockFetch((url) => {
      if (url === '/api/admin/categories') {
        return jsonResponse(sampleCategories)
      }
      if (url === '/api/admin/gallery') {
        return jsonResponse(sampleGallery)
      }
      return jsonResponse([])
    })
    render(<GalleryPanel />)
    await screen.findByText('Oak shelf')
    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0])
    expect(screen.getByRole('heading', { name: /Edit piece/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel edit' }))
    expect(screen.getByRole('heading', { name: 'Add a piece' })).toBeInTheDocument()
  })

  it('deleting the piece that is being edited resets the form', async () => {
    let deleted = false
    mockFetch((url, init) => {
      if (url === '/api/admin/categories') {
        return jsonResponse(sampleCategories)
      }
      if (url === '/api/admin/gallery/1' && init?.method === 'DELETE') {
        deleted = true
        return noContent()
      }
      if (url === '/api/admin/gallery') {
        return jsonResponse(deleted ? sampleGallery.slice(1) : sampleGallery)
      }
      return jsonResponse([])
    })
    render(<GalleryPanel />)
    await screen.findByText('Oak shelf')
    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0])
    expect(screen.getByRole('heading', { name: /Edit piece/ })).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0])
    expect(await screen.findByRole('heading', { name: 'Add a piece' })).toBeInTheDocument()
    expect(await screen.findByText('Walnut box')).toBeInTheDocument()
  })

  it('shows a save failure message', async () => {
    mockFetch((url, init) => {
      if (url === '/api/admin/categories') {
        return jsonResponse(sampleCategories)
      }
      if (url === '/api/admin/gallery' && init?.method === 'POST') {
        return jsonResponse({}, 500)
      }
      if (url === '/api/admin/gallery') {
        return jsonResponse(sampleGallery)
      }
      return jsonResponse([])
    })
    render(<GalleryPanel />)
    await screen.findByText('Oak shelf')
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Fails' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save piece' }))
    expect(await screen.findByText('Request failed with status 500')).toBeInTheDocument()
  })

  it('edits a piece without a category, description, or media list', async () => {
    mockFetch((url) => {
      if (url === '/api/admin/categories') {
        return jsonResponse(sampleCategories)
      }
      if (url === '/api/admin/gallery') {
        return jsonResponse([{ id: 9, title: 'No cat', description: null, categoryId: null, categoryName: null, sortOrder: 5, published: true, createdAt: '2026-01-01T00:00:00Z', images: [] }])
      }
      if (url === '/api/admin/media') {
        return jsonResponse(sampleMedia)
      }
      return jsonResponse({}, 404)
    })
    render(<GalleryPanel />)
    await screen.findByText('No cat')
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    expect((screen.getByLabelText('Category') as HTMLSelectElement).value).toBe('')
    expect((screen.getByLabelText('Sort order') as HTMLInputElement).value).toBe('5')
    expect(await screen.findByText('0 selected')).toBeInTheDocument()
  })

   it('surfaces generic messages when calls fail with non-Error rejections', async () => {
     mockFetch((url, init) => {
       if (url === '/api/admin/categories') {
         return jsonResponse(sampleCategories)
       }
       if (url === '/api/admin/gallery' && init?.method === 'POST') {
         throw 'boom'
       }
       if (url === '/api/admin/gallery/1' && init?.method === 'DELETE') {
         throw 'boom'
       }
       if (url === '/api/admin/gallery') {
         return jsonResponse(sampleGallery)
       }
       return jsonResponse({}, 404)
     })
     render(<GalleryPanel />)
     await screen.findByText('Oak shelf')
     fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Fails' } })
     fireEvent.click(screen.getByRole('button', { name: 'Save piece' }))
     expect(await screen.findByText('Failed to save piece')).toBeInTheDocument()
     fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0])
     expect(await screen.findByText('Failed to delete piece')).toBeInTheDocument()
   })

   it('surfaces a load failure with a non-Error', async () => {
     mockFetch(() => {
       throw 'load boom'
     })
     render(<GalleryPanel />)
     expect(await screen.findByText('Failed to load gallery')).toBeInTheDocument()
   })

  it('drafts a description from a selected library photo', async () => {
    const fn = mockFetch(async (url, init) => {
      if (url === '/api/admin/categories') {
        return jsonResponse(sampleCategories)
      }
      if (url === '/api/admin/gallery') {
        return jsonResponse(sampleGallery)
      }
      if (url === '/api/admin/media') {
        return jsonResponse(sampleMedia)
      }
      if (url === '/uploads/a.jpg') {
        return { ok: true, status: 200, blob: () => Promise.resolve(new Blob(['img'])) } as Response
      }
      if (url === '/api/admin/ai/describe-image' && init?.method === 'POST') {
        expect(init?.body).toBeInstanceOf(FormData)
        return jsonResponse({ description: 'A hand-built oak shelf.' })
      }
      return jsonResponse({}, 404)
    })
    render(<GalleryPanel />)
    await screen.findByText('Oak shelf')
    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0])
    fireEvent.click(screen.getByRole('button', { name: 'Draft description from photo' }))
    await waitFor(() =>
      expect(screen.getByLabelText('Description')).toHaveValue('A hand-built oak shelf.'),
    )
    expect(fn).toHaveBeenCalledWith(
      '/api/admin/ai/describe-image',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('drafts a description from a freshly uploaded cover photo', async () => {
    const fn = mockFetch((url, init) => {
      if (url === '/api/admin/categories') {
        return jsonResponse(sampleCategories)
      }
      if (url === '/api/admin/gallery') {
        return jsonResponse(sampleGallery)
      }
      if (url === '/api/admin/ai/describe-image' && init?.method === 'POST') {
        expect(init?.body).toBeInstanceOf(FormData)
        return jsonResponse({ description: 'From the cover.' })
      }
      return jsonResponse({}, 404)
    })
    render(<GalleryPanel />)
    await screen.findByText('Oak shelf')
    fireEvent.change(screen.getByLabelText('Upload a cover photo'), {
      target: { files: [new File(['x'], 'cover.png')] },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Draft description from photo' }))
    await waitFor(() => expect(screen.getByLabelText('Description')).toHaveValue('From the cover.'))
    expect(fn).toHaveBeenCalledWith(
      '/api/admin/ai/describe-image',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('shows a message when no library photo is available', async () => {
    mockFetch((url) => {
      if (url === '/api/admin/categories') {
        return jsonResponse(sampleCategories)
      }
      if (url === '/api/admin/gallery') {
        return jsonResponse(sampleGallery)
      }
      if (url === '/api/admin/media') {
        return jsonResponse([])
      }
      return jsonResponse({}, 404)
    })
    render(<GalleryPanel />)
    await screen.findByText('Oak shelf')
    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0])
    fireEvent.click(screen.getByRole('button', { name: 'Draft description from photo' }))
    expect(await screen.findByText('Pick a photo first')).toBeInTheDocument()
  })

  it('shows a failure message when the description draft fails', async () => {
    mockFetch((url) => {
      if (url === '/api/admin/categories') {
        return jsonResponse(sampleCategories)
      }
      if (url === '/api/admin/gallery') {
        return jsonResponse(sampleGallery)
      }
      if (url === '/api/admin/media') {
        return jsonResponse(sampleMedia)
      }
      if (url === '/uploads/a.jpg') {
        return { ok: true, status: 200, blob: () => Promise.resolve(new Blob(['x'])) } as Response
      }
      if (url === '/api/admin/ai/describe-image') {
        return jsonResponse({}, 500)
      }
      return jsonResponse({}, 404)
    })
    render(<GalleryPanel />)
    await screen.findByText('Oak shelf')
    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0])
    fireEvent.click(screen.getByRole('button', { name: 'Draft description from photo' }))
    expect(await screen.findByText('Request failed with status 500')).toBeInTheDocument()
  })
})