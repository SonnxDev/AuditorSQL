import AuditorPanel from './components/AuditorPanel';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-slate-100 flex flex-col">
      <nav className="flex items-center px-6 h-[60px] border-b border-gray-800 shrink-0">
        <h1 className="text-lg font-bold tracking-tight">AuditorSQL</h1>
      </nav>
      <main className="flex-1">
        <AuditorPanel />
      </main>
    </div>
  );
}
