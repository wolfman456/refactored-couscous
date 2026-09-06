import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { fetchSettings, type SiteSettings } from '../api/settings'

const SiteSettingsContext = createContext<SiteSettings | null>(null)

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings | null>(null)

  useEffect(() => {
    let active = true
    fetchSettings()
      .then((s) => {
        if (active) {
          setSettings(s)
        }
      })
      .catch(() => {
        // Public shell keeps working with defaults while offline/misconfigured.
      })
    return () => {
      active = false
    }
  }, [])

  return <SiteSettingsContext.Provider value={settings}>{children}</SiteSettingsContext.Provider>
}

export function useSiteSettings(): SiteSettings | null {
  return useContext(SiteSettingsContext)
}