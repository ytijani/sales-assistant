import { useState, useMemo } from 'react'
import { Check, ChevronDown, ChevronUp, Code2, Copy, ShieldCheck, Sparkles, Table as TableIcon } from 'lucide-react'
import type { AnalysisResponse } from '../types'
import { formatEvidenceValue, getEvidenceTables } from '../utils/formatters'

type EvidenceInspectorProps = {
  evidence: AnalysisResponse['evidence']
}

export function EvidenceInspector({ evidence }: EvidenceInspectorProps) {
  const tables = useMemo(() => getEvidenceTables(evidence), [evidence])
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [copiedQuery, setCopiedQuery] = useState(false)
  const [filterText, setFilterText] = useState('')

  if (tables.length === 0) return null

  const currentTable = tables[activeTab] ?? tables[0]

  const filteredRows = currentTable.rows.filter((row) =>
    filterText.trim() === ''
      ? true
      : row.some((cell) => cell.toLowerCase().includes(filterText.toLowerCase())),
  )

  const handleCopyQuery = async (query: string) => {
    try {
      await navigator.clipboard.writeText(query)
      setCopiedQuery(true)
      setTimeout(() => setCopiedQuery(false), 2000)
    } catch {
      // Ignore
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs transition-all overflow-hidden">
      {/* Unobtrusive Executive Provenance Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 tracking-tight">
                Database Provenance
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 border border-emerald-200/60">
                <Sparkles className="h-2.5 w-2.5 text-emerald-600" />
                {tables.length} {tables.length === 1 ? 'SQL Query' : 'SQL Queries'} Grounded
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Verified with read-only safety guardrails against live enterprise data
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition active:scale-95"
        >
          <Code2 className="h-3.5 w-3.5 text-slate-500" />
          <span>{isOpen ? 'Hide Technical SQL' : 'Inspect SQL Proof'}</span>
          {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Expandable Technical Proof Panel */}
      {isOpen && (
        <div className="border-t border-slate-100 bg-slate-50/40 p-4 sm:p-6 space-y-4 animate-in fade-in duration-200">
          {/* Query switcher if multiple queries */}
          {tables.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              {tables.map((tbl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setActiveTab(idx)
                    setFilterText('')
                  }}
                  className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                    activeTab === idx
                      ? 'bg-emerald-800 text-white shadow-xs font-semibold'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Query #{idx + 1}: {tbl.source}
                </button>
              ))}
            </div>
          )}

          {/* SQL Snippet Box */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-xs font-mono text-emerald-400 shadow-inner">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                <Code2 className="h-3.5 w-3.5 text-emerald-400" />
                Executed PostgreSQL Query
              </span>
              <button
                type="button"
                onClick={() => handleCopyQuery(currentTable.query)}
                className="flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-slate-300 hover:text-white transition"
              >
                {copiedQuery ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy SQL</span>
                  </>
                )}
              </button>
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap leading-relaxed text-[11px]">
              {currentTable.query}
            </pre>
          </div>

          {/* Compact Data Sample Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="max-h-60 overflow-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    {currentTable.columns.map((col) => (
                      <th key={col} className="py-2 px-3">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRows.slice(0, 10).map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50/70 transition">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="py-1.5 px-3 font-medium text-slate-700">
                          {formatEvidenceValue(cell, currentTable.columns[cIdx])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-100 bg-slate-50/50 px-3 py-1.5 text-[11px] text-slate-500 flex items-center justify-between">
              <span>
                Sample of {Math.min(10, currentTable.rows.length)} of {currentTable.rows.length} rows
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <TableIcon className="h-3 w-3" />
                Source: {currentTable.source}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
