import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AdminPage from './AdminPage'
import { jsonResponse, mockFetch, restoreFetch, sampleSettings } from '../test/testUtils'

describe('AdminPage', () => {
  beforeEach(() => {
    restoreFetch()
  })

  describe('before authentication', () => {
    it('shows the login form', () => {
      render(
        <MemoryRouter>
          <AdminPage />
        </MemoryRouter>,
      )
      expect(screen.getByRole('heading', { name: 'Admin login' })).toBeInTheDocument()
    })
  })

  describe('logging in', () => {
    it('signs in with valid credentials and logs out', async () => {
      const fn = mockFetch((url, init) => {
        if (url === '/api/admin/media') {
          return jsonResponse([])
        }
        expect(url).toBe('/api/admin/settings')
        expect((init?.headers ?? {} as Record<string, string>).Authorization).toBe(
          'Basic YWRtaW46cHc=',
        )
        return jsonResponse(sampleSettings)
      })
      render(
        <MemoryRouter>
          <AdminPage />
        </MemoryRouter>,
      )
      fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'admin' } })
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pw' } })
      fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
      expect(await screen.findByText('Content manager')).toBeInTheDocument()
      expect(fn).toHaveBeenCalledWith(
        '/api/admin/settings',
        expect.objectContaining({ method: 'GET' }),
      )
      fireEvent.click(screen.getByRole('button', { name: 'Log out' }))
      expect(screen.getByRole('heading', { name: 'Admin login' })).toBeInTheDocument()
    })

    it('rejects invalid credentials without logging a session in', async () => {
      mockFetch(() => jsonResponse({}, 401))
      render(
        <MemoryRouter>
          <AdminPage />
        </MemoryRouter>,
      )
      fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'admin' } })
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'bad' } })
      fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
      expect(
        await screen.findByText('Incorrect username or password'),
      ).toBeInTheDocument()
      expect(sessionStorage.getItem('adminAuth')).toBeNull()
    })

    it('surfaces a generic login failure for non-Error rejections', async () => {
      mockFetch(() => {
        throw 'boom'
      })
      render(
        <MemoryRouter>
          <AdminPage />
        </MemoryRouter>,
      )
      fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'admin' } })
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pw' } })
      fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
      expect(await screen.findByText('Login failed')).toBeInTheDocument()
    })
  })

  describe('after authentication', () => {
    it('switches panels via the manager tabs', async () => {
      mockFetch((url) => {
        if (url === '/api/admin/gallery') {
          return jsonResponse([
            { id: 1, title: 'Oak shelf', categoryId: 1, categoryName: 'Shelves', sortOrder: 1, published: true, createdAt: '2026-01-01T00:00:00Z', images: [], mediaIds: [] },
          ])
        }
        if (url === '/api/admin/categories') {
          return jsonResponse([{ id: 1, name: 'Shelves', sortOrder: 1 }])
        }
        if (url === '/api/admin/articles') {
          return jsonResponse([{ id: 1, title: 'First post', slug: 'first-post', published: true, mediaIds: [], images: [], featuredMediaId: null }])
        }
        if (url === '/api/admin/media') {
          return jsonResponse([{ id: 11, assetType: 'IMAGE', url: '/uploads/a.jpg', contentType: 'image/jpeg', sizeBytes: 1, uploadedAt: '2026-01-01T00:00:00Z' }])
        }
        return jsonResponse(sampleSettings)
      })
      sessionStorage.setItem('adminAuth', 'YWRtaW46cHc=')
      render(
        <MemoryRouter>
          <AdminPage />
        </MemoryRouter>,
      )
      expect(await screen.findByText('Photo library')).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Gallery' }))
      expect(await screen.findByText('Oak shelf')).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Articles' }))
      expect(await screen.findByRole('heading', { name: 'Articles' })).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Tabs' }))
      await screen.findByText('Gallery tabs')
      fireEvent.click(screen.getByRole('button', { name: 'Site' }))
      await screen.findByText('Site settings')
    })
  })
})