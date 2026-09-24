import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import { jsonResponse, mockFetch, restoreFetch, sampleCategories, sampleGallery } from './test/testUtils'

describe('App', () => {
  beforeEach(() => {
    restoreFetch()
  })

  it('renders the site shell with navigation and settings-driven title', async () => {
    mockFetch((url) => {
      if (url === '/api/categories') {
        return jsonResponse(sampleCategories)
      }
      if (url === '/api/settings') {
        return jsonResponse({
          siteTitle: 'Six Kids Crafts',
          backgroundMediaId: 7,
          backgroundImage: '/uploads/bg.jpg',
          contactEmail: null,
          etsyUrl: null,
          instagramUrl: null,
          facebookUrl: null,
        })
      }
      return jsonResponse(sampleGallery)
    })
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )
    expect(await screen.findByText('Six Kids Crafts')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Gallery' })).toHaveAttribute('href', '/gallery')
    expect(screen.getByRole('link', { name: 'Articles' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Contact' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Admin' })).toBeInTheDocument()
    expect(screen.queryByText('Oak shelf')).not.toBeInTheDocument()
    expect(container.querySelector('.page')?.getAttribute('style')).toContain(
      'url("/uploads/bg.jpg")',
    )
  })

  it('falls back to the default title while settings are unavailable', async () => {
    mockFetch((url) => {
      if (url === '/api/categories') {
        return jsonResponse(sampleCategories)
      }
      if (url === '/api/settings') {
        return jsonResponse({}, 500)
      }
      return jsonResponse(sampleGallery)
    })
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )
    expect(await screen.findByText('Six Kids Crafts')).toBeInTheDocument()
  })

  it('shows the gallery when the Gallery tab is clicked from the landing', async () => {
    mockFetch((url) => {
      if (url === '/api/categories') {
        return jsonResponse(sampleCategories)
      }
      if (url === '/api/settings') {
        return jsonResponse({})
      }
      return jsonResponse(sampleGallery)
    })
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.queryByText('Oak shelf')).not.toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Gallery' }))
    expect(await screen.findByText('Oak shelf')).toBeInTheDocument()
  })

  it('renders the gallery grid at /gallery', async () => {
    mockFetch((url) => {
      if (url === '/api/categories') {
        return jsonResponse(sampleCategories)
      }
      if (url === '/api/settings') {
        return jsonResponse({})
      }
      return jsonResponse(sampleGallery)
    })
    render(
      <MemoryRouter initialEntries={['/gallery']}>
        <App />
      </MemoryRouter>,
    )
    expect(await screen.findByText('Oak shelf')).toBeInTheDocument()
  })

  it('redirects unknown paths to the gallery', async () => {
    mockFetch((url) => {
      if (url === '/api/categories') {
        return jsonResponse(sampleCategories)
      }
      if (url === '/api/settings') {
        return jsonResponse({})
      }
      return jsonResponse(sampleGallery)
    })
    render(
      <MemoryRouter initialEntries={['/does-not-exist']}>
        <App />
      </MemoryRouter>,
    )
    expect(await screen.findByText('Oak shelf')).toBeInTheDocument()
  })
})