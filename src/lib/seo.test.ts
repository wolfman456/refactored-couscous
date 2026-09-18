import { afterEach, describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { DEFAULT_OG_IMAGE, metaDescription, plainText, useSeo } from './seo'

function metaContent(selector: string): string | null {
  return document.head.querySelector(selector)?.getAttribute('content') ?? null
}

afterEach(() => {
  document.head.innerHTML = ''
  document.title = ''
})

describe('metaDescription', () => {
  it('falls back when there is no usable text', () => {
    expect(metaDescription(null, 'fallback')).toBe('fallback')
    expect(metaDescription('   ', 'fallback')).toBe('fallback')
  })

  it('keeps short text as-is', () => {
    expect(metaDescription('A small oak shelf.', 'fallback')).toBe('A small oak shelf.')
  })

  it('truncates long text with an ellipsis', () => {
    const long = 'word '.repeat(60).trim()
    const result = metaDescription(long, 'fallback')
    expect(result.length).toBeLessThanOrEqual(160)
    expect(result.endsWith('…')).toBe(true)
  })
})

describe('plainText', () => {
  it('strips common markdown syntax', () => {
    const out = plainText('# Hello\n\nSome **bold** [link](x) text.')
    expect(out).toContain('Hello')
    expect(out).toContain('bold')
    expect(out).not.toContain('#')
    expect(out).not.toContain('*')
  })
})

describe('useSeo', () => {
  it('sets the title and social tags with a custom image', () => {
    renderHook(() =>
      useSeo({ title: 'Piece · Six Kids Crafts', description: 'A shelf.', image: '/uploads/a.jpg', type: 'article' }),
    )
    expect(document.title).toBe('Piece · Six Kids Crafts')
    expect(metaContent('meta[name="description"]')).toBe('A shelf.')
    expect(metaContent('meta[property="og:title"]')).toBe('Piece · Six Kids Crafts')
    expect(metaContent('meta[property="og:type"]')).toBe('article')
    expect(metaContent('meta[property="og:image"]')).toBe(`${window.location.origin}/uploads/a.jpg`)
    expect(metaContent('meta[name="twitter:card"]')).toBe('summary_large_image')
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      window.location.href,
    )
  })

  it('falls back to the default image and summary card', () => {
    renderHook(() => useSeo({ title: 'Gallery · Six Kids Crafts' }))
    expect(metaContent('meta[name="twitter:card"]')).toBe('summary')
    expect(metaContent('meta[property="og:image"]')).toBe(
      `${window.location.origin}${DEFAULT_OG_IMAGE}`,
    )
    expect(metaContent('meta[name="description"]')).toBeNull()
  })

  it('updates existing tags instead of duplicating them', () => {
    const existing = document.createElement('meta')
    existing.setAttribute('name', 'description')
    existing.setAttribute('content', 'old')
    document.head.appendChild(existing)

    renderHook(() => useSeo({ title: 'Contact · Six Kids Crafts', description: 'Reach out.' }))

    expect(document.head.querySelectorAll('meta[name="description"]')).toHaveLength(1)
    expect(metaContent('meta[name="description"]')).toBe('Reach out.')
  })

  it('marks admin pages noindex', () => {
    renderHook(() => useSeo({ title: 'Content manager · Six Kids Crafts', noindex: true }))
    expect(metaContent('meta[name="robots"]')).toBe('noindex, nofollow')
  })

  it('updates an existing canonical link in place', () => {
    const link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    link.setAttribute('href', 'https://old.example/')
    document.head.appendChild(link)

    renderHook(() => useSeo({ title: 'Gallery · Six Kids Crafts' }))

    expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1)
    expect(link.getAttribute('href')).toBe(window.location.href)
  })

  it('removes the tags it created on unmount', () => {
    const { unmount } = renderHook(() =>
      useSeo({ title: 'Gallery · Six Kids Crafts', description: 'Browse.' }),
    )
    expect(metaContent('meta[name="description"]')).toBe('Browse.')
    unmount()
    expect(metaContent('meta[name="description"]')).toBeNull()
    expect(document.head.querySelector('link[rel="canonical"]')).toBeNull()
  })
})
