const AUTH_KEY = 'adminAuth'

export interface RequestOptions {
  method?: string
  body?: BodyInit
  auth?: boolean
}

export class ApiError extends Error {
  status: number

  constructor(status: number) {
    super(`Request failed with status ${status}`)
    this.name = 'ApiError'
    this.status = status
  }
}

export class UnauthorizedError extends Error {
  constructor() {
    super('Not logged in')
    this.name = 'UnauthorizedError'
  }
}

export function getCredential(): string | null {
  return sessionStorage.getItem(AUTH_KEY)
}

export function hasCredential(): boolean {
  return getCredential() !== null
}

export function setCredential(token: string | null): void {
  if (token === null) {
    sessionStorage.removeItem(AUTH_KEY)
  } else {
    sessionStorage.setItem(AUTH_KEY, token)
  }
}

export function encodeBasic(username: string, password: string): string {
  return btoa(`${username}:${password}`)
}

export function getUsername(): string | null {
  const token = getCredential()
  if (token === null) {
    return null
  }
  try {
    return atob(token).split(':')[0] ?? null
  } catch {
    return null
  }
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: HeadersInit = {}
  if (options.auth) {
    const token = getCredential()
    if (token === null) {
      throw new UnauthorizedError()
    }
    headers.Authorization = `Basic ${token}`
  }
  if (options.body !== undefined && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  const res = await fetch(path, {
    method: options.method ?? 'GET',
    headers,
    body: options.body,
  })
  if (res.status === 401 && options.auth) {
    setCredential(null)
    throw new UnauthorizedError()
  }
  if (!res.ok) {
    throw new ApiError(res.status)
  }
  if (res.status === 204) {
    return undefined as T
  }
  return (await res.json()) as T
}