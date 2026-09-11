import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import PasswordPanel from './PasswordPanel'
import { jsonResponse, mockFetch, restoreFetch } from '../test/testUtils'

describe('PasswordPanel', () => {
  beforeEach(() => {
    restoreFetch()
    sessionStorage.clear()
    sessionStorage.setItem('adminAuth', 'YWRtaW46cHc=')
  })

  it('changes the password and updates the stored credential', async () => {
    const fn = mockFetch((url, init) => {
      if (url === '/api/admin/change-password' && init?.method === 'POST') {
        const body = JSON.parse(init?.body as string) as Record<string, string>
        expect(body.currentPassword).toBe('pw')
        expect(body.newPassword).toBe('newpass123')
        return jsonResponse({ username: 'admin' })
      }
      return jsonResponse({})
    })
    render(<PasswordPanel />)
    fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'pw' } })
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'newpass123' } })
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'newpass123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Change password' }))
    expect(await screen.findByText('Password updated.')).toBeInTheDocument()
    expect(fn).toHaveBeenCalledWith('/api/admin/change-password', expect.objectContaining({ method: 'POST' }))
    expect(sessionStorage.getItem('adminAuth')).toBe('YWRtaW46bmV3cGFzczEyMw==')
    expect(screen.getByLabelText('Current password')).toHaveValue('')
  })

  it('rejects a mismatched confirmation without calling the API', async () => {
    const fn = mockFetch(() => jsonResponse({}))
    render(<PasswordPanel />)
    fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'pw' } })
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'newpass123' } })
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'different' } })
    fireEvent.click(screen.getByRole('button', { name: 'Change password' }))
    expect(
      await screen.findByText('New password does not match the confirmation'),
    ).toBeInTheDocument()
    expect(fn).not.toHaveBeenCalled()
  })

  it('shows a friendly message when the current password is rejected', async () => {
    mockFetch((url) => {
      if (url === '/api/admin/change-password') {
        return jsonResponse({ error: 'Current password is incorrect' }, 400)
      }
      return jsonResponse({})
    })
    render(<PasswordPanel />)
    fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'wrong' } })
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'newpass123' } })
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'newpass123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Change password' }))
    expect(await screen.findByText('Current password is incorrect')).toBeInTheDocument()
  })

  it('surfaces other API errors by status', async () => {
    mockFetch(() => jsonResponse({}, 500))
    render(<PasswordPanel />)
    fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'pw' } })
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'newpass123' } })
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'newpass123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Change password' }))
    expect(await screen.findByText('Request failed with status 500')).toBeInTheDocument()
  })

  it('shows a generic message when the request throws a non-Error', async () => {
    mockFetch(() => {
      throw 'boom'
    })
    render(<PasswordPanel />)
    fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'pw' } })
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'newpass123' } })
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'newpass123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Change password' }))
    expect(await screen.findByText('Failed to change password')).toBeInTheDocument()
  })

  it('requires an active login', async () => {
    sessionStorage.clear()
    mockFetch(() => jsonResponse({}))
    render(<PasswordPanel />)
    fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'pw' } })
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'newpass123' } })
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'newpass123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Change password' }))
    expect(await screen.findByText('No active login')).toBeInTheDocument()
  })
})