import { vi } from 'vitest'

type FetchCall = (url: string, init?: RequestInit) => unknown

export function jsonResponse(data: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  } as Response
}

export function noContent(): Response {
  return {
    ok: true,
    status: 204,
    json: () => Promise.reject(new Error('No content')),
  } as Response
}

export function mockFetch(handler: FetchCall): ReturnType<typeof vi.fn> {
  const fn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    const res = await handler(url, init)
    return res
  })
  vi.stubGlobal('fetch', fn)
  return fn
}

export function restoreFetch(): void {
  vi.unstubAllGlobals()
}

export const sampleGallery = [
  {
    id: 1,
    title: 'Oak shelf',
    description: 'A small oak shelf.',
    categoryId: 1,
    categoryName: 'Shelves',
    sortOrder: 1,
    published: true,
    createdAt: '2026-01-02T10:00:00Z',
    images: ['/uploads/a.jpg'],
    mediaIds: [11],
  },
  {
    id: 2,
    title: 'Walnut box',
    description: null,
    categoryId: 2,
    categoryName: 'Boxes',
    sortOrder: 2,
    published: false,
    createdAt: '2026-02-03T10:00:00Z',
    images: [],
    mediaIds: [],
  },
]

export const sampleCategories = [
  { id: 1, name: 'Shelves', sortOrder: 1 },
  { id: 2, name: 'Boxes', sortOrder: 2 },
]

export const sampleSettings = {
  siteTitle: 'Six Kids Crafts',
  backgroundMediaId: null,
  backgroundImage: null,
  contactEmail: 'hello@sixkidscrafts.com',
  etsyUrl: 'https://etsy.com/shop/sixkids',
  instagramUrl: null,
  facebookUrl: null,
}

export const sampleArticles = [
  {
    id: 1,
    title: 'First post',
    slug: 'first-post',
    bodyMd: '# Hello\n\nSome **bold** text.',
    published: true,
    publishedAt: '2026-03-01T09:00:00Z',
    createdAt: '2026-03-01T09:00:00Z',
    featuredImage: null,
    featuredMediaId: null,
    images: [],
    mediaIds: [],
  },
]

export const sampleMedia = [
  { id: 11, assetType: 'IMAGE', url: '/uploads/a.jpg', contentType: 'image/jpeg', sizeBytes: 10, uploadedAt: '2026-01-01T00:00:00Z' },
  { id: 12, assetType: 'IMAGE', url: '/uploads/b.jpg', contentType: 'image/jpeg', sizeBytes: 20, uploadedAt: '2026-01-02T00:00:00Z' },
]

export const rowText = (needle: string) => (_content: string, element: Element | null) => {
  if (!element || element.tagName.toLowerCase() !== 'span') {
    return false
  }
  return (element.textContent ?? '').includes(needle)
}