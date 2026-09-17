import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import PhotosPanel from './PhotosPanel'
import { jsonResponse, mockFetch, restoreFetch, sampleMedia, sampleSettings } from '../test/testUtils'

describe('PhotosPanel', () => {
  beforeEach(() => {
    restoreFetch()
    sessionStorage.setItem('adminAuth', 'YWRtaW46cHc=')
  })

  it('shows the photo library and toggles selections', async () => {
    mockFetch(() => jsonResponse(sampleMedia))
    render(<PhotosPanel />)
    await screen.findByAltText('Library photo 11')
    expect(screen.getByText('0 selected')).toBeInTheDocument()
    fireEvent.click(screen.getByAltText('Library photo 11'))
    expect(screen.getByText('1 selected')).toBeInTheDocument()
    fireEvent.click(screen.getByAltText('Library photo 11'))
    expect(screen.getByText('0 selected')).toBeInTheDocument()
    fireEvent.click(screen.getByAltText('Library photo 12'))
    expect(screen.getByText('1 selected')).toBeInTheDocument()
  })

  it('sets a photo as the site-wide background', async () => {
    const fn = mockFetch((url, init) => {
      if (url === '/api/admin/settings' && init?.method === 'PUT') {
        return jsonResponse({ ...sampleSettings, backgroundMediaId: 11, backgroundImage: '/uploads/a.jpg' })
      }
      if (url === '/api/admin/settings') {
        return jsonResponse(sampleSettings)
      }
      return jsonResponse(sampleMedia)
    })
    render(<PhotosPanel />)
    await screen.findByAltText('Library photo 11')
    fireEvent.click(screen.getAllByRole('button', { name: 'Set background' })[0])
    expect(await screen.findByRole('button', { name: '✓ Background' })).toBeInTheDocument()
    await waitFor(() =>
      expect(fn).toHaveBeenCalledWith(
        '/api/admin/settings',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ backgroundMediaId: 11 }),
        }),
      ),
    )
  })
})