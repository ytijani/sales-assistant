import { useState } from 'react'
import { Check, CheckSquare, Copy, ListTodo } from 'lucide-react'

type ActionPlanProps = {
  actions: string[]
}

export function ActionPlan({ actions }: ActionPlanProps) {
  const [completed, setCompleted] = useState<Record<number, boolean>>({})
  const [copied, setCopied] = useState(false)

  if (!actions || actions.length === 0) return null

  const toggleAction = (idx: number) => {
    setCompleted((prev) => ({ ...prev, [idx]: !prev[idx] }))
  }

  const handleCopyActions = async () => {
    try {
      const text = actions.map((a, i) => `${i + 1}. ${a}`).join('\n')
      await navigator.clipboard.writeText(`Recommended Next Steps:\n${text}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Ignore
    }
  }

  const completedCount = Object.values(completed).filter(Boolean).length

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm transition-all hover:shadow-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <ListTodo className="h-4 w-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Recommended Action Plan
              </h3>
              {completedCount > 0 && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                  {completedCount}/{actions.length} Done
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Actionable business decisions driven by the analysis
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopyActions}
          className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition active:scale-95"
          title="Copy actions list"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-600" />
              <span className="text-emerald-700 font-semibold">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 text-slate-500" />
              <span>Copy Steps</span>
            </>
          )}
        </button>
      </div>

      {/* Action items checklist */}
      <div className="mt-4 space-y-2.5">
        {actions.map((action, idx) => {
          const isDone = !!completed[idx]
          const isHighPriority = idx === 0

          return (
            <div
              key={idx}
              onClick={() => toggleAction(idx)}
              className={`group flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition select-none ${
                isDone
                  ? 'border-emerald-200 bg-emerald-50/40 text-slate-400 line-through'
                  : 'border-slate-100 bg-slate-50/60 text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/20'
              }`}
            >
              <button
                type="button"
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                  isDone
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-slate-300 bg-white group-hover:border-emerald-500'
                }`}
              >
                {isDone && <CheckSquare className="h-3.5 w-3.5" />}
              </button>

              <div className="flex-1 text-xs sm:text-sm leading-relaxed">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`rounded px-1.5 py-0.2 text-[10px] font-bold uppercase tracking-wider ${
                      isHighPriority
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-slate-200/70 text-slate-700'
                    }`}
                  >
                    {isHighPriority ? 'High Priority' : `Step ${idx + 1}`}
                  </span>
                </div>
                <p className={isDone ? 'line-through text-slate-400' : 'text-slate-800'}>
                  {action}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
