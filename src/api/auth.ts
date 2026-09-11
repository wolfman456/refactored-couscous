import { apiFetch } from './client'

export interface ChangePasswordForm {
  currentPassword: string
  newPassword: string
}

export function changePassword(form: ChangePasswordForm): Promise<{ username: string }> {
  return apiFetch<{ username: string }>('/api/admin/change-password', {
    method: 'POST',
    body: JSON.stringify(form),
    auth: true,
  })
}