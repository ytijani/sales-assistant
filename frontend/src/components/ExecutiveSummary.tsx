import { useState } from 'react'
import {
  Briefcase,
  Check,
  CheckCircle2,
  Copy,
  Lightbulb,
  Sparkles,
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
    <div className="relative rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm transition-all hover:shadow-md">
      {/* Card Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <Briefcase className="h-4 w-4" />
          </span>
          <div>
            <span className="text-[11px] font-bold tracking-wider text-emerald-800 uppercase">
              Executive Brief
            </span>
            <span className="mx-2 text-slate-300">•</span>
            <span className="text-xs text-slate-500">Synthesized Decision Brief</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Database Grounded</span>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition active:scale-95"
            title="Copy Executive Brief"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-500" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Query Title */}
      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Inquiry</p>
        <h2 className="mt-1 text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
          {question}
        </h2>
      </div>

      {/* Summary Highlight Box */}
      <div className="mt-5 rounded-xl border border-emerald-100/90 bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-white p-4 sm:p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5 mb-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          Executive Summary
        </p>
        <p className="text-base sm:text-lg font-medium text-slate-800 leading-snug">
          {result.answer.summary}
        </p>
      </div>

      {/* Findings Section */}
      {result.answer.findings.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Key Findings & Evidence ({result.answer.findings.length})
          </h3>
          <div className="grid gap-2.5 sm:grid-cols-1">
            {result.answer.findings.map((finding, idx) => (
              <div
                key={idx}
                className="group flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 transition hover:border-slate-200 hover:bg-slate-50"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-[11px] font-bold text-emerald-800">
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <p className="text-sm leading-relaxed text-slate-700 font-normal">{finding}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conclusion / Strategic Impact Section */}
      {result.answer.conclusion && (
        <div className="mt-6 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Strategic Takeaway & Business Impact
            </h4>
          </div>
          <p className="text-sm sm:text-[15px] leading-relaxed text-slate-700">
            {result.answer.conclusion}
          </p>
        </div>
      )}
    </div>
  )
}
