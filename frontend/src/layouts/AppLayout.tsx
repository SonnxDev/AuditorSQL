import type { ReactNode } from 'react'
import { Database } from 'lucide-react'

interface AppLayoutProps {
  children: ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-surface-950 text-surface-200 flex flex-col">
      <nav className="flex items-center gap-2.5 px-6 h-[60px] border-b border-surface-800 shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600/20">
          <Database className="w-4 h-4 text-emerald-400" />
        </div>
        <h1 className="text-lg font-bold tracking-tight text-surface-50">
          AuditorSQL
        </h1>
      </nav>
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  )
}
