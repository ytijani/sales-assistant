import { useState, useEffect } from 'react'
import { Bot, CheckCircle2, CircleDashed, Database, LineChart, Sparkles } from 'lucide-react'

const steps = [
  { label: 'Interpreting business intent & metrics', icon: Bot },
  { label: 'Synthesizing safe SQL verification query', icon: Database },
  { label: 'Querying live PostgreSQL / Supabase records', icon: Sparkles },
  { label: 'Synthesizing visualizations & strategic brief', icon: LineChart },
]

export function LoadingSkeleton() {
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev))
    }, 1800)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="space-y-6 py-4 animate-in fade-in duration-300">
      {/* Stepped progress card */}
      <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <CircleDashed className="h-5 w-5 animate-spin text-emerald-700" />
          <h3 className="text-sm font-bold text-slate-900">
            Analyst Agent in Progress...
          </h3>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, idx) => {
            const Icon = step.icon
            const isDone = idx < currentStep
            const isCurrent = idx === currentStep

            return (
              <div
                key={step.label}
                className={`flex items-center gap-2.5 rounded-xl p-3 border transition-all ${
                  isCurrent
                    ? 'border-emerald-500 bg-white shadow-xs'
                    : isDone
                      ? 'border-emerald-200 bg-emerald-100/50 text-emerald-900'
                      : 'border-slate-100 bg-slate-50/50 text-slate-400 opacity-60'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : isCurrent ? (
                  <div className="relative flex h-4 w-4 shrink-0 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <Icon className="relative h-4 w-4 text-emerald-700" />
                  </div>
                ) : (
                  <Icon className="h-4 w-4 shrink-0 text-slate-400" />
                )}
                <span className="text-xs font-medium leading-tight">{step.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Shimmer Placeholder for Executive Brief */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs animate-pulse space-y-4">
        <div className="h-4 w-32 rounded bg-slate-200" />
        <div className="h-8 w-3/4 rounded-lg bg-slate-200" />
        <div className="space-y-2 pt-2">
          <div className="h-4 w-full rounded bg-slate-100" />
          <div className="h-4 w-5/6 rounded bg-slate-100" />
          <div className="h-4 w-2/3 rounded bg-slate-100" />
        </div>
      </div>

      {/* Shimmer Placeholder for Charts */}
      <div className="grid gap-5 md:grid-cols-2">
        <div className="h-72 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs animate-pulse space-y-3">
          <div className="h-4 w-28 rounded bg-slate-200" />
          <div className="h-48 w-full rounded-xl bg-slate-100" />
        </div>
        <div className="h-72 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs animate-pulse space-y-3">
          <div className="h-4 w-28 rounded bg-slate-200" />
          <div className="h-48 w-full rounded-xl bg-slate-100" />
        </div>
      </div>
    </div>
  )
}
