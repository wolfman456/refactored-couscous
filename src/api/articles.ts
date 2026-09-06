import { apiFetch } from './client'

export interface ArticleSummary {
  id: number
  title: string
  slug: string
  publishedAt: string | null
  featuredImage: string | null
  images: string[]
}

export interface Article extends ArticleSummary {
  bodyMd: string
  published: boolean
  createdAt: string
  featuredMediaId: number | null
  mediaIds: number[]
}

export interface ArticleForm {
  title: string
  slug: string
  bodyMd: string
  featuredMediaId: number | null
  published: boolean
  mediaIds: number[]
}

export function fetchArticles(): Promise<ArticleSummary[]> {
  return apiFetch<ArticleSummary[]>('/api/articles')
}

export function fetchArticle(slug: string): Promise<Article> {
  return apiFetch<Article>(`/api/articles/${slug}`)
}

export function fetchAdminArticles(): Promise<Article[]> {
  return apiFetch<Article[]>('/api/admin/articles', { auth: true })
}

export function saveArticle(id: number | null, form: ArticleForm): Promise<Article> {
  const method = id === null ? 'POST' : 'PUT'
  return apiFetch<Article>(id === null ? '/api/admin/articles' : `/api/admin/articles/${id}`, {
    method,
    body: JSON.stringify(form),
    auth: true,
  })
}

export function deleteArticle(id: number): Promise<void> {
  return apiFetch<void>(`/api/admin/articles/${id}`, { method: 'DELETE', auth: true })
}