import { Clock, Trash2, X, ChevronRight, MessageSquare } from 'lucide-react'
import type { HistoryItem } from '../types'

type SidebarHistoryProps = {
  isOpen: boolean
  onClose: () => void
  history: HistoryItem[]
  activeId: string | null
  onSelect: (item: HistoryItem) => void
  onClear: () => void
  onSelectPrompt: (prompt: string) => void
}

const starterPromptsByCategory = [
  {
    category: 'Sales & Revenue',
    prompts: [
      'What changed in sales from 2026-09-01 to 2026-09-07?',
      'Which products had the lowest sales last week?',
      'Which sales branch generated the highest gross revenue?',
    ],
  },
  {
    category: 'Inventory & Operations',
    prompts: [
      'Are there any low-stock products I should review?',
      'What are our top 5 products by available stock?',
      'Which categories have impending stockout risks?',
    ],
  },
]

export function SidebarHistory({
  isOpen,
  onClose,
  history,
  activeId,
  onSelect,
  onClear,
  onSelectPrompt,
}: SidebarHistoryProps) {
  if (!isOpen) return null

  return (
    <aside className="fixed inset-y-0 right-0 z-40 flex w-full max-w-sm flex-col bg-white shadow-2xl border-l border-slate-200 transition-transform animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 p-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-emerald-700" />
          <h2 className="text-sm font-semibold text-slate-900">History</h2>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {history.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 transition"
              title="Clear history"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
              <Clock className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-slate-700">No queries yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[220px]">
              Your past questions and results will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Recent
            </p>
            <div className="space-y-1.5">
              {history.map((item) => {
                const isActive = item.id === activeId
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelect(item)
                      onClose()
                    }}
                    className={`group w-full text-left p-3 rounded-xl transition border text-xs leading-relaxed flex items-start justify-between gap-2 ${
                      isActive
                        ? 'border-emerald-500/50 bg-emerald-50/70 text-emerald-950 font-medium shadow-xs'
                        : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100/80 text-slate-700 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex-1">
                      <p className="line-clamp-2">{item.question}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {new Date(item.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition shrink-0 mt-0.5" />
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Starter Prompts */}
        <div className="border-t border-slate-100 pt-5 space-y-4">
          <div className="flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
            <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Suggested Questions
            </p>
          </div>
          {starterPromptsByCategory.map((cat) => (
            <div key={cat.category} className="space-y-1.5">
              <span className="text-[11px] font-medium text-slate-500">{cat.category}</span>
              <div className="space-y-1">
                {cat.prompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => {
                      onSelectPrompt(prompt)
                      onClose()
                    }}
                    className="w-full text-left p-2.5 rounded-lg border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/40 text-[12px] text-slate-600 hover:text-emerald-900 transition leading-snug"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
