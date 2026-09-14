import {
  TrendingUp,
  Package,
  Store,
  CheckCircle2,
  ShieldCheck,
  Zap,
} from 'lucide-react'

type EmptyDashboardProps = {
  onSelectPrompt: (prompt: string) => void
}

export function EmptyDashboard({ onSelectPrompt }: EmptyDashboardProps) {
  const cards = [
    {
      title: 'Sales Performance Diagnostic',
      desc: 'Compare period-over-period revenue, identify product movers, and pinpoint anomalies.',
      prompt: 'What changed in sales from 2026-09-01 to 2026-09-07?',
      icon: TrendingUp,
      color: 'emerald',
      badge: 'Sales DB',
    },
    {
      title: 'Inventory & Stock Risk Analysis',
      desc: 'Identify SKUs approaching safety thresholds and categories with stockout hazards.',
      prompt: 'Are there any low-stock products I should review?',
      icon: Package,
      color: 'amber',
      badge: 'Stock Levels',
    },
    {
      title: 'Branch & Product Benchmarks',
      desc: 'Evaluate lower-performing items and optimize distribution across sales locations.',
      prompt: 'Which products had the lowest sales last week?',
      icon: Store,
      color: 'blue',
      badge: 'Branches',
    },
  ]

  return (
    <section className="py-6 sm:py-10">
      {/* Hero Intro */}
      <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-3 py-1 text-xs font-semibold text-emerald-800 mb-4 shadow-2xs">
          <Zap className="h-3.5 w-3.5 text-emerald-600" />
          <span>PostgreSQL Grounded Intelligence</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
          Turn enterprise data into your next strategic move.
        </h1>
        <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
          Ask questions in plain English. Get answers synthesized by LangGraph, grounded by real SQL
          verifications, and visualized with decision-ready charts.
        </p>
      </div>

      {/* 3 Starter Cards */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <button
              key={card.title}
              type="button"
              onClick={() => onSelectPrompt(card.prompt)}
              className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 text-left shadow-sm hover:border-emerald-300 hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 group-hover:bg-emerald-50 text-slate-700 group-hover:text-emerald-700 transition">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 group-hover:bg-emerald-100/60 group-hover:text-emerald-800 transition">
                    {card.badge}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900 text-base mb-1.5 group-hover:text-emerald-950 transition">
                  {card.title}
                </h3>
                <p className="text-xs sm:text-[13px] leading-relaxed text-slate-500">
                  {card.desc}
                </p>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-3 flex items-center justify-between text-xs font-semibold text-emerald-700 group-hover:text-emerald-800">
                <span>Run analysis</span>
                <span className="text-slate-400 group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Trust & Transparency banner */}
      <div className="mt-12 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">
                Safe Database Execution & Evidence-Backed
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                All numbers are extracted through restricted SQL queries with safe layer guardrails.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-200/70 shadow-2xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Sales Orders
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-200/70 shadow-2xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Inventory Stock
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-200/70 shadow-2xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Branches
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
