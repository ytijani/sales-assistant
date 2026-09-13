
import { type FormEvent, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type Chart = {
  id: string
  type: 'bar' | 'line'
  title: string
  x_axis: string
  y_axis: string
  data: Array<{
    label: string
    value: number
  }>
}

type AnalysisResponse = {
  answer: {
    summary: string
    findings: string[]
    conclusion: string
  }
  evidence: Array<{
    source: string
    data: string[]
  }>
  charts: Chart[]
  suggested_actions: string[]
}

const exampleQuestions = [
  'What changed in sales from 2026-09-01 to 2026-09-07?',
  'Which products had the lowest sales last week?',
  'Are there any low-stock products I should review?',
]

function AnalysisChart({ chart }: { chart: Chart }) {
  const commonAxisProps = {
    axisLine: false,
    tickLine: false,
    tick: { fill: '#66736e', fontSize: 12 },
  }

  return (
    <section className="rounded-2xl border border-[#e0e3db] bg-white p-6 shadow-[0_10px_32px_rgba(22,40,33,0.05)] sm:p-7">
      <p className="font-mono text-[11px] font-medium tracking-[0.12em] text-[#39745e] uppercase">Data visualization</p>
      <h2 className="mt-2 text-lg font-semibold">{chart.title}</h2>
      <p className="mt-1 text-xs text-[#73807a]">{chart.y_axis} by {chart.x_axis}</p>

      <div className="mt-5 h-72" aria-label={chart.title}>
        <ResponsiveContainer width="100%" height="100%">
          {chart.type === 'line' ? (
            <LineChart data={chart.data} margin={{ top: 8, right: 8, left: -12, bottom: 8 }}>
              <CartesianGrid vertical={false} stroke="#e4e8e2" strokeDasharray="3 3" />
              <XAxis dataKey="label" {...commonAxisProps} />
              <YAxis {...commonAxisProps} />
              <Tooltip
                cursor={{ stroke: '#8fb4a1', strokeWidth: 1 }}
                contentStyle={{ border: '1px solid #d8e1d9', borderRadius: 8, boxShadow: '0 8px 20px rgba(22,40,33,.1)' }}
              />
              <Line type="monotone" dataKey="value" stroke="#39745e" strokeWidth={3} dot={{ r: 4, fill: '#39745e' }} />
            </LineChart>
          ) : (
            <BarChart data={chart.data} margin={{ top: 8, right: 8, left: -12, bottom: 8 }}>
              <CartesianGrid vertical={false} stroke="#e4e8e2" strokeDasharray="3 3" />
              <XAxis dataKey="label" {...commonAxisProps} />
              <YAxis {...commonAxisProps} />
              <Tooltip
                cursor={{ fill: '#eff5ef' }}
                contentStyle={{ border: '1px solid #d8e1d9', borderRadius: 8, boxShadow: '0 8px 20px rgba(22,40,33,.1)' }}
              />
              <Bar dataKey="value" fill="#39745e" radius={[5, 5, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </section>
  )
}

function App() {
  const [question, setQuestion] = useState('')
  const [result, setResult] = useState<AnalysisResponse | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = question.trim()
    if (!value || loading) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: value }),
      })
      const body = await response.json()

      if (!response.ok) {
        throw new Error(body.detail || 'The analysis request failed.')
      }

      setResult(body as AnalysisResponse)
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

  return (
    <main className="min-h-screen bg-[#f7f7f2] px-4 py-5 text-[#14241e] sm:px-8 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-16 min-h-72 px-1">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm font-bold tracking-tight">
              <span className="text-xl text-[#e86242]">◒</span>
              Sales Assistant
            </p>
            <p className="flex items-center gap-2 text-xs text-[#64716b]">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Live data analysis
            </p>
          </div>

          <div className="mt-16 max-w-3xl">
            <p className="mb-3 font-mono text-[11px] font-medium tracking-[0.12em] text-[#39745e] uppercase">
              Business intelligence, made conversational
            </p>
            <h1 className="font-display text-5xl leading-[0.96] font-bold tracking-[-0.055em] sm:text-7xl">
              Ask a sharper question about your business.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#66736e]">
              Get a concise conclusion, the supporting data, and practical next steps.
            </p>
          </div>
        </header>

        <section className="rounded-2xl border border-[#e0e3db] bg-white p-5 shadow-[0_10px_32px_rgba(22,40,33,0.05)] sm:p-7">
          <h2 className="text-lg font-semibold tracking-tight">What would you like to investigate?</h2>
          <form onSubmit={handleSubmit} className="mt-4">
            <label htmlFor="question" className="sr-only">Your business question</label>
            <textarea
              id="question"
              rows={3}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              disabled={loading}
              placeholder="For example: Why did sales drop last week?"
              className="w-full resize-y rounded-xl border border-[#cdd4ce] p-4 leading-relaxed outline-none transition focus:border-[#39745e] focus:ring-3 focus:ring-[#39745e]/15 disabled:bg-stone-50"
            />
            <div className="mt-3 flex items-end justify-between gap-4">
              <span className="max-w-40 text-xs leading-snug text-[#73807a]">Uses verified sales and inventory data</span>
              <button
                type="submit"
                disabled={!question.trim() || loading}
                className="rounded-lg bg-[#1d4d3c] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#123e2e] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {loading ? 'Investigating…' : 'Analyze data →'}
              </button>
            </div>
          </form>

          <div className="mt-5 flex flex-wrap gap-2" aria-label="Example questions">
            {exampleQuestions.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setQuestion(example)}
                className="rounded-full border border-[#d9dfd9] bg-[#f8f9f6] px-3 py-2 text-left text-xs text-[#4b5c55] transition hover:border-[#89aa9a] hover:bg-[#eff5ef]"
              >
                {example}
              </button>
            ))}
          </div>
        </section>

        {error && (
          <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </p>
        )}

        {loading && (
          <p className="mt-5 rounded-lg bg-[#edf5ee] p-4 text-sm text-[#39745e]">
            The analyst is reviewing the data…
          </p>
        )}

        {result && (
          <div className="mt-6 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
            <section className="row-span-2 rounded-2xl border border-[#e0e3db] bg-white p-6 shadow-[0_10px_32px_rgba(22,40,33,0.05)] sm:p-8">
              <p className="font-mono text-[11px] font-medium tracking-[0.12em] text-[#39745e] uppercase">Analysis</p>
              <h2 className="mt-3 font-display text-3xl leading-tight font-semibold tracking-[-0.04em] sm:text-4xl">
                {result.answer.summary}
              </h2>

              {result.answer.findings.length > 0 && (
                <div className="mt-8">
                  <h3 className="font-semibold">Key findings</h3>
                  <ul className="mt-3 grid gap-3 pl-5 text-[#425049] marker:text-[#39745e] marker:font-bold">
                    {result.answer.findings.map((finding, index) => <li key={index}>{finding}</li>)}
                  </ul>
                </div>
              )}

              <div className="mt-8">
                <h3 className="font-semibold">Conclusion</h3>
                <p className="mt-2 leading-relaxed text-[#425049]">{result.answer.conclusion}</p>
              </div>
            </section>

            {result.suggested_actions.length > 0 && (
              <section className="rounded-2xl border border-[#d8e7d9] bg-[#edf5ee] p-6">
                <p className="font-mono text-[11px] font-medium tracking-[0.12em] text-[#39745e] uppercase">Recommended next steps</p>
                <h2 className="mt-2 text-lg font-semibold">Suggested actions</h2>
                <ol className="mt-4 grid gap-3 pl-5 text-sm leading-relaxed text-[#425049] marker:font-bold marker:text-[#39745e]">
                  {result.suggested_actions.map((action, index) => <li key={index}>{action}</li>)}
                </ol>
              </section>
            )}

            {result.evidence.length > 0 && (
              <section className="rounded-2xl border border-[#e0e3db] bg-white p-6 shadow-[0_10px_32px_rgba(22,40,33,0.05)]">
                <p className="font-mono text-[11px] font-medium tracking-[0.12em] text-[#39745e] uppercase">Verified data</p>
                <h2 className="mt-2 text-lg font-semibold">Evidence</h2>
                <div className="mt-4 grid gap-4">
                  {result.evidence.map((item, index) => (
                    <article key={`${item.source}-${index}`} className="border-t border-[#e4e8e2] pt-4 first:border-0 first:pt-0">
                      <code className="text-[11px] font-medium text-[#39745e]">{item.source}</code>
                      <ul className="mt-2 grid gap-2 font-mono text-xs leading-relaxed text-[#5c6963]">
                        {item.data.map((line, lineIndex) => <li key={lineIndex}>{line}</li>)}
                      </ul>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {result && result.charts.length > 0 && (
          <section className="mt-5">
            <div className="grid gap-5 lg:grid-cols-2">
              {result.charts.map((chart) => <AnalysisChart key={chart.id} chart={chart} />)}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}

export default App
