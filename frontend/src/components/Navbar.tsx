import { Database, History, RefreshCw, Share2, Sparkles } from 'lucide-react'

type NavbarProps = {
  historyCount: number
  isHistoryOpen: boolean
  onToggleHistory: () => void
  onReset: () => void
  onExport: () => void
  hasResult: boolean
}

export function Navbar({
  historyCount,
  isHistoryOpen,
  onToggleHistory,
  onReset,
  onExport,
  hasResult,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-md transition-all">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={onReset}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-500 shadow-md shadow-emerald-700/15 text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-slate-900 sm:text-base text-sm">
                Sales Assistant
              </span>
              <span className="rounded-full bg-emerald-100/70 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 tracking-wide uppercase">
                AI Copilot
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 hidden sm:block">
              Real-time Business & Sales Intelligence
            </p>
          </div>
        </div>

        {/* Status and Action Buttons */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Live DB Connection Badge */}
          <div className="hidden md:flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/60 px-2.5 py-1 text-xs font-medium text-emerald-800">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <Database className="h-3 w-3 text-emerald-600" />
            <span>PostgreSQL Verified</span>
          </div>

          {hasResult && (
            <>
              <button
                type="button"
                onClick={onExport}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 hover:text-slate-900 transition active:scale-95"
                title="Copy full brief to clipboard"
              >
                <Share2 className="h-3.5 w-3.5 text-slate-500" />
                <span className="hidden sm:inline">Export Brief</span>
              </button>

              <button
                type="button"
                onClick={onReset}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 hover:text-slate-900 transition active:scale-95"
                title="Start a new analysis"
              >
                <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
                <span className="hidden sm:inline">New Question</span>
              </button>
            </>
          )}

          {/* History Drawer Toggle Button */}
          <button
            type="button"
            onClick={onToggleHistory}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition active:scale-95 ${
              isHistoryOpen
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'border border-slate-200 bg-white text-slate-700 shadow-xs hover:bg-slate-50'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>History</span>
            {historyCount > 0 && (
              <span
                className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  isHistoryOpen ? 'bg-white text-emerald-800' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {historyCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
