import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { fetchSettings, type SiteSettings } from '../api/settings'

export const SiteSettingsContext = createContext<SiteSettings | null>(null) // eslint-disable-line react/only-export-components

export interface SiteSettingsActions {
  refresh: () => Promise<void>
  setSettings: (settings: SiteSettings) => void
}

const noopActions: SiteSettingsActions = {
  refresh: () => Promise.resolve(),
  setSettings: () => undefined,
}

// eslint-disable-next-line react/only-export-components
const SiteSettingsActionsContext = createContext<SiteSettingsActions>(noopActions)

// eslint-disable-next-line react/only-export-components
export function useSiteSettings(): SiteSettings | null {
  return useContext(SiteSettingsContext)
}

// Lets admin screens push freshly saved settings back into the public shell so
// the header, background, and contact page update without a full page reload.
// eslint-disable-next-line react/only-export-components
export function useSiteSettingsActions(): SiteSettingsActions {
  return useContext(SiteSettingsActionsContext)
}

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings | null>(null)

  const refresh = useCallback(async () => {
    setSettings(await fetchSettings())
  }, [])

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

  const actions = useMemo<SiteSettingsActions>(
    () => ({ refresh, setSettings }),
    [refresh],
  )

  return (
    <SiteSettingsActionsContext.Provider value={actions}>
      <SiteSettingsContext.Provider value={settings}>{children}</SiteSettingsContext.Provider>
    </SiteSettingsActionsContext.Provider>
  )
}
