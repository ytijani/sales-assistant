import { useState } from 'react'
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
import { BarChart3, LineChart as LineChartIcon, TrendingUp } from 'lucide-react'
import type { Chart as ChartType } from '../types'
import { formatCurrency, formatNumber } from '../utils/formatters'

type InteractiveChartsProps = {
  charts: ChartType[]
}

export function InteractiveCharts({ charts }: InteractiveChartsProps) {
  const validCharts = charts.filter(
    (c) => c.data && c.data.filter((p) => p.label && Number.isFinite(p.value)).length > 0,
  )

  const [activeIdx, setActiveIdx] = useState(0)
  const currentChart = validCharts[activeIdx] ?? validCharts[0]
  const [chartType, setChartType] = useState<'bar' | 'line'>(currentChart?.type ?? 'bar')

  if (validCharts.length === 0 || !currentChart) return null

  const points = currentChart.data.filter((point) => point.label && Number.isFinite(point.value))
  const isCurrency = /revenue|sales|amount|price|cost|margin|mad/i.test(currentChart.y_axis)
  const formatVal = isCurrency ? formatCurrency : formatNumber

  // Metrics
  const values = points.map((p) => p.value)
  const maxVal = values.length > 0 ? Math.max(...values) : 0
  const sumVal = values.reduce((acc, curr) => acc + curr, 0)
  const avgVal = values.length > 0 ? sumVal / values.length : 0

  const crowded = points.length > 6
  const commonAxisProps = {
    axisLine: false,
    tickLine: false,
    tick: { fill: '#64748b', fontSize: 11, fontFamily: 'inherit' },
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-7 shadow-xs transition-all">
      {/* Header with Title & Chart Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <TrendingUp className="h-3.5 w-3.5" />
            </span>
            <span className="text-[11px] font-bold tracking-wider text-emerald-800 uppercase">
              Visual Intelligence
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500">
              {currentChart.y_axis} vs {currentChart.x_axis}
            </span>
          </div>
          <h3 className="mt-1.5 text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            {currentChart.title}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Multiple Chart Segmented Switcher (solves multi-data clutter) */}
          {validCharts.length > 1 && (
            <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/70">
              {validCharts.map((chart, idx) => (
                <button
                  key={chart.id || idx}
                  type="button"
                  onClick={() => {
                    setActiveIdx(idx)
                    setChartType(chart.type)
                  }}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                    activeIdx === idx
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {chart.title.length > 24 ? `${chart.title.slice(0, 24)}…` : chart.title}
                </button>
              ))}
            </div>
          )}

          {/* Bar / Line Type Toggle */}
          <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/70">
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                chartType === 'bar'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Switch to Bar Chart"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Bar</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType('line')}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                chartType === 'line'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Switch to Line Chart"
            >
              <LineChartIcon className="h-3.5 w-3.5" />
              <span>Line</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Key Metrics Bar */}
      <div className="mt-5 grid grid-cols-3 gap-3 rounded-xl bg-slate-50/80 p-3 text-center border border-slate-100">
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
            Total Metric
          </span>
          <span className="text-sm sm:text-base font-extrabold text-slate-800">
            {formatVal(sumVal)}
          </span>
        </div>
        <div className="border-x border-slate-200/60">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
            Peak Performance
          </span>
          <span className="text-sm sm:text-base font-extrabold text-emerald-700">
            {formatVal(maxVal)}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
            Average / Unit
          </span>
          <span className="text-sm sm:text-base font-extrabold text-slate-800">
            {formatVal(avgVal)}
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="mt-6 h-72 sm:h-80 w-full" aria-label={currentChart.title}>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart
              data={points}
              margin={{ top: 16, right: 16, left: -10, bottom: crowded ? 32 : 12 }}
            >
              <defs>
                <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                {...commonAxisProps}
                interval={0}
                angle={crowded ? -28 : 0}
                textAnchor={crowded ? 'end' : 'middle'}
                height={crowded ? 60 : 30}
              />
              <YAxis {...commonAxisProps} tickFormatter={(val) => formatVal(Number(val))} />
              <Tooltip
                formatter={(val) => [formatVal(Number(val)), currentChart.y_axis]}
                cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '3 3' }}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08)',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#0f172a',
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#059669"
                strokeWidth={3}
                dot={{ r: 4, fill: '#059669', strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 6, fill: '#047857' }}
              />
            </LineChart>
          ) : (
            <BarChart
              data={points}
              margin={{ top: 16, right: 16, left: -10, bottom: crowded ? 32 : 12 }}
            >
              <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                {...commonAxisProps}
                interval={0}
                angle={crowded ? -28 : 0}
                textAnchor={crowded ? 'end' : 'middle'}
                height={crowded ? 60 : 30}
              />
              <YAxis {...commonAxisProps} tickFormatter={(val) => formatVal(Number(val))} />
              <Tooltip
                formatter={(val) => [formatVal(Number(val)), currentChart.y_axis]}
                cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08)',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#0f172a',
                }}
              />
              <Bar dataKey="value" fill="#059669" radius={[6, 6, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}
