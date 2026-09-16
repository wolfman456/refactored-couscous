const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i

export function isVideoUrl(url: string): boolean {
  return VIDEO_EXT.test(url)
}