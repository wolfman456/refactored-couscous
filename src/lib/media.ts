const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i

const THUMB_WIDTH = 480
const FULL_WIDTH = 2000

export function isVideoUrl(url: string): boolean {
  return VIDEO_EXT.test(url)
}

/**
 * Builds a `srcSet` that offers the small grid thumbnail alongside the full display
 * image. Returns undefined when there is no separate thumbnail to prefer.
 */
export function imageSrcSet(full: string, thumbnail?: string | null): string | undefined {
  if (!thumbnail || thumbnail === full) {
    return undefined
  }
  return `${thumbnail} ${THUMB_WIDTH}w, ${full} ${FULL_WIDTH}w`
}
