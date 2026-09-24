import { useSiteSettings } from '../components/SiteSettingsContext'
import { useSeo } from '../lib/seo'

export const LANDING_DESCRIPTION =
  'Handcrafted wood décor, signs, cutting boards and custom furniture by Six Kids Crafts.'

export default function HomePage() {
  const settings = useSiteSettings()
  useSeo({
    title: settings?.siteTitle ?? 'Six Kids Crafts',
    description: LANDING_DESCRIPTION,
  })
  return null
}