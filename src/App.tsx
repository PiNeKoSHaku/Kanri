import { useState } from 'react'
import { OwnedPage } from './components/OwnedPage'
import { SettingsPage } from './components/SettingsPage'
import { ZukanPage } from './components/ZukanPage'

const TABS = [
  { id: 'owned', label: '所持' },
  { id: 'zukan', label: '図鑑' },
  { id: 'settings', label: '設定' },
] as const
type Tab = (typeof TABS)[number]['id']

export default function App() {
  const [tab, setTab] = useState<Tab>('owned')
  return (
    <>
      <header className="appbar">
        <h1>モンスト所持管理</h1>
      </header>
      <main>
        {tab === 'owned' && <OwnedPage />}
        {tab === 'zukan' && <ZukanPage />}
        {tab === 'settings' && <SettingsPage />}
      </main>
      <nav className="tabbar">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>
    </>
  )
}
