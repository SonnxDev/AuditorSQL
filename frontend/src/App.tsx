import { useState } from 'react'
import { ScanSearch, GitCompare } from 'lucide-react'
import AppLayout from './layouts/AppLayout'
import SimpleAudit from './pages/SimpleAudit'
import CompareAudit from './pages/CompareAudit'

type Tab = 'simple' | 'compare'

const TABS: { id: Tab; label: string; icon: typeof ScanSearch }[] = [
  { id: 'simple', label: 'Auditoría Simple', icon: ScanSearch },
  { id: 'compare', label: 'Comparación de Agentes', icon: GitCompare },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('simple')

  return (
    <AppLayout>
      <div className="flex gap-1 mb-6 border-b border-surface-800">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === id
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-surface-400 hover:text-surface-200'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>
      {tab === 'simple' ? <SimpleAudit /> : <CompareAudit />}
    </AppLayout>
  )
}
