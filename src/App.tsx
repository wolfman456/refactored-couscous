import { Link, Navigate, Route, Routes } from 'react-router-dom'
import GalleryPage from './pages/GalleryPage'
import GalleryItemPage from './pages/GalleryItemPage'
import ArticlesPage from './pages/ArticlesPage'
import ArticlePage from './pages/ArticlePage'
import ContactPage from './pages/ContactPage'
import AdminPage from './pages/AdminPage'
import { SiteSettingsProvider, useSiteSettings } from './components/SiteSettingsContext'

function Shell() {
  const settings = useSiteSettings()
  const title = settings?.siteTitle || 'Six Kids Crafts'
  const background = settings?.backgroundImage
  return (
    <div className="page" style={background ? { backgroundImage: `url("${background}")` } : undefined}>
      <header className="site-header">
        <Link to="/" className="site-title">
          {title}
        </Link>
        <nav className="site-nav">
          <Link to="/">Gallery</Link>
          <Link to="/articles">Articles</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/admin">Admin</Link>
        </nav>
      </header>
      <main className="site-main">
        <Routes>
          <Route path="/" element={<GalleryPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/gallery/:id" element={<GalleryItemPage />} />
          <Route path="/articles" element={<ArticlesPage />} />
          <Route path="/articles/:slug" element={<ArticlePage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <SiteSettingsProvider>
      <Shell />
    </SiteSettingsProvider>
  )
}

export default App