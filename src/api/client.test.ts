import { beforeEach, describe, expect, it } from 'vitest'
import {
  ApiError,
  UNAUTHORIZED_EVENT,
  UnauthorizedError,
  apiFetch,
  encodeBasic,
  getCredential,
  getUsername,
  hasCredential,
  setCredential,
} from './client'
import { jsonResponse, mockFetch, noContent, restoreFetch } from '../test/testUtils'

describe('api/client', () => {
  beforeEach(() => {
    restoreFetch()
    setCredential(null)
  })

  it('GETs and parses json', async () => {
    mockFetch((url) => {
      expect(url).toBe('/api/gallery')
      return jsonResponse({ ok: true })
    })
    await expect(apiFetch('/api/gallery')).resolves.toEqual({ ok: true })
  })

  it('sends JSON bodies for non-FormData payloads', async () => {
    setCredential(encodeBasic('admin', 'pw'))
    const fn = mockFetch((_url, init) => {
      expect(init?.method).toBe('PUT')
      expect((init?.headers as Record<string, string>)['Content-Type']).toBe('application/json')
      expect(init?.body).toBe('{"a":1}')
      return jsonResponse({ done: true })
    })
    await apiFetch('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify({ a: 1 }),
      auth: true,
    })
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('does not set Content-Type for FormData', async () => {
    setCredential(encodeBasic('admin', 'pw'))
    const fd = new FormData()
    fd.append('file', new File(['x'], 'x.png'))
    const fn = mockFetch((_url, init) => {
      expect((init?.headers as Record<string, string>)['Content-Type']).toBeUndefined()
      expect(init?.body).toBeInstanceOf(FormData)
      return jsonResponse({ id: 1 })
    })
    await apiFetch('/api/admin/media', { method: 'POST', body: fd, auth: true })
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('throws ApiError on non-ok responses', async () => {
    mockFetch(() => jsonResponse({}, 500))
    await expect(apiFetch('/api/gallery')).rejects.toBeInstanceOf(ApiError)
  })

  it('resolves undefined for 204', async () => {
    setCredential(encodeBasic('admin', 'pw'))
    mockFetch(() => noContent())
    await expect(apiFetch('/api/gallery/1', { method: 'DELETE', auth: true })).resolves.toBeUndefined()
  })

  it('throws UnauthorizedError when no credential and auth requested', async () => {
    const fn = mockFetch(() => jsonResponse({}))
    await expect(apiFetch('/api/admin/gallery', { auth: true })).rejects.toBeInstanceOf(
      UnauthorizedError,
    )
    expect(fn).not.toHaveBeenCalled()
  })

  it('clears stored credential on 401', async () => {
    setCredential(encodeBasic('admin', 'pw'))
    mockFetch(() => jsonResponse({}, 401))
    await expect(apiFetch('/api/admin/gallery', { auth: true })).rejects.toBeInstanceOf(
      UnauthorizedError,
    )
    expect(hasCredential()).toBe(false)
  })

  it('sends the Basic auth header when a credential is stored', async () => {
    setCredential(encodeBasic('admin', 'pw'))
    const fn = mockFetch((_url, init) => {
      expect((init?.headers as Record<string, string>).Authorization).toBe(
        'Basic YWRtaW46cHc=',
      )
      return jsonResponse({})
    })
    await apiFetch('/api/admin/gallery', { auth: true })
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('encodeBasic base64 encodes credentials', () => {
    expect(encodeBasic('admin', 'pw')).toBe('YWRtaW46cHc=')
  })

  it('tracks credentials via sessionStorage', () => {
    expect(hasCredential()).toBe(false)
    setCredential('abc')
    expect(hasCredential()).toBe(true)
    expect(getCredential()).toBe('abc')
    setCredential(null)
    expect(hasCredential()).toBe(false)
  })

  it('reads the username from the stored Basic credential', () => {
    expect(getUsername()).toBeNull()
    setCredential(encodeBasic('admin', 'pw'))
    expect(getUsername()).toBe('admin')
    setCredential('not base64')
    expect(getUsername()).toBeNull()
  })

  it('surfaces the server error from the {error} body', async () => {
    setCredential(encodeBasic('admin', 'pw'))
    mockFetch(() => jsonResponse({ error: 'Current password is incorrect' }, 400))
    await expect(apiFetch('/api/admin/change-password', { method: 'POST', auth: true })).rejects.toMatchObject({
      name: 'ApiError',
      status: 400,
      message: 'Current password is incorrect',
    })
  })

  it('surfaces the server message from the {message} body', async () => {
    setCredential(encodeBasic('admin', 'pw'))
    mockFetch(() => jsonResponse({ message: 'Title is required' }, 400))
    await expect(apiFetch('/api/admin/gallery', { auth: true })).rejects.toMatchObject({
      message: 'Title is required',
    })
  })

  it('surfaces the first field error from the fieldErrors body', async () => {
    setCredential(encodeBasic('admin', 'pw'))
    mockFetch(() =>
      jsonResponse({ status: 400, fieldErrors: [{ field: 'newPassword', message: 'New password must be at least 8 characters' }] }, 400),
    )
    await expect(apiFetch('/api/admin/change-password', { method: 'POST', auth: true })).rejects.toMatchObject({
      message: 'New password must be at least 8 characters',
    })
  })

  it('falls back to a generic message when the body is not parseable', async () => {
    mockFetch(() => ({ ...jsonResponse({}, 500), json: () => Promise.reject(new Error('bad json')) }) as Response)
    await expect(apiFetch('/api/gallery')).rejects.toMatchObject({
      name: 'ApiError',
      status: 500,
      message: 'Request failed with status 500',
    })
  })

  it('dispatches the unauthorized event on a 401', async () => {
    setCredential(encodeBasic('admin', 'pw'))
    const events: string[] = []
    window.addEventListener(UNAUTHORIZED_EVENT, () => events.push(UNAUTHORIZED_EVENT))
    mockFetch(() => jsonResponse({}, 401))
    await expect(apiFetch('/api/admin/gallery', { auth: true })).rejects.toBeInstanceOf(UnauthorizedError)
    expect(events).toEqual([UNAUTHORIZED_EVENT])
  })

  it('encodeBasic is UTF-8 safe for non-Latin-1 characters', () => {
    const token = encodeBasic('café', 'päss')
    const decoded = new TextDecoder().decode(
      Uint8Array.from(atob(token), (c) => c.charCodeAt(0)),
    )
    expect(decoded).toBe('café:päss')
    expect(() => encodeBasic('user', 'mot de passe é')).not.toThrow()
  })
})