import { useEffect } from 'react'

export const SITE_NAME = 'Six Kids Crafts'
export const DEFAULT_OG_IMAGE = '/apple-touch-icon.png'

const MAX_DESCRIPTION = 160

/**
 * Collapses whitespace and trims `text` to a meta-description sized string,
 * falling back when there is nothing usable to show.
 */
export function metaDescription(text: string | null | undefined, fallback: string): string {
  const clean = (text ?? '').replace(/\s+/g, ' ').trim()
  if (!clean) {
    return fallback
  }
  if (clean.length <= MAX_DESCRIPTION) {
    return clean
  }
  return `${clean.slice(0, MAX_DESCRIPTION - 3).trimEnd()}…`
}

/** Strips the most common Markdown syntax down to readable plain text. */
export function plainText(source: string): string {
  return source.replace(/[#*_>`[\]()!\\-]/g, ' ')
}

export interface SeoOptions {
  title: string
  description?: string | null
  image?: string | null
  type?: 'website' | 'article'
  noindex?: boolean
}

function absoluteUrl(path: string): string {
  return new URL(path, window.location.origin).href
}

export function useSeo({
  title,
  description,
  image,
  type = 'website',
  noindex = false,
}: SeoOptions): void {
  useEffect(() => {
    document.title = title
    const created: HTMLElement[] = []

    const setMeta = (
      attribute: 'name' | 'property',
      key: string,
      content: string | null | undefined,
    ) => {
      if (!content) {
        return
      }
      let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute(attribute, key)
        document.head.appendChild(tag)
        created.push(tag)
      }
      tag.setAttribute('content', content)
    }

    const socialImage = absoluteUrl(image || DEFAULT_OG_IMAGE)

    setMeta('name', 'description', description)
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:type', type)
    setMeta('property', 'og:url', window.location.href)
    setMeta('property', 'og:image', socialImage)
    setMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary')
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'twitter:image', socialImage)
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : undefined)

    const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (canonical) {
      canonical.setAttribute('href', window.location.href)
    } else {
      const link = document.createElement('link')
      link.setAttribute('rel', 'canonical')
      link.setAttribute('href', window.location.href)
      document.head.appendChild(link)
      created.push(link)
    }

    return () => {
      created.forEach((tag) => tag.remove())
    }
  }, [title, description, image, type, noindex])
}
