import { describe, expect, it } from 'vitest'
import { imageSrcSet, isVideoUrl } from './media'

describe('isVideoUrl', () => {
  it('detects video extensions and ignores images', () => {
    expect(isVideoUrl('/uploads/a.mp4')).toBe(true)
    expect(isVideoUrl('/uploads/a.MOV')).toBe(true)
    expect(isVideoUrl('/uploads/a.jpg')).toBe(false)
  })
})

describe('imageSrcSet', () => {
  it('offers the thumbnail and full image as width candidates', () => {
    expect(imageSrcSet('/uploads/a.jpg', '/uploads/a_thumb.jpg')).toBe(
      '/uploads/a_thumb.jpg 480w, /uploads/a.jpg 2000w',
    )
  })

  it('returns undefined when there is no distinct thumbnail', () => {
    expect(imageSrcSet('/uploads/a.jpg')).toBeUndefined()
    expect(imageSrcSet('/uploads/a.jpg', null)).toBeUndefined()
    expect(imageSrcSet('/uploads/a.jpg', '/uploads/a.jpg')).toBeUndefined()
  })
})
