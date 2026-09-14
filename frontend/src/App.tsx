import { type FormEvent, useState, useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import type { AnalysisResponse, HistoryItem } from './types'
import { Navbar } from './components/Navbar'
import { SidebarHistory } from './components/SidebarHistory'
import { QueryInput } from './components/QueryInput'
import { EmptyDashboard } from './components/EmptyDashboard'
import { ExecutiveSummary } from './components/ExecutiveSummary'
import { InteractiveCharts } from './components/InteractiveCharts'
import { EvidenceInspector } from './components/EvidenceInspector'
import { ActionPlan } from './components/ActionPlan'
import { LoadingSkeleton } from './components/LoadingSkeleton'
import { formatBriefAsMarkdown } from './utils/formatters'

const exampleQuestions = [
  'What changed in sales from 2026-09-01 to 2026-09-07?',
  'Which products had the lowest sales last week?',
  'Are there any low-stock products I should review?',
]

const HISTORY_STORAGE_KEY = 'sales_assistant_history_v1'

export default function App() {
  const [question, setQuestion] = useState('')
  const [activeQuestion, setActiveQuestion] = useState('')
  const [result, setResult] = useState<AnalysisResponse | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null)

  // Local storage history initialization
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history))
    } catch {
      // Ignore
    }
  }, [history])

  async function executeAnalysis(queryText: string) {
    const trimmed = queryText.trim()
    if (!trimmed || loading) return

    setLoading(true)
    setError('')
    setActiveQuestion(trimmed)

    try {
      const response = await fetch('/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmed }),
      })
      const body = await response.json()

      if (!response.ok) {
        throw new Error(body.detail || 'The analysis request failed.')
      }

      const analysisResult = body as AnalysisResponse
      setResult(analysisResult)

      // Add to session history
      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        question: trimmed,
        result: analysisResult,
      }
      setActiveHistoryId(newHistoryItem.id)
      setHistory((prev) => [newHistoryItem, ...prev.slice(0, 19)]) // keep up to 20
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Could not reach the Sales Assistant API.',
      )
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    executeAnalysis(question)
  }

  function handleSelectExample(prompt: string) {
    setQuestion(prompt)
    executeAnalysis(prompt)
  }

  function handleSelectHistoryItem(item: HistoryItem) {
    setQuestion(item.question)
    setActiveQuestion(item.question)
    setResult(item.result)
    setActiveHistoryId(item.id)
    setError('')
  }

  function handleClearHistory() {
    setHistory([])
    setActiveHistoryId(null)
  }

  function handleReset() {
    setQuestion('')
    setActiveQuestion('')
    setResult(null)
    setError('')
    setActiveHistoryId(null)
  }

  function handleExport() {
    if (!result) return
    const md = formatBriefAsMarkdown(activeQuestion || question, result)
    navigator.clipboard.writeText(md)
    alert('Executive Brief copied to clipboard as Markdown!')
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      {/* Top Navbar */}
      <Navbar
        historyCount={history.length}
        isHistoryOpen={isHistoryOpen}
        onToggleHistory={() => setIsHistoryOpen((prev) => !prev)}
        onReset={handleReset}
        onExport={handleExport}
        hasResult={Boolean(result)}
      />

      {/* Main Workspace */}
      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Sticky Prompt Bar Container */}
        <div className="mb-6">
          <QueryInput
            question={question}
            onChange={setQuestion}
            onSubmit={handleSubmit}
            loading={loading}
            exampleQuestions={exampleQuestions}
            onSelectExample={handleSelectExample}
          />
        </div>

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-sm text-rose-800 shadow-xs"
          >
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold">Analysis Failed</h4>
              <p className="mt-0.5 text-xs text-rose-700 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Dynamic Canvas Area */}
        {loading ? (
          <LoadingSkeleton />
        ) : result ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Top Grid: Executive Summary & Action Plan */}
            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] items-start">
              <ExecutiveSummary question={activeQuestion || question} result={result} />
              <ActionPlan actions={result.suggested_actions} />
            </div>

            {/* Interactive Charts */}
            {result.charts && result.charts.length > 0 && (
              <InteractiveCharts charts={result.charts} />
            )}

            {/* Evidence & SQL Inspector */}
            {result.evidence && result.evidence.length > 0 && (
              <EvidenceInspector evidence={result.evidence} />
            )}
          </div>
        ) : (
          <EmptyDashboard onSelectPrompt={handleSelectExample} />
        )}
      </main>

      {/* History Slide-over Drawer */}
      <SidebarHistory
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        activeId={activeHistoryId}
        onSelect={handleSelectHistoryItem}
        onClear={handleClearHistory}
        onSelectPrompt={handleSelectExample}
      />
    </div>
  )
}
