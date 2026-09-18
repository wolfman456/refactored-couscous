import { useSiteSettings } from '../components/SiteSettingsContext'
import type { SiteSettings } from '../api/settings'
import { useSeo } from '../lib/seo'

interface ContactLink {
  key: string
  label: string
  url: string
}

function contactLinks(settings: SiteSettings): ContactLink[] {
  const links: ContactLink[] = []
  if (settings.contactEmail) {
    links.push({ key: 'email', label: settings.contactEmail, url: `mailto:${settings.contactEmail}` })
  }
  if (settings.etsyUrl) {
    links.push({ key: 'etsy', label: 'Etsy shop', url: settings.etsyUrl })
  }
  if (settings.instagramUrl) {
    links.push({ key: 'instagram', label: 'Instagram', url: settings.instagramUrl })
  }
  if (settings.facebookUrl) {
    links.push({ key: 'facebook', label: 'Facebook', url: settings.facebookUrl })
  }
  return links
}

export default function ContactPage() {
  useSeo({
    title: 'Contact · Six Kids Crafts',
    description: 'Questions, custom commissions or just want to say hello? Get in touch with Six Kids Crafts.',
  })
  const settings = useSiteSettings()
  const links = settings ? contactLinks(settings) : []

  return (
    <section className="contact">
      <h1>Contact</h1>
      <p>
        Have a question about a piece, a custom commission, or just want to say
        hello? Reach out any time.
      </p>
      {links.length === 0 ? (
        <p>Our contact details are coming soon.</p>
      ) : (
        <ul className="contact-list">
          {links.map((link) => (
            <li key={link.key}>
              <a href={link.url} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}