import { beforeEach, describe, expect, it } from 'vitest'
import { encodeBasic, setCredential } from './client'
import { changePassword } from './auth'
import { fetchGalleryItem } from './gallery'
import { uploadMedia } from './media'
import { jsonResponse, mockFetch, restoreFetch } from '../test/testUtils'

const item = {
  id: 1,
  title: 'Oak shelf',
  description: null,
  categoryId: null,
  categoryName: null,
  sortOrder: 1,
  published: true,
  createdAt: '2026-01-01T00:00:00Z',
  images: ['/uploads/a.jpg'],
  mediaIds: [11],
}

describe('api module wrappers', () => {
  beforeEach(() => {
    restoreFetch()
    setCredential(null)
  })

  it('fetchGalleryItem hits the public endpoint', async () => {
    const fn = mockFetch((url) => {
      expect(url).toBe('/api/gallery/1')
      return jsonResponse(item)
    })
    await expect(fetchGalleryItem(1)).resolves.toEqual(item)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('applies the stored credential for authed admin calls', async () => {
    setCredential(encodeBasic('admin', 'pw'))
    const fn = mockFetch((_url, init) => {
      expect((init?.headers as Record<string, string>).Authorization).toBe('Basic YWRtaW46cHc=')
      return jsonResponse([])
    })
    await uploadMedia(new File(['x'], 'x.png'))
    expect(fn).toHaveBeenCalledWith('/api/admin/media', expect.objectContaining({ method: 'POST' }))
  })

  it('changePassword posts the form to the admin endpoint', async () => {
    setCredential(encodeBasic('admin', 'pw'))
    const fn = mockFetch((_url, init) => {
      expect(init?.body).toBe('{"currentPassword":"pw","newPassword":"newpass123"}')
      return jsonResponse({ username: 'admin' })
    })
    await expect(changePassword({ currentPassword: 'pw', newPassword: 'newpass123' })).resolves.toEqual({
      username: 'admin',
    })
    expect(fn).toHaveBeenCalledWith(
      '/api/admin/change-password',
      expect.objectContaining({ method: 'POST' }),
    )
  })
})