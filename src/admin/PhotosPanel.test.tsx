import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import PhotosPanel from './PhotosPanel'
import { jsonResponse, mockFetch, restoreFetch, sampleMedia } from '../test/testUtils'

describe('PhotosPanel', () => {
  beforeEach(() => {
    restoreFetch()
    sessionStorage.setItem('adminAuth', 'YWRtaW46cHc=')
  })

  it('shows the photo library and toggles selections', async () => {
    mockFetch(() => jsonResponse(sampleMedia))
    render(<PhotosPanel />)
    await screen.findByAltText('Library photo 11')
    expect(screen.getByText('0 selected')).toBeInTheDocument()
    fireEvent.click(screen.getByAltText('Library photo 11'))
    expect(screen.getByText('1 selected')).toBeInTheDocument()
    fireEvent.click(screen.getByAltText('Library photo 11'))
    expect(screen.getByText('0 selected')).toBeInTheDocument()
    fireEvent.click(screen.getByAltText('Library photo 12'))
    expect(screen.getByText('1 selected')).toBeInTheDocument()
  })
})