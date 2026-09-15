import {
  TrendingUp,
  Package,
  Store,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react'

type EmptyDashboardProps = {
  onSelectPrompt: (prompt: string) => void
}

export function EmptyDashboard({ onSelectPrompt }: EmptyDashboardProps) {
  const cards = [
    {
      title: 'Sales Performance',
      desc: 'Compare period-over-period revenue, identify top products, and pinpoint volume shifts across branches.',
      prompt: 'What changed in sales from 2026-09-01 to 2026-09-07?',
      icon: TrendingUp,
      badge: 'Revenue',
    },
    {
      title: 'Inventory Health',
      desc: 'Identify SKUs approaching safety thresholds and categories with impending stockout risks.',
      prompt: 'Are there any low-stock products I should review?',
      icon: Package,
      badge: 'Stock',
    },
    {
      title: 'Product Benchmarks',
      desc: 'Evaluate lower-performing items and compare distribution performance across sales branches.',
      prompt: 'Which products had the lowest sales last week?',
      icon: Store,
      badge: 'Ranking',
    },
  ]

  return (
    <section className="py-6 sm:py-12">
      {/* Hero */}
      <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14 animate-fade-in-up">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
          Ask a question,<br />get the full picture.
        </h1>
        <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl mx-auto">
          Type a question in plain English. Your answer comes back with verified numbers, 
          interactive charts, and a clear action plan — all from your live database.
        </p>
      </div>

      {/* Starter Cards */}
      <div className="grid gap-5 md:grid-cols-3">
        {cards.map((card, idx) => {
          const Icon = card.icon
          return (
            <button
              key={card.title}
              type="button"
              onClick={() => onSelectPrompt(card.prompt)}
              className={`group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 text-left shadow-xs hover:border-emerald-300 hover:shadow-md hover:-translate-y-0.5 transition-all animate-fade-in-up stagger-${idx + 1}`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 group-hover:bg-emerald-50 text-slate-700 group-hover:text-emerald-700 transition">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-800 transition">
                    {card.badge}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1.5 group-hover:text-emerald-950 transition">
                  {card.title}
                </h3>
                <p className="text-xs sm:text-[13px] leading-relaxed text-slate-500">
                  {card.desc}
                </p>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-3.5 flex items-center justify-between text-xs font-bold text-emerald-700 group-hover:text-emerald-800">
                <span>Run analysis</span>
                <span className="text-slate-400 group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Trust Banner */}
      <div className="mt-10 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5 sm:p-6 animate-fade-in-up stagger-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                Every Answer Is Verified & Auditable
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                All numbers come from read-only queries against your database. You can inspect every SQL query behind any result.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200/80 shadow-2xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Sales Orders
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200/80 shadow-2xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Inventory
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200/80 shadow-2xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Branches
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
