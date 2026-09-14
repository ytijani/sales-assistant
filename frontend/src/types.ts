export type ChartDataPoint = {
  label: string
  value: number
}

export type Chart = {
  id: string
  type: 'bar' | 'line'
  title: string
  x_axis: string
  y_axis: string
  data: ChartDataPoint[]
}

export type AnalysisResponse = {
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

export type EvidenceItem = AnalysisResponse['evidence'][number]

export type EvidenceTable = {
  query: string
  columns: string[]
  rows: string[][]
  source: string
}

export type HistoryItem = {
  id: string
  timestamp: string
  question: string
  result: AnalysisResponse
}
