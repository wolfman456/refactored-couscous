import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import TabsPanel from './TabsPanel'
import { jsonResponse, mockFetch, noContent, restoreFetch, rowText, sampleCategories } from '../test/testUtils'

describe('TabsPanel', () => {
  beforeEach(() => {
    restoreFetch()
    sessionStorage.setItem('adminAuth', 'YWRtaW46cHc=')
  })

  it('loads the category list', async () => {
    mockFetch(() => jsonResponse(sampleCategories))
    render(<TabsPanel />)
    expect(await screen.findByText(rowText('Shelves (order 1)'))).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Add a tab' })).toBeInTheDocument()
  })

  it('shows the empty state', async () => {
    mockFetch(() => jsonResponse([]))
    render(<TabsPanel />)
    expect(await screen.findByText('No categories yet.')).toBeInTheDocument()
  })

  it('creates a tab', async () => {
    const fn = mockFetch((url, init) => {
      if (url === '/api/admin/categories' && init?.method === 'POST') {
        const body = JSON.parse(init?.body as string) as Record<string, unknown>
        expect(body.name).toBe('New tab')
        expect(body.sortOrder).toBe(3)
        return jsonResponse({ id: 4, name: 'New tab', sortOrder: 3 })
      }
      if (url === '/api/admin/categories') {
        return jsonResponse([...sampleCategories, { id: 4, name: 'New tab', sortOrder: 3 }])
      }
      return jsonResponse({}, 404)
    })
    render(<TabsPanel />)
    await screen.findByText(rowText('Shelves (order 1)'))
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'New tab' } })
    fireEvent.change(screen.getByLabelText('Order'), { target: { value: '3' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save tab' }))
    expect(await screen.findByText(rowText('New tab (order 3)'))).toBeInTheDocument()
    expect(fn).toHaveBeenCalledWith(
      '/api/admin/categories',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('edits an existing tab', async () => {
    let edited = false
    const fn = mockFetch((url, init) => {
      if (url === '/api/admin/categories/2' && init?.method === 'PUT') {
        edited = true
        return jsonResponse({ id: 2, name: 'Boxes v2', sortOrder: 2 })
      }
      if (url === '/api/admin/categories') {
        return jsonResponse(
          edited
            ? sampleCategories.map((c) => (c.id === 2 ? { ...c, name: 'Boxes v2' } : c))
            : sampleCategories,
        )
      }
      return jsonResponse({}, 404)
    })
    render(<TabsPanel />)
    await screen.findByText(rowText('Boxes (order 2)'))
    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[1])
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Boxes v2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save tab' }))
    expect(await screen.findByText(rowText('Boxes v2 (order 2)'))).toBeInTheDocument()
    expect(fn).toHaveBeenCalledWith(
      '/api/admin/categories/2',
      expect.objectContaining({ method: 'PUT' }),
    )
  })

  it('deletes a tab', async () => {
    let deleted = false
    const fn = mockFetch((url, init) => {
      if (url === '/api/admin/categories/1' && init?.method === 'DELETE') {
        deleted = true
        return noContent()
      }
      if (url === '/api/admin/categories') {
        return jsonResponse(deleted ? sampleCategories.slice(1) : sampleCategories)
      }
      return jsonResponse({}, 404)
    })
    render(<TabsPanel />)
    await screen.findByText(rowText('Shelves (order 1)'))
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0])
    await waitFor(() =>
      expect(fn).toHaveBeenCalledWith(
        '/api/admin/categories/1',
        expect.objectContaining({ method: 'DELETE' }),
      ),
    )
    expect(await screen.findByText(rowText('Boxes (order 2)'))).toBeInTheDocument()
    expect(screen.queryByText(rowText('Shelves (order 1)'))).not.toBeInTheDocument()
  })

  it('shows a load failure message', async () => {
    mockFetch(() => jsonResponse({}, 500))
    render(<TabsPanel />)
    const messages = await screen.findAllByText('Request failed with status 500')
    expect(messages.length).toBeGreaterThan(0)
  })

  it('cancels an edit and resets the form', async () => {
    mockFetch(() => jsonResponse(sampleCategories))
    render(<TabsPanel />)
    await screen.findByText(rowText('Shelves (order 1)'))
    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0])
    expect(screen.getByRole('heading', { name: /Edit tab/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel edit' }))
    expect(screen.getByRole('heading', { name: 'Add a tab' })).toBeInTheDocument()
  })

  it('shows a save failure message', async () => {
    mockFetch((url, init) => {
      if (url === '/api/admin/categories' && init?.method === 'POST') {
        return jsonResponse({}, 500)
      }
      return jsonResponse(sampleCategories)
    })
    render(<TabsPanel />)
    await screen.findByText(rowText('Shelves (order 1)'))
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Oops' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save tab' }))
    expect(await screen.findByText('Request failed with status 500')).toBeInTheDocument()
  })

  it('surfaces delete failures', async () => {
    mockFetch((url, init) => {
      if (url === '/api/admin/categories/1' && init?.method === 'DELETE') {
        return jsonResponse({}, 500)
      }
      return jsonResponse(sampleCategories)
    })
    render(<TabsPanel />)
    await screen.findByText(rowText('Shelves (order 1)'))
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0])
    expect(await screen.findByText('Request failed with status 500')).toBeInTheDocument()
  })

  it('deleting the category being edited resets the form', async () => {
    let deleted = false
    mockFetch((url, init) => {
      if (url === '/api/admin/categories/1' && init?.method === 'DELETE') {
        deleted = true
        return noContent()
      }
      if (url === '/api/admin/categories') {
        return jsonResponse(deleted ? [] : sampleCategories)
      }
      return jsonResponse({}, 404)
    })
    render(<TabsPanel />)
    await screen.findByText(rowText('Shelves (order 1)'))
    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0])
    expect(screen.getByRole('heading', { name: /Edit tab/ })).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0])
    expect(await screen.findByRole('heading', { name: 'Add a tab' })).toBeInTheDocument()
    expect(await screen.findByText('No categories yet.')).toBeInTheDocument()
  })
})