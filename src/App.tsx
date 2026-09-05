import { Link, Route, Routes } from 'react-router-dom'
import GalleryPage from './pages/GalleryPage'
import ContactPage from './pages/ContactPage'
import AdminPage from './pages/AdminPage'

function App() {
  return (
    <>
      <header className="site-header">
        <Link to="/" className="site-title">
          Six Kids Crafts
        </Link>
        <nav className="site-nav">
          <Link to="/">Gallery</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/admin">Admin</Link>
        </nav>
      </header>
      <main className="site-main">
        <Routes>
          <Route path="/" element={<GalleryPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
    </>
  )
}

export default App