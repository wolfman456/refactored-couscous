import { useState } from 'react'
import { hasCredential, setCredential } from '../api/client'
import AdminLogin from '../admin/AdminLogin'
import PhotosPanel from '../admin/PhotosPanel'
import GalleryPanel from '../admin/GalleryPanel'
import ArticlesPanel from '../admin/ArticlesPanel'
import TabsPanel from '../admin/TabsPanel'
import SitePanel from '../admin/SitePanel'
import PasswordPanel from '../admin/PasswordPanel'
import { useSeo } from '../lib/seo'

type Panel = 'photos' | 'gallery' | 'articles' | 'tabs' | 'site' | 'account'

const PANELS: { key: Panel; label: string }[] = [
  { key: 'photos', label: 'Photos' },
  { key: 'gallery', label: 'Gallery' },
  { key: 'articles', label: 'Articles' },
  { key: 'tabs', label: 'Tabs' },
  { key: 'site', label: 'Site' },
  { key: 'account', label: 'Account' },
]

export default function AdminPage() {
  useSeo({ title: 'Content manager · Six Kids Crafts', noindex: true })
  const [authed, setAuthed] = useState(hasCredential())
  const [panel, setPanel] = useState<Panel>('photos')

  if (!authed) {
    return <AdminLogin onSuccess={() => setAuthed(true)} />
  }

  return (
    <section className="admin">
      <div className="admin-bar">
        <h1>Content manager</h1>
        <nav className="admin-tabs" aria-label="Manager sections">
          {PANELS.map((entry) => (
            <button
              key={entry.key}
              type="button"
              className={`admin-tab${panel === entry.key ? ' admin-tab-active' : ''}`}
              onClick={() => setPanel(entry.key)}
              aria-pressed={panel === entry.key}
            >
              {entry.label}
            </button>
          ))}
        </nav>
        <button
          type="button"
          className="admin-logout"
          onClick={() => {
            setCredential(null)
            setAuthed(false)
          }}
        >
          Log out
        </button>
      </div>
      <div className="admin-panel">
        {panel === 'photos' && <PhotosPanel />}
        {panel === 'gallery' && <GalleryPanel />}
        {panel === 'articles' && <ArticlesPanel />}
        {panel === 'tabs' && <TabsPanel />}
        {panel === 'site' && <SitePanel />}
        {panel === 'account' && <PasswordPanel />}
      </div>
    </section>
  )
}