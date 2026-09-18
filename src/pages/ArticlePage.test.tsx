import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ArticlePage from './ArticlePage'
import { jsonResponse, mockFetch, restoreFetch, sampleArticles } from '../test/testUtils'

function renderAt(slug: string | null) {
  return render(
    <MemoryRouter initialEntries={[`/articles/${slug ?? ''}`]}>
      <Routes>
        <Route path="/articles/:slug" element={<ArticlePage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ArticlePage', () => {
  beforeEach(() => {
    restoreFetch()
  })

  it('renders a full article with rendered markdown', async () => {
    mockFetch((url) => {
      expect(url).toBe('/api/articles/first-post')
      return jsonResponse(sampleArticles[0])
    })
    renderAt('first-post')
    expect(screen.getByText('Loading article…')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'First post' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '← All articles' })).toBeInTheDocument()
    expect(screen.getByText('Hello')).toBeInTheDocument()
    expect(screen.getByText('Hello').tagName).toBe('H1')
    expect(screen.getByText('bold', { exact: false }).closest('strong')).toBeInTheDocument()
  })

  it('shows not found when no slug is provided', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="*" element={<ArticlePage />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(await screen.findByText('Article not found.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to articles' })).toBeInTheDocument()
  })

  it('shows the fetch error message', async () => {
    mockFetch(() => jsonResponse({}, 500))
    renderAt('first-post')
    expect(await screen.findByText('Request failed with status 500')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to articles' })).toBeInTheDocument()
  })

  it('shows the article not found view', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/articles/']}>
        <ArticlePage />
      </MemoryRouter>,
    )
    expect(container.querySelector('section.article')).not.toBeNull()
    expect(await screen.findByText('Article not found.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to articles' })).toBeInTheDocument()
  })

  it('surfaces a generic message when loading fails with a non-Error', async () => {
    mockFetch(() => {
      throw 'boom'
    })
    renderAt('first-post')
    expect(await screen.findByText('Failed to load article')).toBeInTheDocument()
  })

  it('renders thumbnail images when the article has several photos', async () => {
    mockFetch(() =>
      jsonResponse({
        ...sampleArticles[0],
        featuredImage: '/uploads/hero.jpg',
        images: ['/uploads/a.jpg', '/uploads/b.jpg'],
      }),
    )
    const { container } = renderAt('first-post')
    await screen.findByRole('heading', { name: 'First post' })
    expect(container.querySelector('img.article-hero')?.getAttribute('src')).toBe('/uploads/hero.jpg')
    const thumbs = container.querySelectorAll('img.article-thumb')
    expect(thumbs).toHaveLength(2)
  })

  it('uses thumbnails for the photo strip when available', async () => {
    mockFetch(() =>
      jsonResponse({
        ...sampleArticles[0],
        images: ['/uploads/a.jpg', '/uploads/b.jpg'],
        thumbnails: ['/uploads/a_thumb.jpg', '/uploads/b_thumb.jpg'],
      }),
    )
    const { container } = renderAt('first-post')
    await screen.findByRole('heading', { name: 'First post' })
    const thumbs = container.querySelectorAll('img.article-thumb')
    expect(thumbs[0].getAttribute('src')).toBe('/uploads/a_thumb.jpg')
    expect(thumbs[1].getAttribute('src')).toBe('/uploads/b_thumb.jpg')
  })
})