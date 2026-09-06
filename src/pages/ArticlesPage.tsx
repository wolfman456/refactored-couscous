import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchArticles, type ArticleSummary } from '../api/articles'

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<ArticleSummary[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchArticles()
      .then(setArticles)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Failed to load articles'),
      )
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <p className="gallery-note">Loading articles…</p>
  }

  if (error) {
    return <p className="gallery-note gallery-error">{error}</p>
  }

  if (articles.length === 0) {
    return <p className="gallery-note">No articles yet — check back soon.</p>
  }

  return (
    <section className="articles-list">
      <h1>Notes from the shop</h1>
      {articles.map((article) => (
        <article key={article.id} className="article-card">
          <Link to={`/articles/${article.slug}`} className="article-card-link">
            {article.featuredImage && (
              <img src={article.featuredImage} alt="" className="article-card-img" />
            )}
            <div className="article-card-body">
              <h2>{article.title}</h2>
              {article.publishedAt && (
                <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
              )}
            </div>
          </Link>
        </article>
      ))}
    </section>
  )
}