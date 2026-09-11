import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import ArticlesPanel from './ArticlesPanel'
import {
  jsonResponse,
  mockFetch,
  noContent,
  restoreFetch,
  rowText,
  sampleArticles,
  sampleMedia,
} from '../test/testUtils'

describe('ArticlesPanel', () => {
  beforeEach(() => {
    restoreFetch()
    sessionStorage.setItem('adminAuth', 'YWRtaW46cHc=')
  })

  it('loads the article list', async () => {
    mockFetch((url) => {
      if (url === '/api/admin/articles') {
        return jsonResponse(sampleArticles)
      }
      return jsonResponse({}, 404)
    })
    render(<ArticlesPanel />)
    expect(
      await screen.findByText(rowText('First post (first-post)')),
    ).toBeInTheDocument()
     expect(screen.getByRole('heading', { name: 'Write an article' })).toBeInTheDocument()
  })

  it('clears featured media id when deselecting the featured photo', async () => {
    const articleWithFeatured = { ...sampleArticles[0], featuredMediaId: 11, mediaIds: [11, 12] }
    const fn = mockFetch((url, init) => {
      if (url === '/api/admin/articles') {
        return jsonResponse([articleWithFeatured])
      }
      if (url === '/api/admin/media') {
        return jsonResponse(sampleMedia)
      }
      if (url === '/api/admin/articles/1' && init?.method === 'PUT') {
        const body = JSON.parse(init?.body as string) as { featuredMediaId: number | null }
        expect(body.featuredMediaId).toBeNull()
        return jsonResponse({ id: 1, title: 'First post' })
      }
      return jsonResponse({}, 404)
    })
    render(<ArticlesPanel />)
    await screen.findByText(rowText('First post (first-post)'))
    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0])
    await screen.findByAltText('Library photo 11')
    // Deselect the featured photo (11) by toggling it off
    fireEvent.click(screen.getByAltText('Library photo 11'))
    expect(screen.getByText('1 selected')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Save article' }))
    await waitFor(() => expect(fn).toHaveBeenCalledWith('/api/admin/articles/1', expect.objectContaining({ method: 'PUT' })))
  })

  it('shows a load failure with a non-Error', async () => {
    mockFetch(() => {
      throw 'boom'
    })
    render(<ArticlesPanel />)
    await screen.findByText('Failed to load articles')
  })

  it('shows the empty state', async () => {
    mockFetch(() => jsonResponse([]))
    render(<ArticlesPanel />)
    expect(await screen.findByText('No articles yet.')).toBeInTheDocument()
  })

  it('creates a draft article with an auto-generated slug', async () => {
    let created = false
    const fn = mockFetch((url, init) => {
      if (url === '/api/admin/articles' && init?.method === 'POST') {
        const body = JSON.parse(init?.body as string) as Record<string, unknown>
        expect(body.title).toBe('Hello World')
        expect(body.slug).toBe('hello-world')
        expect(body.published).toBe(false)
        created = true
        return jsonResponse({ id: 2, title: 'Hello World', slug: 'hello-world' })
      }
      if (url === '/api/admin/articles') {
        return jsonResponse(
          created
            ? [{ id: 2, title: 'Hello World', slug: 'hello-world', published: false, mediaIds: [], images: [], featuredMediaId: null }]
            : [],
        )
      }
      return jsonResponse({}, 404)
    })
    render(<ArticlesPanel />)
    expect(await screen.findByText('No articles yet.')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Hello World' } })
    expect(screen.getByLabelText('Slug')).toHaveValue('hello-world')
    fireEvent.change(screen.getByLabelText('Body (markdown)'), { target: { value: '# Intro' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save article' }))
    expect(
      await screen.findByText(rowText('Hello World (hello-world)')),
    ).toBeInTheDocument()
    expect(fn).toHaveBeenCalledWith(
      '/api/admin/articles',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('selects a cover photo from the picker and saves it', async () => {
    const fn = mockFetch((url, init) => {
      if (url === '/api/admin/articles' && init?.method === 'POST') {
        const body = JSON.parse(init?.body as string) as Record<string, unknown>
        expect(body.mediaIds).toEqual([11])
        expect(body.featuredMediaId).toBe(11)
        return jsonResponse({ id: 2, title: 'Covered', slug: 'covered' })
      }
      if (url === '/api/admin/media') {
        return jsonResponse(sampleMedia)
      }
      if (url === '/api/admin/articles') {
        return jsonResponse([])
      }
      return jsonResponse({}, 404)
    })
    render(<ArticlesPanel />)
    await screen.findByText('No articles yet.')
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Covered' } })
    await screen.findByAltText('Library photo 11')
    fireEvent.click(screen.getByAltText('Library photo 11'))
    const cover = await screen.findByLabelText('Cover image')
    expect(cover).toBeInTheDocument()
    fireEvent.change(cover, { target: { value: '11' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save article' }))
    await waitFor(() =>
      expect(fn).toHaveBeenCalledWith(
        '/api/admin/articles',
        expect.objectContaining({ method: 'POST' }),
      ),
     )
   })

   it('deselects a featured photo and clears the featured media id', async () => {
     const fn = mockFetch((url, init) => {
       if (url === '/api/admin/articles/1' && init?.method === 'PUT') {
         const body = JSON.parse(init?.body as string) as {
           mediaIds: number[]
           featuredMediaId: number | null
         }
         expect(body.featuredMediaId).toBeNull()
         return jsonResponse({ id: 1, title: 'First post' })
       }
       if (url === '/api/admin/media') {
         return jsonResponse(sampleMedia)
       }
       if (url === '/api/admin/articles') {
         return jsonResponse(sampleArticles)
       }
       return jsonResponse({}, 404)
     })
     render(<ArticlesPanel />)
     await screen.findByText(rowText('First post (first-post)'))
     fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0])
     await screen.findByAltText('Library photo 11')
     fireEvent.click(screen.getByAltText('Library photo 11'))
     const cover = await screen.findByLabelText('Cover image')
     fireEvent.change(cover, { target: { value: '' } })
     fireEvent.click(screen.getByRole('button', { name: 'Save article' }))
     await waitFor(() =>
       expect(fn).toHaveBeenCalledWith(
         '/api/admin/articles/1',
         expect.objectContaining({ method: 'PUT' }),
       ),
     )
   })

   it('edits an existing article', async () => {
    let edited = false
    const fn = mockFetch((url, init) => {
      if (url === '/api/admin/articles/1' && init?.method === 'PUT') {
        const body = JSON.parse(init?.body as string) as Record<string, unknown>
        expect(body.title).toBe('First post (edited)')
        edited = true
        return jsonResponse({ id: 1, title: 'First post (edited)', slug: 'first-post' })
      }
      if (url === '/api/admin/articles') {
        return jsonResponse(edited ? [{ ...sampleArticles[0], title: 'First post (edited)' }] : sampleArticles)
      }
      return jsonResponse({}, 404)
    })
    render(<ArticlesPanel />)
    await screen.findByText(rowText('First post (first-post)'))
    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0])
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'First post (edited)' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save article' }))
    expect(
      await screen.findByText(rowText('First post (edited) (first-post)')),
    ).toBeInTheDocument()
    expect(fn).toHaveBeenCalledWith(
      '/api/admin/articles/1',
      expect.objectContaining({ method: 'PUT' }),
    )
  })

  it('deletes an article', async () => {
    let deleted = false
    const fn = mockFetch((url, init) => {
      if (url === '/api/admin/articles/1' && init?.method === 'DELETE') {
        deleted = true
        return noContent()
      }
      if (url === '/api/admin/articles') {
        return jsonResponse(deleted ? [] : sampleArticles)
      }
      return jsonResponse({}, 404)
    })
    render(<ArticlesPanel />)
    await screen.findByText(rowText('First post (first-post)'))
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0])
    await waitFor(() =>
      expect(fn).toHaveBeenCalledWith(
        '/api/admin/articles/1',
        expect.objectContaining({ method: 'DELETE' }),
      ),
    )
    expect(await screen.findByText('No articles yet.')).toBeInTheDocument()
  })

  it('shows a load failure message', async () => {
    mockFetch(() => jsonResponse({}, 500))
    render(<ArticlesPanel />)
    const messages = await screen.findAllByText('Request failed with status 500')
    expect(messages.length).toBeGreaterThan(0)
  })

  it('keeps an auto slug until the slug field is typed and publishes on submit', async () => {
    let created = false
    const fn = mockFetch((url, init) => {
      if (url === '/api/admin/articles' && init?.method === 'POST') {
        const body = JSON.parse(init?.body as string) as {
          slug: string
          published: boolean
        }
        expect(body.slug).toBe('custom-slug')
        expect(body.published).toBe(true)
        created = true
        return jsonResponse({ id: 2, title: 'Hello World', slug: 'custom-slug' })
      }
      if (url === '/api/admin/articles') {
        return jsonResponse(
          created
            ? [{ id: 2, title: 'Hello World', slug: 'custom-slug', published: true, mediaIds: [], images: [], featuredMediaId: null }]
            : [],
        )
      }
      return jsonResponse({}, 404)
    })
    render(<ArticlesPanel />)
    await screen.findByText('No articles yet.')
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Hello World' } })
    expect(screen.getByLabelText('Slug')).toHaveValue('hello-world')
    fireEvent.change(screen.getByLabelText('Slug'), { target: { value: 'custom-slug' } })
    expect(screen.getByLabelText('Published')).not.toBeChecked()
    fireEvent.click(screen.getByLabelText('Published'))
    expect(screen.getByLabelText('Published')).toBeChecked()
    fireEvent.click(screen.getByRole('button', { name: 'Save article' }))
    expect(
      await screen.findByText(rowText('Hello World (custom-slug)')),
    ).toBeInTheDocument()
    expect(fn).toHaveBeenCalledWith(
      '/api/admin/articles',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('surfaces delete failures', async () => {
    mockFetch((url, init) => {
      if (url === '/api/admin/articles/1' && init?.method === 'DELETE') {
        return jsonResponse({}, 500)
      }
      if (url === '/api/admin/articles') {
        return jsonResponse(sampleArticles)
      }
      return jsonResponse({}, 404)
    })
    render(<ArticlesPanel />)
    await screen.findByText(rowText('First post (first-post)'))
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0])
    expect(await screen.findByText('Request failed with status 500')).toBeInTheDocument()
  })

  it('shows a save failure message', async () => {
    mockFetch((url, init) => {
      if (url === '/api/admin/articles' && init?.method === 'POST') {
        return jsonResponse({}, 500)
      }
      return jsonResponse([])
    })
    render(<ArticlesPanel />)
    await screen.findByText('No articles yet.')
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Fails' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save article' }))
    expect(await screen.findByText('Request failed with status 500')).toBeInTheDocument()
  })

  it('deleting the article that is being edited resets the form', async () => {
    let deleted = false
    mockFetch((url, init) => {
      if (url === '/api/admin/articles/1' && init?.method === 'DELETE') {
        deleted = true
        return noContent()
      }
      if (url === '/api/admin/articles') {
        return jsonResponse(deleted ? [] : sampleArticles)
      }
      return jsonResponse({}, 404)
    })
    render(<ArticlesPanel />)
    await screen.findByText(rowText('First post (first-post)'))
    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0])
    expect(screen.getByRole('heading', { name: /Edit article/ })).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0])
    expect(await screen.findByRole('heading', { name: 'Write an article' })).toBeInTheDocument()
    expect(await screen.findByText('No articles yet.')).toBeInTheDocument()
  })

  it('surfaces a save failure with a non-Error rejection', async () => {
    mockFetch((url, init) => {
      if (url === '/api/admin/articles' && init?.method === 'POST') {
        throw 'save boom'
      }
      return jsonResponse([])
    })
    render(<ArticlesPanel />)
    await screen.findByText('No articles yet.')
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Fails' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save article' }))
    expect(await screen.findByText('Failed to save article')).toBeInTheDocument()
  })

  it('surfaces a delete failure with a non-Error rejection', async () => {
    mockFetch((url, init) => {
      if (url === '/api/admin/articles/1' && init?.method === 'DELETE') {
        throw 'delete boom'
      }
      if (url === '/api/admin/articles') {
        return jsonResponse(sampleArticles)
      }
      return jsonResponse({}, 404)
    })
    render(<ArticlesPanel />)
    await screen.findByText(rowText('First post (first-post)'))
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0])
    expect(await screen.findByText('Failed to delete article')).toBeInTheDocument()
  })

   it('edits an article with no attached media', async () => {
    mockFetch((url) => {
       if (url === '/api/admin/articles') {
         return jsonResponse([{ ...sampleArticles[0], mediaIds: undefined }])
       }
       return jsonResponse({}, 404)
     })
     render(<ArticlesPanel />)
     await screen.findByText(rowText('First post (first-post)'))
     fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0])
     expect(screen.queryByLabelText('Cover image')).not.toBeInTheDocument()
   })

  it('toggles attached photos during editing', async () => {
    const fn = mockFetch((url, init) => {
      if (url === '/api/admin/articles/1' && init?.method === 'PUT') {
        const body = JSON.parse(init?.body as string) as {
          mediaIds: number[]
          featuredMediaId: number | null
        }
        expect(body.mediaIds).toEqual([])
        expect(body.featuredMediaId).toBeNull()
        return jsonResponse({ id: 1, title: 'First post' })
      }
      if (url === '/api/admin/articles') {
        return jsonResponse(sampleArticles)
      }
      if (url === '/api/admin/media') {
        return jsonResponse(sampleMedia)
      }
      return jsonResponse({}, 404)
    })
    render(<ArticlesPanel />)
    await screen.findByText(rowText('First post (first-post)'))
    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0])
    await screen.findByAltText('Library photo 11')
    fireEvent.click(screen.getByAltText('Library photo 11'))
    expect(screen.getByText('1 selected')).toBeInTheDocument()
    fireEvent.click(screen.getByAltText('Library photo 11'))
    expect(screen.getByText('0 selected')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Save article' }))
    await waitFor(() =>
      expect(fn).toHaveBeenCalledWith(
        '/api/admin/articles/1',
        expect.objectContaining({ method: 'PUT' }),
      ),
    )
  })

  it('drafts an article with AI and fills the form', async () => {
    const fn = mockFetch((url, init) => {
      if (url === '/api/admin/articles') {
        return jsonResponse(sampleArticles)
      }
      if (url === '/api/admin/ai/draft-article' && init?.method === 'POST') {
        const body = JSON.parse(init?.body as string) as { topic: string; mediaIds: number[] }
        expect(body.topic).toBe('oak table')
        expect(body.mediaIds).toEqual([])
        return jsonResponse({ title: 'AI Built Oak Table', bodyMd: '## Body text' })
      }
      return jsonResponse({}, 404)
    })
    render(<ArticlesPanel />)
    await screen.findByText(rowText('First post (first-post)'))
    fireEvent.change(screen.getByLabelText('AI topic'), { target: { value: 'oak table' } })
    fireEvent.click(screen.getByRole('button', { name: 'Draft with AI' }))
    await waitFor(() => expect(screen.getByLabelText('Title')).toHaveValue('AI Built Oak Table'))
    expect(screen.getByLabelText('Slug')).toHaveValue('ai-built-oak-table')
    expect(screen.getByLabelText('Body (markdown)')).toHaveValue('## Body text')
    expect(fn).toHaveBeenCalledWith(
      '/api/admin/ai/draft-article',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('includes selected photos when drafting with AI', async () => {
    const fn = mockFetch((url, init) => {
      if (url === '/api/admin/articles') {
        return jsonResponse([])
      }
      if (url === '/api/admin/media') {
        return jsonResponse(sampleMedia)
      }
      if (url === '/api/admin/ai/draft-article' && init?.method === 'POST') {
        const body = JSON.parse(init?.body as string) as { mediaIds: number[] }
        expect(body.mediaIds).toEqual([11])
        return jsonResponse({ title: 'P', bodyMd: 'B' })
      }
      return jsonResponse({}, 404)
    })
    render(<ArticlesPanel />)
    await screen.findByText('No articles yet.')
    await screen.findByAltText('Library photo 11')
    fireEvent.click(screen.getByAltText('Library photo 11'))
    fireEvent.click(screen.getByRole('button', { name: 'Draft with AI' }))
    await waitFor(() => expect(screen.getByLabelText('Title')).toHaveValue('P'))
    expect(fn).toHaveBeenCalledWith(
      '/api/admin/ai/draft-article',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('shows a failure message when the AI draft fails', async () => {
    mockFetch((url) => {
      if (url === '/api/admin/articles') {
        return jsonResponse([])
      }
      if (url === '/api/admin/ai/draft-article') {
        return jsonResponse({}, 500)
      }
      return jsonResponse({}, 404)
    })
    render(<ArticlesPanel />)
    await screen.findByText('No articles yet.')
    fireEvent.click(screen.getByRole('button', { name: 'Draft with AI' }))
    expect(await screen.findByText('Request failed with status 500')).toBeInTheDocument()
  })
})