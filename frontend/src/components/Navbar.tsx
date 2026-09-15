import { BarChart3, History, PlusCircle, Share2 } from 'lucide-react'

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
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md gradient-border transition-all">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={onReset}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-800 via-emerald-700 to-teal-600 shadow-md shadow-emerald-900/10 text-white">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-slate-900 sm:text-base text-sm">
                Sales Assistant
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 hidden sm:block">
              Sales & Inventory Intelligence
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Connection Status */}
          <div className="hidden md:flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/70 px-3 py-1 text-xs font-semibold text-emerald-800">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span>Connected</span>
          </div>

          {hasResult && (
            <>
              <button
                type="button"
                onClick={onExport}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition active:scale-95"
                title="Copy full brief to clipboard"
              >
                <Share2 className="h-3.5 w-3.5 text-slate-500" />
                <span className="hidden sm:inline">Export</span>
              </button>

              <button
                type="button"
                onClick={onReset}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition active:scale-95"
                title="Start a new analysis"
              >
                <PlusCircle className="h-3.5 w-3.5 text-slate-500" />
                <span className="hidden sm:inline">New</span>
              </button>
            </>
          )}

          {/* History Toggle */}
          <button
            type="button"
            onClick={onToggleHistory}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition active:scale-95 ${
              isHistoryOpen
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'border border-slate-200 bg-white text-slate-700 shadow-2xs hover:bg-slate-50'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>History</span>
            {historyCount > 0 && (
              <span
                className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  isHistoryOpen ? 'bg-white text-emerald-900' : 'bg-slate-100 text-slate-700'
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
