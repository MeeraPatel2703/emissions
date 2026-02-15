/**
 * PDF Report Generator
 *
 * Generates a regulatory-ready PDF with:
 * - Executive summary
 * - Scope 1, 2, 3 breakdown
 * - Methodology appendix
 * - Factor citations
 *
 * Uses jsPDF for client-side generation.
 */

import { jsPDF } from 'jspdf'
import type { EmissionResult } from '@/domain/types/emissions'
import type { SimulationResult } from '@/domain/types/simulation'

const PAGE_WIDTH = 210
const MARGIN = 20
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN

export function generatePDF(
  result: EmissionResult,
  facilityName: string,
  simulation?: SimulationResult | null,
) {
  const doc = new jsPDF()
  let y = MARGIN

  // ─── Title Page ─────────────────────────────────────────
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('Carbon Footprint Report', MARGIN, y + 20)

  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.text(facilityName || 'Facility', MARGIN, y + 32)

  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, MARGIN, y + 42)
  doc.text(`Engine: ${result.methodology.engineVersion} | Factors: ${result.methodology.factorSetVersion}`, MARGIN, y + 48)
  doc.text('GHG Protocol Corporate Standard aligned', MARGIN, y + 54)
  doc.setTextColor(0)

  y += 70

  // ─── Executive Summary ──────────────────────────────────
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Executive Summary', MARGIN, y)
  y += 10

  doc.setFontSize(28)
  doc.text(`${result.total.toFixed(1)} tCO2e/year`, MARGIN, y)
  y += 10

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Total facility emissions (location-based Scope 2)`, MARGIN, y)
  y += 8
  doc.text(`Market-based total: ${result.totalMarketBased.toFixed(1)} tCO2e/year`, MARGIN, y)
  y += 12

  // Scope table
  const scopeData = [
    ['Scope', 'Total (tCO2e)', 'Share'],
    ['Scope 1 — Direct', result.scope1.total.toFixed(1), `${((result.scope1.total / result.total) * 100).toFixed(0)}%`],
    ['Scope 2 — Electricity (Location)', result.scope2Location.total.toFixed(1), `${((result.scope2Location.total / result.total) * 100).toFixed(0)}%`],
    ['Scope 2 — Electricity (Market)', result.scope2Market.total.toFixed(1), '—'],
    ['Scope 3 — Value Chain', result.scope3.total.toFixed(1), `${((result.scope3.total / result.total) * 100).toFixed(0)}%`],
  ]

  doc.setFontSize(9)
  for (const row of scopeData) {
    const isHeader = row === scopeData[0]
    doc.setFont('helvetica', isHeader ? 'bold' : 'normal')
    doc.text(row[0], MARGIN, y)
    doc.text(row[1], MARGIN + 90, y, { align: 'right' })
    doc.text(row[2], MARGIN + 120, y, { align: 'right' })
    y += 6
  }
  y += 8

  // Intensity metrics
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Intensity Metrics', MARGIN, y)
  y += 7
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Carbon intensity: ${result.intensity.perSqFt.toFixed(4)} tCO2e/sqft`, MARGIN, y)
  y += 5
  if (result.intensity.perEmployee) {
    doc.text(`Per employee: ${result.intensity.perEmployee.toFixed(1)} tCO2e/employee`, MARGIN, y)
    y += 5
  }
  doc.text(`Benchmark percentile: ${result.benchmarkComparison.percentile.toFixed(0)}th (${result.benchmarkComparison.classification})`, MARGIN, y)
  y += 5
  doc.text(`Data quality score: ${result.dataQualityScore}/100`, MARGIN, y)
  y += 12

  // Uncertainty
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Uncertainty Analysis', MARGIN, y)
  y += 7
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `95% Confidence Interval: ${result.uncertainty.totalLowerBound.toFixed(1)} — ${result.uncertainty.totalUpperBound.toFixed(1)} tCO2e`,
    MARGIN, y,
  )
  y += 5

  if (simulation) {
    doc.text(
      `Monte Carlo (${simulation.runs} runs): ${simulation.totalEmissions.ci95Lower.toFixed(1)} — ${simulation.totalEmissions.ci95Upper.toFixed(1)} tCO2e`,
      MARGIN, y,
    )
    y += 5
    doc.text(`Convergence: ${(simulation.convergenceDiagnostic * 100).toFixed(3)}%`, MARGIN, y)
    y += 5
  }
  y += 8

  // ─── Category Breakdown ─────────────────────────────────
  if (y > 240) { doc.addPage(); y = MARGIN }

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Emission Source Breakdown', MARGIN, y)
  y += 10

  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('Scope', MARGIN, y)
  doc.text('Category', MARGIN + 18, y)
  doc.text('tCO2e', MARGIN + 95, y, { align: 'right' })
  doc.text('Quality', MARGIN + 115, y)
  doc.text('Source', MARGIN + 135, y)
  y += 5

  doc.setFont('helvetica', 'normal')
  for (const cat of result.breakdown) {
    if (y > 275) { doc.addPage(); y = MARGIN }
    doc.text(`S${cat.scope}`, MARGIN, y)
    doc.text(cat.category.replace(/_/g, ' ').slice(0, 25), MARGIN + 18, y)
    doc.text(cat.value.toFixed(3), MARGIN + 95, y, { align: 'right' })
    doc.text(cat.dataQuality, MARGIN + 115, y)
    doc.text(cat.source.slice(0, 30), MARGIN + 135, y)
    y += 5
  }
  y += 10

  // ─── Methodology Appendix ──────────────────────────────
  if (y > 230) { doc.addPage(); y = MARGIN }

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Methodology Appendix', MARGIN, y)
  y += 10

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Scope 2 method: ${result.methodology.scope2Method}`, MARGIN, y); y += 5
  doc.text(`GHG Protocol alignment: ${result.methodology.ghgProtocolAlignment}`, MARGIN, y); y += 5
  doc.text(`Calculation date: ${result.methodology.calculationDate}`, MARGIN, y); y += 8

  doc.setFont('helvetica', 'bold')
  doc.text('Factor Sources:', MARGIN, y); y += 5
  doc.setFont('helvetica', 'normal')
  for (const src of result.methodology.factorSources) {
    if (y > 275) { doc.addPage(); y = MARGIN }
    doc.text(`• ${src.category}: ${src.source} (${src.version})`, MARGIN + 3, y)
    y += 4
    doc.setTextColor(80)
    const citationLines = doc.splitTextToSize(src.citation, CONTENT_WIDTH - 6)
    for (const line of citationLines) {
      doc.text(line, MARGIN + 6, y)
      y += 4
    }
    doc.setTextColor(0)
    y += 2
  }

  if (result.methodology.assumptions.length > 0) {
    y += 4
    doc.setFont('helvetica', 'bold')
    doc.text('Assumptions:', MARGIN, y); y += 5
    doc.setFont('helvetica', 'normal')
    for (const a of result.methodology.assumptions) {
      if (y > 275) { doc.addPage(); y = MARGIN }
      const lines = doc.splitTextToSize(`• ${a}`, CONTENT_WIDTH)
      for (const line of lines) {
        doc.text(line, MARGIN + 3, y)
        y += 4
      }
    }
  }

  if (result.methodology.dataGaps.length > 0) {
    y += 4
    doc.setFont('helvetica', 'bold')
    doc.text('Data Gaps:', MARGIN, y); y += 5
    doc.setFont('helvetica', 'normal')
    for (const g of result.methodology.dataGaps) {
      if (y > 275) { doc.addPage(); y = MARGIN }
      doc.text(`• ${g}`, MARGIN + 3, y)
      y += 4
    }
  }

  // Footer on all pages
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(150)
    doc.text(
      `Carbon Intelligence Platform — ${facilityName} — Page ${i}/${pageCount}`,
      PAGE_WIDTH / 2,
      290,
      { align: 'center' },
    )
    doc.setTextColor(0)
  }

  return doc
}

export function downloadPDF(
  result: EmissionResult,
  facilityName: string,
  simulation?: SimulationResult | null,
) {
  const doc = generatePDF(result, facilityName, simulation)
  doc.save(`${facilityName.replace(/\s+/g, '_')}_emissions_${new Date().toISOString().split('T')[0]}.pdf`)
}
