import type { AnalysisResponse, EvidenceItem, EvidenceTable } from '../types'

export function parseEvidence(item: EvidenceItem): EvidenceTable | null {
  const lines = item.data.map((line) => line.trim()).filter(Boolean)
  if (lines.some((line) => line.toLowerCase().includes('query rejected'))) return null

  const queryLine = lines.find((line) => /^-?\s*SELECT\b/i.test(line))
  const resultIndex = lines.findIndex((line) => /^Results \(/i.test(line))
  if (!queryLine || resultIndex < 0) return null

  const tableLines = lines.slice(resultIndex + 1).filter((line) => line.includes('|'))
  if (tableLines.length < 2) return null

  const columns = tableLines[0].split('|').map((cell) => cell.trim())
  const rows = tableLines
    .slice(1)
    .filter((line) => !/^[-+|\s]+$/.test(line))
    .map((line) => line.split('|').map((cell) => cell.trim()))
    .filter((row) => row.length === columns.length)

  return {
    query: queryLine.replace(/^-\s*/, ''),
    columns,
    rows,
    source: item.source || 'Database Query',
  }
}

export function getEvidenceTables(evidence: AnalysisResponse['evidence']): EvidenceTable[] {
  return evidence.map(parseEvidence).filter((table): table is EvidenceTable => table !== null)
}

export function formatEvidenceValue(value: string, column: string): string {
  const clean = value.replace(/,/g, '')
  const number = Number(clean)
  if (!Number.isFinite(number)) return value

  if (/revenue|value|amount|sales|price|cost|margin/i.test(column)) {
    return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(number)} MAD`
  }
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(number)
}

export function formatCurrency(value: number): string {
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value)} MAD`
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value)
}

export function formatBriefAsMarkdown(question: string, result: AnalysisResponse): string {
  let md = `# Sales Intelligence Brief\n`
  md += `**Query:** ${question}\n\n`
  md += `## Executive Summary\n${result.answer.summary}\n\n`

  if (result.answer.findings.length > 0) {
    md += `## Key Findings\n`
    result.answer.findings.forEach((finding, idx) => {
      md += `${idx + 1}. ${finding}\n`
    })
    md += `\n`
  }

  md += `## Conclusion & Strategic Meaning\n${result.answer.conclusion}\n\n`

  if (result.suggested_actions.length > 0) {
    md += `## Recommended Next Steps\n`
    result.suggested_actions.forEach((action, idx) => {
      md += `${idx + 1}. ${action}\n`
    })
    md += `\n`
  }

  return md
}
