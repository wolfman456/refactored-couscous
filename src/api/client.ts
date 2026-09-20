const AUTH_KEY = 'adminAuth'

export const UNAUTHORIZED_EVENT = 'sixkids:unauthorized'

export interface RequestOptions {
  method?: string
  body?: BodyInit
  auth?: boolean
}

interface ErrorBody {
  message?: string
  error?: string
  fieldErrors?: { message?: string }[]
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function errorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as ErrorBody
    if (typeof body.message === 'string' && body.message.length > 0) {
      return body.message
    }
    if (typeof body.error === 'string' && body.error.length > 0) {
      return body.error
    }
    const first = body.fieldErrors?.[0]?.message
    if (typeof first === 'string' && first.length > 0) {
      return first
    }
  } catch {
    // body is not JSON; fall through
  }
  return `Request failed with status ${res.status}`
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
  const bytes = new TextEncoder().encode(`${username}:${password}`)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
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
    window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT))
    throw new UnauthorizedError()
  }
  if (!res.ok) {
    throw new ApiError(res.status, await errorMessage(res))
  }
  if (res.status === 204) {
    return undefined as T
  }
  return (await res.json()) as T
}