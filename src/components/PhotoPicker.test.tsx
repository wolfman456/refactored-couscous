import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import PhotoPicker from './PhotoPicker'
import { jsonResponse, mockFetch, noContent, restoreFetch, sampleMedia } from '../test/testUtils'

describe('PhotoPicker', () => {
  beforeEach(() => {
    restoreFetch()
    sessionStorage.setItem('adminAuth', 'YWRtaW46cHc=')
  })

  const fetchMediaMock = (initialList: typeof sampleMedia = sampleMedia) => {
    const listRef = { current: [...initialList] }
    const fn = mockFetch((url, init) => {
      if (url === '/api/admin/media' && init?.method === 'POST') {
        const created = { id: 13, assetType: 'IMAGE', url: '/uploads/new.jpg', contentType: 'image/jpeg', sizeBytes: 1, uploadedAt: '2026-01-03T00:00:00Z' }
        listRef.current = [...listRef.current, created]
        return jsonResponse(created)
      }
      if (url.startsWith('/api/admin/media/') && init?.method === 'DELETE') {
        return jsonResponse({}, 200)
      }
      return jsonResponse(listRef.current)
    })
    return fn
  }

  it('shows loading then the photo grid', async () => {
    fetchMediaMock()
    render(<PhotoPicker selectedIds={[]} onToggle={() => undefined} />)
    expect(screen.getByText('Loading photos…')).toBeInTheDocument()
    await screen.findByAltText('Library photo 11')
    expect(screen.getAllByRole('button', { name: /Library photo/ })).toHaveLength(2)
  })

  it('shows thumbnails in the library grid when available', async () => {
    fetchMediaMock()
    render(<PhotoPicker selectedIds={[]} onToggle={() => undefined} />)
    expect((await screen.findByAltText('Library photo 11')).getAttribute('src')).toBe(
      '/uploads/a_thumb.jpg',
    )
    expect(screen.getByAltText('Library photo 12').getAttribute('src')).toBe('/uploads/b.jpg')
  })

  it('shows an empty message when the library is empty', async () => {
    fetchMediaMock([])
    render(<PhotoPicker selectedIds={[]} onToggle={() => undefined} />)
    expect(await screen.findByText('No photos in the library yet.')).toBeInTheDocument()
  })

  it('shows an error and can retry', async () => {
    const fn = mockFetch(() => jsonResponse({}, 500))
    render(<PhotoPicker selectedIds={[]} onToggle={() => undefined} />)
    expect(await screen.findByText('Request failed with status 500')).toBeInTheDocument()
    fn.mockImplementation(async () => jsonResponse(sampleMedia))
    fireEvent.click(screen.getByText('Retry'))
    await screen.findByAltText('Library photo 11')
  })

  it('toggles a selected photo and reports the count', async () => {
    fetchMediaMock()
    const toggled: number[] = []
    render(
      <PhotoPicker
        selectedIds={[11]}
        onToggle={(id) => toggled.push(id)}
      />,
    )
    await screen.findByAltText('Library photo 11')
    expect(screen.getByText('1 selected')).toBeInTheDocument()
    fireEvent.click(screen.getByAltText('Library photo 12'))
    expect(toggled).toEqual([12])
  })

  it('uploads a file and auto-selects the new media', async () => {
    const fn = fetchMediaMock()
    const toggled: number[] = []
    render(<PhotoPicker selectedIds={[]} onToggle={(id) => toggled.push(id)} />)
    await screen.findByAltText('Library photo 11')
    const input = screen.getByTestId('picker-file-input')
    fireEvent.change(input, { target: { files: [new File(['x'], 'new.png')] } })
    await screen.findByAltText('Library photo 13')
    expect(toggled).toEqual([13])
    expect(fn).toHaveBeenCalledWith('/api/admin/media', expect.objectContaining({ method: 'POST' }))
  })

  it('removes a photo and refreshes the grid', async () => {
    const fn = mockFetch((url, init) => {
      if (url === '/api/admin/media/11' && init?.method === 'DELETE') {
        return noContent()
      }
      return jsonResponse(sampleMedia)
    })
    render(<PhotoPicker selectedIds={[]} onToggle={() => undefined} />)
    await screen.findByAltText('Library photo 11')
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0])
    await waitFor(() => expect(fn).toHaveBeenCalledWith('/api/admin/media/11', expect.objectContaining({ method: 'DELETE' })))
  })

  it('surfaces a delete failure message', async () => {
    mockFetch((url, init) => {
      if (url === '/api/admin/media/11' && init?.method === 'DELETE') {
        return jsonResponse({}, 409)
      }
      return jsonResponse(sampleMedia)
    })
    render(<PhotoPicker selectedIds={[]} onToggle={() => undefined} />)
    await screen.findByAltText('Library photo 11')
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0])
    expect(await screen.findByText('Request failed with status 409')).toBeInTheDocument()
  })

  it('opens the file dialog from the upload button', async () => {
    fetchMediaMock()
    render(<PhotoPicker selectedIds={[]} onToggle={() => undefined} />)
    await screen.findByAltText('Library photo 11')
    fireEvent.click(screen.getByRole('button', { name: 'Upload photo' }))
    expect(screen.getByText('0 selected')).toBeInTheDocument()
  })

  it('ignores an empty file selection', async () => {
    const fn = fetchMediaMock()
    render(<PhotoPicker selectedIds={[]} onToggle={() => undefined} />)
    await screen.findByAltText('Library photo 11')
    const input = screen.getByTestId('picker-file-input')
    fireEvent.change(input, { target: { files: [] } })
    expect(screen.getByRole('button', { name: 'Upload photo' })).toBeInTheDocument()
    expect(fn).not.toHaveBeenCalledWith('/api/admin/media', expect.objectContaining({ method: 'POST' }))
  })

  it('shows an upload failure message', async () => {
    mockFetch((url, init) => {
      if (url === '/api/admin/media' && init?.method === 'POST') {
        return jsonResponse({}, 500)
      }
      return jsonResponse(sampleMedia)
    })
    render(<PhotoPicker selectedIds={[]} onToggle={() => undefined} />)
    await screen.findByAltText('Library photo 11')
    const input = screen.getByTestId('picker-file-input')
    fireEvent.change(input, { target: { files: [new File(['x'], 'new.png')] } })
    expect(await screen.findByText('Request failed with status 500')).toBeInTheDocument()
  })

  it('deselects a photo when the selected asset is removed', async () => {
    const fn = mockFetch((url, init) => {
      if (url === '/api/admin/media/11' && init?.method === 'DELETE') {
        return noContent()
      }
      return jsonResponse(sampleMedia)
    })
    const toggled: number[] = []
    function Harness() {
      const [selected, setSelected] = useState<number[]>([11])
      return (
        <PhotoPicker
          selectedIds={selected}
          onToggle={(id) => {
            toggled.push(id)
            setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
          }}
        />
      )
    }
    render(<Harness />)
    await screen.findByAltText('Library photo 11')
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0])
    await waitFor(() => expect(fn).toHaveBeenCalledWith('/api/admin/media/11', expect.objectContaining({ method: 'DELETE' })))
    expect(toggled).toEqual([11])
    expect(await screen.findByText('0 selected')).toBeInTheDocument()
  })

  it('surfaces a generic message when refresh fails with a non-Error', async () => {
    mockFetch(() => {
      throw 'boom'
    })
    render(<PhotoPicker selectedIds={[]} onToggle={() => undefined} />)
    expect(await screen.findByText('Failed to load photo library')).toBeInTheDocument()
  })

  it('surfaces a generic message when upload fails with a non-Error', async () => {
    mockFetch((url, init) => {
      if (url === '/api/admin/media' && init?.method === 'POST') {
        throw 'boom'
      }
      return jsonResponse(sampleMedia)
    })
    render(<PhotoPicker selectedIds={[]} onToggle={() => undefined} />)
    await screen.findByAltText('Library photo 11')
    const input = screen.getByTestId('picker-file-input')
    fireEvent.change(input, { target: { files: [new File(['x'], 'new.png')] } })
    expect(await screen.findByText('Upload failed')).toBeInTheDocument()
  })

  it('surfaces a generic message when delete fails with a non-Error', async () => {
    mockFetch((url, init) => {
      if (url === '/api/admin/media/11' && init?.method === 'DELETE') {
        throw 'boom'
      }
      return jsonResponse(sampleMedia)
    })
    render(<PhotoPicker selectedIds={[]} onToggle={() => undefined} />)
    await screen.findByAltText('Library photo 11')
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0])
    expect(await screen.findByText('Delete failed')).toBeInTheDocument()
  })

  it('only shows background controls when a handler is provided', async () => {
    fetchMediaMock()
    const { rerender } = render(<PhotoPicker selectedIds={[]} onToggle={() => undefined} />)
    await screen.findByAltText('Library photo 11')
    expect(screen.queryByRole('button', { name: 'Set background' })).not.toBeInTheDocument()
    rerender(
      <PhotoPicker
        selectedIds={[]}
        onToggle={() => undefined}
        backgroundId={11}
        onSetBackground={() => undefined}
      />,
    )
    expect(screen.getByRole('button', { name: '✓ Background' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Set background' })).toHaveLength(1)
  })

  it('reports setting and clearing the background', async () => {
    fetchMediaMock()
    const calls: (number | null)[] = []
    const { rerender } = render(
      <PhotoPicker
        selectedIds={[]}
        onToggle={() => undefined}
        backgroundId={null}
        onSetBackground={(id) => calls.push(id)}
      />,
    )
    await screen.findByAltText('Library photo 11')
    fireEvent.click(screen.getAllByRole('button', { name: 'Set background' })[0])
    rerender(
      <PhotoPicker
        selectedIds={[]}
        onToggle={() => undefined}
        backgroundId={11}
        onSetBackground={(id) => calls.push(id)}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: '✓ Background' }))
    expect(calls).toEqual([11, null])
  })
})