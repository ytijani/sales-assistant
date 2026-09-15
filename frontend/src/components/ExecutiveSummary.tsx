import { useState } from 'react'
import {
  Briefcase,
  Check,
  Copy,
  Lightbulb,
} from 'lucide-react'
import type { AnalysisResponse } from '../types'
import { formatBriefAsMarkdown } from '../utils/formatters'

type ExecutiveSummaryProps = {
  question: string
  result: AnalysisResponse
}

export function ExecutiveSummary({ question, result }: ExecutiveSummaryProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const md = formatBriefAsMarkdown(question, result)
    try {
      await navigator.clipboard.writeText(md)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  return (
    <div className="relative rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs transition-all animate-fade-in-up">
      {/* Card Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Briefcase className="h-4 w-4" />
          </span>
          <span className="text-sm font-bold text-slate-900 tracking-tight">
            Executive Brief
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition active:scale-95"
          title="Copy Executive Brief"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-emerald-700 font-semibold">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 text-slate-500" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Query */}
      <div className="mt-5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Question</p>
        <h2 className="mt-1 text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-snug">
          {question}
        </h2>
      </div>

      {/* Summary */}
      <div className="mt-5 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/70 via-teal-50/30 to-white p-5 sm:p-6 shadow-2xs">
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2">
          Summary
        </p>
        <p className="text-base sm:text-lg font-semibold text-slate-800 leading-relaxed">
          {result.answer.summary}
        </p>
      </div>

      {/* Findings */}
      {result.answer.findings.length > 0 && (
        <div className="mt-6">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
            Key Findings ({result.answer.findings.length})
          </h3>
          <div className="space-y-2.5">
            {result.answer.findings.map((finding, idx) => (
              <div
                key={idx}
                className="group flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 transition hover:border-emerald-200 hover:bg-emerald-50/15"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-[11px] font-bold text-emerald-800">
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-700 font-medium">{finding}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conclusion */}
      {result.answer.conclusion && (
        <div className="mt-6 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
              What This Means
            </h4>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-700 font-normal">
            {result.answer.conclusion}
          </p>
        </div>
      )}
    </div>
  )
}
