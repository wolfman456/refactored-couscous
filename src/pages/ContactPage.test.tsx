import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import ContactPage from './ContactPage'
import { SiteSettingsProvider } from '../components/SiteSettingsContext'
import { sampleSettings } from '../test/testUtils'
import { jsonResponse, mockFetch, restoreFetch } from '../test/testUtils'

describe('ContactPage', () => {
  beforeEach(() => {
    restoreFetch()
  })

  it('shows a loading state while settings are unknown', () => {
    mockFetch(() => new Promise(() => undefined))
    render(
      <SiteSettingsProvider>
        <ContactPage />
      </SiteSettingsProvider>,
    )
    expect(screen.getByRole('status')).toHaveTextContent('Loading contact details')
  })

  it('keeps the public email and Etsy shop available when settings fail', async () => {
    mockFetch(() => jsonResponse({}, 503))
    render(
      <SiteSettingsProvider>
        <ContactPage />
      </SiteSettingsProvider>,
    )
    expect(await screen.findByRole('link', { name: '6kidscrafts@gmail.com' })).toHaveAttribute(
      'href', 'mailto:6kidscrafts@gmail.com',
    )
    expect(screen.getByRole('link', { name: 'Etsy shop' })).toHaveAttribute(
      'href', 'https://www.etsy.com/shop/SixKidsCraftsUS',
    )
  })

  it('shows coming soon when all contact links are absent', async () => {
    mockFetch(() =>
      jsonResponse({ ...sampleSettings, contactEmail: null, etsyUrl: null, instagramUrl: null, facebookUrl: null }),
    )
    render(
      <SiteSettingsProvider>
        <ContactPage />
      </SiteSettingsProvider>,
    )
    await screen.findByText('Our contact details are coming soon.')
  })

  it('renders only the email link when other links are absent', async () => {
    mockFetch(() =>
      jsonResponse({ ...sampleSettings, etsyUrl: null, instagramUrl: null, facebookUrl: null }),
    )
    render(
      <SiteSettingsProvider>
        <ContactPage />
      </SiteSettingsProvider>,
    )
    const email = await screen.findByRole('link', { name: 'hello@sixkidscrafts.com' })
    expect(email.getAttribute('href')).toBe('mailto:hello@sixkidscrafts.com')
    expect(screen.queryByText('Etsy shop')).not.toBeInTheDocument()
    expect(screen.queryByText('Instagram')).not.toBeInTheDocument()
    expect(screen.queryByText('Facebook')).not.toBeInTheDocument()
  })

  it('renders the contact links from settings', async () => {
    mockFetch(() =>
      jsonResponse({
        ...sampleSettings,
        instagramUrl: 'https://instagram.com/sixkids',
        facebookUrl: 'https://facebook.com/sixkids',
      }),
    )
    render(
      <SiteSettingsProvider>
        <ContactPage />
      </SiteSettingsProvider>,
    )
    const email = await screen.findByRole('link', { name: 'hello@sixkidscrafts.com' })
    expect(email.getAttribute('href')).toBe('mailto:hello@sixkidscrafts.com')
    expect(screen.getByRole('link', { name: 'Etsy shop' })).toHaveAttribute(
      'href',
      'https://etsy.com/shop/sixkids',
    )
    expect(screen.getByText('Instagram')).toHaveAttribute(
      'href',
      'https://instagram.com/sixkids',
    )
    expect(screen.getByText('Facebook')).toHaveAttribute('href', 'https://facebook.com/sixkids')
  })

  it('omits unset links', async () => {
    mockFetch(() =>
      jsonResponse({
        ...sampleSettings,
        instagramUrl: 'https://instagram.com/sixkids',
      }),
    )
    render(
      <SiteSettingsProvider>
        <ContactPage />
      </SiteSettingsProvider>,
    )
    await screen.findByRole('link', { name: 'Instagram' })
    expect(screen.queryByText('Facebook')).not.toBeInTheDocument()
  })
})