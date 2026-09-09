import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchArticle, type Article } from '../api/articles'
import Markdown from '../components/Markdown'
import { formatDate } from './articleUtils'

export default function ArticlePage() {
  const { slug } = useParams()
  const [article, setArticle] = useState<Article | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(!!slug)

  useEffect(() => {
    if (!slug) {
      return
    }
    fetchArticle(slug)
      .then((article) => {
        setError(null)
        setArticle(article)
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Failed to load article'),
      )
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return <p className="gallery-note">Loading article…</p>
  }

  if (error || !article) {
    return (
      <section className="article">
        <p className="gallery-note gallery-error">{error ?? 'Article not found.'}</p>
        <p className="gallery-note">
          <Link to="/articles">Back to articles</Link>
        </p>
      </section>
    )
  }

  return (
    <article className="article">
      <p className="gallery-note-back">
        <Link to="/articles">← All articles</Link>
      </p>
      <h1 className="article-title">{article.title}</h1>
      {article.publishedAt && (
        <p className="article-date">
          <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
        </p>
      )}
      {article.featuredImage && (
        <img src={article.featuredImage} alt={article.title} className="article-hero" />
      )}
      <Markdown source={article.bodyMd} />
      {article.images.length > 1 && (
        <div className="article-thumbs">
          {article.images.map((url) => (
            <img key={url} src={url} alt="" className="article-thumb" />
          ))}
        </div>
      )}
    </article>
  )
}