import { useState } from 'react'
import { Check, CheckSquare, Copy, ListTodo, Square } from 'lucide-react'

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
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <ListTodo className="h-4 w-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Recommended Action Plan
              </h3>
              {completedCount > 0 && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  {completedCount}/{actions.length} Done
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Concrete operational steps derived from the analysis
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopyActions}
          className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition active:scale-95"
          title="Copy actions list"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-emerald-700 font-semibold">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 text-slate-500" />
              <span>Copy Steps</span>
            </>
          )}
        </button>
      </div>

      {/* Action items checklist */}
      <div className="mt-5 space-y-2.5">
        {actions.map((action, idx) => {
          const isDone = !!completed[idx]
          const isHighPriority = idx === 0

          return (
            <div
              key={idx}
              onClick={() => toggleAction(idx)}
              className={`group flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all select-none ${
                isDone
                  ? 'border-slate-200/60 bg-slate-50/50 text-slate-400'
                  : 'border-slate-100 bg-slate-50/60 text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/15'
              }`}
            >
              <div className="mt-0.5 shrink-0 text-slate-400 group-hover:text-emerald-600 transition">
                {isDone ? (
                  <CheckSquare className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
              </div>

              <div className="flex-1 text-xs sm:text-sm leading-relaxed">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      isHighPriority
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-slate-200/80 text-slate-700'
                    }`}
                  >
                    {isHighPriority ? 'High Priority' : `Action ${idx + 1}`}
                  </span>
                </div>
                <p className={isDone ? 'line-through text-slate-400' : 'text-slate-800 font-medium'}>
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
