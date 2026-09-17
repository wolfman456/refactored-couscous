import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import {
  SiteSettingsProvider,
  useSiteSettings,
  useSiteSettingsActions,
} from './SiteSettingsContext'
import { jsonResponse, mockFetch, restoreFetch, sampleSettings } from '../test/testUtils'

function Probe() {
  const settings = useSiteSettings()
  return <span data-testid="probe">{settings ? settings.siteTitle : 'loading'}</span>
}

function EmailProbe() {
  const settings = useSiteSettings()
  return <span data-testid="email">{settings?.contactEmail ?? 'none'}</span>
}

describe('SiteSettingsContext', () => {
  beforeEach(() => {
    restoreFetch()
  })

  it('exposes null settings while loading', () => {
    mockFetch(() => new Promise(() => undefined))
    render(
      <SiteSettingsProvider>
        <Probe />
      </SiteSettingsProvider>,
    )
    expect(screen.getByTestId('probe')).toHaveTextContent('loading')
  })

  it('loads settings and exposes them to consumers', async () => {
    mockFetch((url) => {
      expect(url).toBe('/api/settings')
      return jsonResponse(sampleSettings)
    })
    render(
      <SiteSettingsProvider>
        <Probe />
      </SiteSettingsProvider>,
    )
    expect(await screen.findByText('Six Kids Crafts')).toBeInTheDocument()
  })

  it('stays null when the settings request fails', async () => {
    mockFetch(() => jsonResponse({}, 500))
    render(
      <SiteSettingsProvider>
        <Probe />
      </SiteSettingsProvider>,
    )
    await screen.findByTestId('probe')
    expect(screen.getByTestId('probe')).toHaveTextContent('loading')
  })

  it('ignores a response arriving after unmount', async () => {
    let resolve!: (value: Response) => void
    mockFetch(() => new Promise<Response>((res) => {
      resolve = res
    }))
    const { unmount } = render(
      <SiteSettingsProvider>
        <Probe />
      </SiteSettingsProvider>,
    )
    expect(screen.getByTestId('probe')).toHaveTextContent('loading')
    unmount()
    resolve(jsonResponse(sampleSettings) as Response)
    expect(screen.queryByTestId('probe')).not.toBeInTheDocument()
  })

  it('lets consumers push saved settings into the context', async () => {
    mockFetch(() => jsonResponse(sampleSettings))
    function Setter() {
      const { setSettings } = useSiteSettingsActions()
      return (
        <button
          type="button"
          onClick={() => setSettings({ ...sampleSettings, contactEmail: 'new@sixkids.com' })}
        >
          set
        </button>
      )
    }
    render(
      <SiteSettingsProvider>
        <EmailProbe />
        <Setter />
      </SiteSettingsProvider>,
    )
    await screen.findByText('hello@sixkidscrafts.com')
    fireEvent.click(screen.getByRole('button', { name: 'set' }))
    expect(screen.getByTestId('email')).toHaveTextContent('new@sixkids.com')
  })

  it('re-fetches settings on demand', async () => {
    let email = 'first@sixkids.com'
    mockFetch(() => jsonResponse({ ...sampleSettings, contactEmail: email }))
    function Refresher() {
      const { refresh } = useSiteSettingsActions()
      return (
        <button type="button" onClick={() => void refresh()}>
          refresh
        </button>
      )
    }
    render(
      <SiteSettingsProvider>
        <EmailProbe />
        <Refresher />
      </SiteSettingsProvider>,
    )
    await screen.findByText('first@sixkids.com')
    email = 'second@sixkids.com'
    fireEvent.click(screen.getByRole('button', { name: 'refresh' }))
    await waitFor(() => expect(screen.getByTestId('email')).toHaveTextContent('second@sixkids.com'))
  })
})