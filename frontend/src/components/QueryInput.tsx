import { type FormEvent, type KeyboardEvent, useRef, useEffect } from 'react'
import { ArrowUp, CornerDownLeft, Sparkles, X } from 'lucide-react'

type QueryInputProps = {
  question: string
  onChange: (val: string) => void
  onSubmit: (e: FormEvent) => void
  loading: boolean
  exampleQuestions: string[]
  onSelectExample: (q: string) => void
}

export function QueryInput({
  question,
  onChange,
  onSubmit,
  loading,
  exampleQuestions,
  onSelectExample,
}: QueryInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`
    }
  }, [question])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      if (question.trim() && !loading) {
        onSubmit(e as unknown as FormEvent)
      }
    }
  }

  return (
    <div className="w-full">
      <form
        onSubmit={onSubmit}
        className="group relative rounded-2xl border border-slate-200/90 bg-white p-2 shadow-lg shadow-slate-200/40 transition-all focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 hover:border-slate-300"
      >
        <div className="flex items-start gap-2.5 p-2 sm:p-2.5">
          <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <Sparkles className="h-4 w-4" />
          </div>

          <textarea
            ref={textareaRef}
            rows={2}
            value={question}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="Ask anything about sales, revenue, top branches, or low-stock inventory..."
            className="w-full resize-none bg-transparent py-1 text-sm sm:text-[15px] leading-relaxed text-slate-800 placeholder:text-slate-400 focus:outline-none disabled:opacity-50"
          />

          {question.trim() && !loading && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="mt-1 p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition"
              title="Clear input"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100/90 px-3 pt-2 pb-1">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span>Press</span>
            <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-500 shadow-2xs">
              ⌘ / Ctrl
            </kbd>
            <span>+</span>
            <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-500 shadow-2xs">
              Enter
            </kbd>
          </div>

          <button
            type="submit"
            disabled={!question.trim() || loading}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-emerald-700/20 transition-all hover:bg-emerald-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span>{loading ? 'Analyzing...' : 'Ask Assistant'}</span>
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>

      {/* Suggested prompts pills */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 mr-1">
          <CornerDownLeft className="h-3 w-3" />
          Suggestions:
        </span>
        {exampleQuestions.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => onSelectExample(example)}
            className="rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-xs text-slate-600 shadow-2xs hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-900 transition active:scale-95"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  )
}
