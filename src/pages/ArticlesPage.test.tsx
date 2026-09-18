import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ArticlesPage from './ArticlesPage'
import { formatDate } from './articleUtils'
import { jsonResponse, mockFetch, restoreFetch, sampleArticles } from '../test/testUtils'

describe('ArticlesPage', () => {
  beforeEach(() => {
    restoreFetch()
  })

  it('renders a list of articles with dates and links', async () => {
    mockFetch((url) => {
      expect(url).toBe('/api/articles')
      return jsonResponse(sampleArticles)
    })
    render(
      <MemoryRouter>
        <ArticlesPage />
      </MemoryRouter>,
    )
    await screen.findByRole('heading', { name: 'Notes from the shop' })
    expect(screen.getByText('First post')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /First post/ })
    expect(link.getAttribute('href')).toBe('/articles/first-post')
  })

  it('shows an empty state', async () => {
    mockFetch(() => jsonResponse([]))
    render(
      <MemoryRouter>
        <ArticlesPage />
      </MemoryRouter>,
    )
    expect(
      await screen.findByText('No articles yet — check back soon.'),
    ).toBeInTheDocument()
  })

  it('shows the fetch error message', async () => {
    mockFetch(() => jsonResponse({}, 500))
    render(
      <MemoryRouter>
        <ArticlesPage />
      </MemoryRouter>,
    )
    expect(await screen.findByText('Request failed with status 500')).toBeInTheDocument()
  })

  it('renders a featured image when present', async () => {
    mockFetch(() =>
      jsonResponse([{ ...sampleArticles[0], featuredImage: '/uploads/hero.jpg' }]),
    )
    const { container } = render(
      <MemoryRouter>
        <ArticlesPage />
      </MemoryRouter>,
    )
    await screen.findByRole('link', { name: /First post/ })
    const img = container.querySelector('img.article-card-img')
    expect(img?.getAttribute('src')).toBe('/uploads/hero.jpg')
  })

  it('prefers the featured thumbnail for the card image', async () => {
    mockFetch(() =>
      jsonResponse([
        {
          ...sampleArticles[0],
          featuredImage: '/uploads/hero.jpg',
          featuredThumbnail: '/uploads/hero_thumb.jpg',
        },
      ]),
    )
    const { container } = render(
      <MemoryRouter>
        <ArticlesPage />
      </MemoryRouter>,
    )
    await screen.findByRole('link', { name: /First post/ })
    const img = container.querySelector('img.article-card-img')
    expect(img?.getAttribute('src')).toBe('/uploads/hero_thumb.jpg')
    expect(img?.getAttribute('srcset')).toBe('/uploads/hero_thumb.jpg 480w, /uploads/hero.jpg 2000w')
  })

  it('surfaces a load failure with a non-Error', async () => {
    mockFetch(() => {
      throw 'boom'
    })
    render(
      <MemoryRouter>
        <ArticlesPage />
      </MemoryRouter>,
    )
    expect(await screen.findByText('Failed to load articles')).toBeInTheDocument()
  })

  it('formats article dates', () => {
    expect(formatDate('2026-03-01T09:00:00Z')).toBe(
      new Date('2026-03-01T09:00:00Z').toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    )
  })
})