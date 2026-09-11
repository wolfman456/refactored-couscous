import { apiFetch } from './client'

export interface ArticleDraft {
  title: string
  bodyMd: string
}

export function describeImage(file: File): Promise<{ description: string }> {
  const fd = new FormData()
  fd.append('file', file)
  return apiFetch<{ description: string }>('/api/admin/ai/describe-image', {
    method: 'POST',
    body: fd,
    auth: true,
  })
}

export function draftArticle(input: {
  topic: string
  mediaIds: number[]
}): Promise<ArticleDraft> {
  return apiFetch<ArticleDraft>('/api/admin/ai/draft-article', {
    method: 'POST',
    body: JSON.stringify(input),
    auth: true,
  })
}