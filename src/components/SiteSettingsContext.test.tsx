import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SiteSettingsProvider, useSiteSettings } from './SiteSettingsContext'
import { jsonResponse, mockFetch, restoreFetch, sampleSettings } from '../test/testUtils'

function Probe() {
  const settings = useSiteSettings()
  return <span data-testid="probe">{settings ? settings.siteTitle : 'loading'}</span>
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
})