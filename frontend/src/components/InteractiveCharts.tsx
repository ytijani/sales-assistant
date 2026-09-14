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
import { BarChart3, LineChart as LineChartIcon, Maximize2 } from 'lucide-react'
import type { Chart as ChartType } from '../types'
import { formatCurrency, formatNumber } from '../utils/formatters'

type InteractiveChartsProps = {
  charts: ChartType[]
}

function SingleChartCard({ chart }: { chart: ChartType }) {
  const points = chart.data.filter((point) => point.label && Number.isFinite(point.value))
  const [chartType, setChartType] = useState<'bar' | 'line'>(chart.type)

  if (points.length === 0) return null

  const isCurrency = /revenue|sales|amount|price|cost|margin|mad/i.test(chart.y_axis)
  const formatVal = isCurrency ? formatCurrency : formatNumber

  // Calculate quick stats
  const values = points.map((p) => p.value)
  const maxVal = Math.max(...values)
  const sumVal = values.reduce((acc, curr) => acc + curr, 0)
  const avgVal = sumVal / values.length

  const crowded = points.length > 6
  const commonAxisProps = {
    axisLine: false,
    tickLine: false,
    tick: { fill: '#64748b', fontSize: 11 },
  }

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm transition-all hover:shadow-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-wider text-emerald-800 uppercase">
              Visualization
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500">
              {chart.y_axis} vs {chart.x_axis}
            </span>
          </div>
          <h3 className="mt-1 text-base font-bold text-slate-900 tracking-tight">{chart.title}</h3>
        </div>

        {/* View switcher */}
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => setChartType('bar')}
            className={`rounded px-2 py-1 text-xs font-medium transition ${
              chartType === 'bar'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Switch to Bar Chart"
          >
            <BarChart3 className="h-3.5 w-3.5 inline mr-1" />
            Bar
          </button>
          <button
            type="button"
            onClick={() => setChartType('line')}
            className={`rounded px-2 py-1 text-xs font-medium transition ${
              chartType === 'line'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Switch to Line Chart"
          >
            <LineChartIcon className="h-3.5 w-3.5 inline mr-1" />
            Line
          </button>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50/70 p-2.5 text-center text-xs">
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total</span>
          <span className="font-bold text-slate-800">{formatVal(sumVal)}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Peak</span>
          <span className="font-bold text-emerald-700">{formatVal(maxVal)}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Average</span>
          <span className="font-bold text-slate-800">{formatVal(avgVal)}</span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="mt-5 h-72 w-full" aria-label={chart.title}>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart
              data={points}
              margin={{ top: 12, right: 12, left: -10, bottom: crowded ? 30 : 10 }}
            >
              <defs>
                <linearGradient id="lineColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#047857" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#047857" stopOpacity={0} />
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
                formatter={(val) => [formatVal(Number(val)), chart.y_axis]}
                cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '3 3' }}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.08)',
                  fontSize: '12px',
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#047857"
                strokeWidth={3}
                dot={{ r: 4, fill: '#047857', strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 6, fill: '#059669' }}
              />
            </LineChart>
          ) : (
            <BarChart
              data={points}
              margin={{ top: 12, right: 12, left: -10, bottom: crowded ? 30 : 10 }}
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
                formatter={(val) => [formatVal(Number(val)), chart.y_axis]}
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.08)',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="value" fill="#047857" radius={[6, 6, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function InteractiveCharts({ charts }: InteractiveChartsProps) {
  if (charts.length === 0) return null

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
            <Maximize2 className="h-3.5 w-3.5" />
          </span>
          <h3 className="text-sm font-bold tracking-tight text-slate-900">
            Interactive Visualizations ({charts.length})
          </h3>
        </div>
      </div>

      <div className={`grid gap-5 ${charts.length > 1 ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
        {charts.map((chart) => (
          <SingleChartCard key={chart.id} chart={chart} />
        ))}
      </div>
    </section>
  )
}
