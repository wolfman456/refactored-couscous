import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import SitePanel from './SitePanel'
import { SiteSettingsProvider, useSiteSettings } from '../components/SiteSettingsContext'
import { jsonResponse, mockFetch, restoreFetch, sampleMedia, sampleSettings } from '../test/testUtils'

function EmailProbe() {
  const settings = useSiteSettings()
  return <span data-testid="ctx-email">{settings?.contactEmail ?? 'none'}</span>
}

describe('SitePanel', () => {
  beforeEach(() => {
    restoreFetch()
    sessionStorage.setItem('adminAuth', 'YWRtaW46cHc=')
  })

  it('loads and prefills the settings form', async () => {
    mockFetch((url) => {
      if (url === '/api/admin/media') {
        return jsonResponse(sampleMedia)
      }
      return jsonResponse(sampleSettings)
    })
    render(<SitePanel />)
    const title = await screen.findByLabelText('Site title')
    expect(title).toHaveValue('Six Kids Crafts')
    expect(screen.getByLabelText('Contact email')).toHaveValue('hello@sixkidscrafts.com')
    expect(screen.getByLabelText('Etsy shop URL')).toHaveValue('https://etsy.com/shop/sixkids')
  })

  it('saves the title', async () => {
    const fn = mockFetch((url, init) => {
      if (url === '/api/admin/settings' && init?.method === 'PUT') {
        const body = JSON.parse(init?.body as string) as Record<string, unknown>
        expect(body.siteTitle).toBe('Six Kids Woodworks')
        return jsonResponse(sampleSettings)
      }
      if (url === '/api/admin/media') {
        return jsonResponse(sampleMedia)
      }
      return jsonResponse(sampleSettings)
    })
    render(<SitePanel />)
    const title = await screen.findByLabelText('Site title')
    fireEvent.change(title, { target: { value: 'Six Kids Woodworks' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save settings' }))
    expect(await screen.findByText('Saved.')).toBeInTheDocument()
    expect(fn).toHaveBeenCalledWith(
      '/api/admin/settings',
      expect.objectContaining({ method: 'PUT' }),
    )
  })

  it('selects a background photo and saves its id', async () => {
    const fn = mockFetch((url, init) => {
      if (url === '/api/admin/settings' && init?.method === 'PUT') {
        const body = JSON.parse(init?.body as string) as Record<string, unknown>
        expect(body.backgroundMediaId).toBe('11')
        return jsonResponse(sampleSettings)
      }
      if (url === '/api/admin/media') {
        return jsonResponse(sampleMedia)
      }
      return jsonResponse(sampleSettings)
    })
    render(<SitePanel />)
    await screen.findByLabelText('Site title')
    fireEvent.click(await screen.findByAltText('Library photo 11'))
    fireEvent.click(screen.getByRole('button', { name: 'Save settings' }))
    await waitFor(() => expect(fn).toHaveBeenCalledWith('/api/admin/settings', expect.objectContaining({ method: 'PUT' })))
  })

  it('selects and deselects a background photo', async () => {
    const fn = mockFetch((url, init) => {
      if (url === '/api/admin/settings' && init?.method === 'PUT') {
        const body = JSON.parse(init?.body as string) as Record<string, unknown>
        expect(body.backgroundMediaId).toBe('')
        return jsonResponse(sampleSettings)
      }
      if (url === '/api/admin/media') {
        return jsonResponse(sampleMedia)
      }
      return jsonResponse(sampleSettings)
    })
    render(<SitePanel />)
    await screen.findByLabelText('Site title')
    fireEvent.click(await screen.findByAltText('Library photo 11'))
    expect(screen.getByText('1 selected')).toBeInTheDocument()
    fireEvent.click(screen.getByAltText('Library photo 11'))
    expect(screen.getByText('0 selected')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Save settings' }))
    await waitFor(() => expect(fn).toHaveBeenCalledWith('/api/admin/settings', expect.objectContaining({ method: 'PUT' })))
  })

  it('saves edited contact links', async () => {
    const fn = mockFetch((url, init) => {
      if (url === '/api/admin/settings' && init?.method === 'PUT') {
        const body = JSON.parse(init?.body as string) as Record<string, unknown>
        expect(body.contactEmail).toBe('new@sixkids.com')
        expect(body.etsyUrl).toBe('https://etsy.com/shop/other')
        expect(body.instagramUrl).toBe('https://instagram.com/other')
        expect(body.facebookUrl).toBe('https://facebook.com/other')
        return jsonResponse(sampleSettings)
      }
      if (url === '/api/admin/media') {
        return jsonResponse(sampleMedia)
      }
      return jsonResponse(sampleSettings)
    })
    render(<SitePanel />)
    await screen.findByLabelText('Site title')
    fireEvent.change(screen.getByLabelText('Contact email'), { target: { value: 'new@sixkids.com' } })
    fireEvent.change(screen.getByLabelText('Etsy shop URL'), { target: { value: 'https://etsy.com/shop/other' } })
    fireEvent.change(screen.getByLabelText('Instagram URL'), { target: { value: 'https://instagram.com/other' } })
    fireEvent.change(screen.getByLabelText('Facebook URL'), { target: { value: 'https://facebook.com/other' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save settings' }))
    await waitFor(() => expect(fn).toHaveBeenCalledWith('/api/admin/settings', expect.objectContaining({ method: 'PUT' })))
  })

  it('shows a save failure message', async () => {
    mockFetch((url, init) => {
      if (url === '/api/admin/settings' && init?.method === 'PUT') {
        return jsonResponse({}, 500)
      }
      if (url === '/api/admin/media') {
        return jsonResponse(sampleMedia)
      }
      return jsonResponse(sampleSettings)
    })
    render(<SitePanel />)
    await screen.findByLabelText('Site title')
    fireEvent.click(screen.getByRole('button', { name: 'Save settings' }))
    expect(await screen.findByText('Request failed with status 500')).toBeInTheDocument()
  })

  it('shows a load failure message', async () => {
    mockFetch(() => jsonResponse({}, 500))
    render(<SitePanel />)
    expect(await screen.findByText('Request failed with status 500')).toBeInTheDocument()
  })

  it('shows a generic message when settings fail to load with a non-Error', async () => {
    mockFetch(() => {
      throw 'boom'
    })
    render(<SitePanel />)
    expect(await screen.findByText('Failed to load settings')).toBeInTheDocument()
  })

  it('shows a generic message when saving fails with a non-Error', async () => {
    mockFetch((url, init) => {
      if (url === '/api/admin/settings' && init?.method === 'PUT') {
        throw 'boom'
      }
      if (url === '/api/admin/media') {
        return jsonResponse(sampleMedia)
      }
      return jsonResponse(sampleSettings)
    })
    render(<SitePanel />)
    await screen.findByLabelText('Site title')
    fireEvent.click(screen.getByRole('button', { name: 'Save settings' }))
    expect(await screen.findByText('Failed to save settings')).toBeInTheDocument()
  })

  it('prefills with null contact fields when settings have null values', async () => {
    mockFetch((url) => {
      if (url === '/api/admin/media') {
        return jsonResponse(sampleMedia)
      }
      return jsonResponse({ ...sampleSettings, contactEmail: null, etsyUrl: null, instagramUrl: null, facebookUrl: null })
    })
    render(<SitePanel />)
    await screen.findByLabelText('Site title')
    expect(screen.getByLabelText('Contact email')).toHaveValue('')
    expect(screen.getByLabelText('Etsy shop URL')).toHaveValue('')
    expect(screen.getByLabelText('Instagram URL')).toHaveValue('')
    expect(screen.getByLabelText('Facebook URL')).toHaveValue('')
  })

  it('pushes saved settings into the shared site settings context', async () => {
    mockFetch((url, init) => {
      if (url === '/api/admin/settings' && init?.method === 'PUT') {
        return jsonResponse({ ...sampleSettings, contactEmail: 'new@sixkids.com' })
      }
      if (url === '/api/admin/media') {
        return jsonResponse(sampleMedia)
      }
      return jsonResponse(sampleSettings)
    })
    render(
      <SiteSettingsProvider>
        <SitePanel />
        <EmailProbe />
      </SiteSettingsProvider>,
    )
    await screen.findByLabelText('Site title')
    expect(screen.getByTestId('ctx-email')).toHaveTextContent('hello@sixkidscrafts.com')
    fireEvent.change(screen.getByLabelText('Contact email'), {
      target: { value: 'new@sixkids.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save settings' }))
    expect(await screen.findByText('Saved.')).toBeInTheDocument()
    expect(screen.getByTestId('ctx-email')).toHaveTextContent('new@sixkids.com')
  })
})