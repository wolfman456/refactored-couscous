import { apiFetch } from './client'

export interface SiteSettings {
  siteTitle: string
  backgroundMediaId: number | null
  backgroundImage: string | null
  contactEmail: string | null
  etsyUrl: string | null
  instagramUrl: string | null
  facebookUrl: string | null
}

export interface SettingsUpdateForm {
  siteTitle?: string
  backgroundMediaId?: number | null
  contactEmail?: string
  etsyUrl?: string
  instagramUrl?: string
  facebookUrl?: string
}

export function fetchSettings(): Promise<SiteSettings> {
  return apiFetch<SiteSettings>('/api/settings')
}

export function fetchAdminSettings(): Promise<SiteSettings> {
  return apiFetch<SiteSettings>('/api/admin/settings', { auth: true })
}

export function updateSettings(form: SettingsUpdateForm): Promise<SiteSettings> {
  return apiFetch<SiteSettings>('/api/admin/settings', {
    method: 'PUT',
    body: JSON.stringify(form),
    auth: true,
  })
}