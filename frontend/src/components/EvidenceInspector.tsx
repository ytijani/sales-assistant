import { useState, useMemo } from 'react'
import { Check, Code2, Copy, Database, Search, Table as TableIcon } from 'lucide-react'
import type { AnalysisResponse } from '../types'
import { formatEvidenceValue, getEvidenceTables } from '../utils/formatters'

type EvidenceInspectorProps = {
  evidence: AnalysisResponse['evidence']
}

export function EvidenceInspector({ evidence }: EvidenceInspectorProps) {
  const tables = useMemo(() => getEvidenceTables(evidence), [evidence])
  const [activeTab, setActiveTab] = useState(0)
  const [filterText, setFilterText] = useState('')
  const [copiedQuery, setCopiedQuery] = useState(false)
  const [showSql, setShowSql] = useState(false)

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
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm transition-all hover:shadow-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <Database className="h-4 w-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Verified Data & Grounding Inspector
              </h3>
              <span className="rounded-full bg-emerald-100/80 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                {tables.length} {tables.length === 1 ? 'Check' : 'Checks'} Passed
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Live SQL executed against the Supabase database
            </p>
          </div>
        </div>

        {/* Tab switcher if multiple tables */}
        {tables.length > 1 && (
          <div className="flex flex-wrap gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-1">
            {tables.map((tbl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setActiveTab(idx)
                  setFilterText('')
                }}
                className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                  activeTab === idx
                    ? 'bg-white text-emerald-800 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tbl.source} #{idx + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Control bar: Search + Toggle SQL view */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter table rows..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50/70 py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSql(!showSql)}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
              showSql
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>{showSql ? 'Hide SQL' : 'View SQL Query'}</span>
          </button>
        </div>
      </div>

      {/* SQL Query Preview Block */}
      {showSql && (
        <div className="mt-3 relative rounded-xl border border-slate-800 bg-slate-900 p-4 text-xs font-mono text-emerald-400 shadow-inner">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5 font-semibold text-slate-300">
              <Code2 className="h-3 w-3 text-emerald-400" />
              Executed SQL Query
            </span>
            <button
              type="button"
              onClick={() => handleCopyQuery(currentTable.query)}
              className="flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-slate-300 hover:text-white transition"
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
          <pre className="overflow-x-auto whitespace-pre-wrap leading-relaxed">
            {currentTable.query}
          </pre>
        </div>
      )}

      {/* Table Data */}
      <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="max-h-80 overflow-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                {currentTable.columns.map((col) => (
                  <th key={col} className="py-2.5 px-3.5">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={currentTable.columns.length}
                    className="py-8 text-center text-slate-400"
                  >
                    No matching rows found.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50/60 transition">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="py-2 px-3.5 font-medium text-slate-700">
                        {formatEvidenceValue(cell, currentTable.columns[cIdx])}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 bg-slate-50/50 px-3.5 py-2 text-[11px] text-slate-500 flex items-center justify-between">
          <span>
            Showing {filteredRows.length} of {currentTable.rows.length} rows
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <TableIcon className="h-3 w-3" />
            Source: {currentTable.source}
          </span>
        </div>
      </div>
    </div>
  )
}
