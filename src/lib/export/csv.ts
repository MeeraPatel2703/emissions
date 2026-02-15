/**
 * CSV Export — one row per emission category.
 *
 * @source GHG Protocol Corporate Standard, Table 1
 */

import type { EmissionResult } from '@/domain/types/emissions'

const HEADERS = [
  'Scope',
  'Category',
  'Subcategory',
  'Emissions (tCO2e)',
  'Data Quality',
  'Methodology',
  'Source',
]

export function generateCSV(result: EmissionResult, facilityName: string): string {
  const rows: string[][] = []

  // Header
  rows.push(HEADERS)

  // Metadata row
  rows.push([
    '# Facility',
    facilityName,
    '',
    `Total: ${result.total.toFixed(2)}`,
    '',
    `Engine: ${result.methodology.engineVersion}`,
    `Factors: ${result.methodology.factorSetVersion}`,
  ])

  // Breakdown rows
  for (const cat of result.breakdown) {
    rows.push([
      `Scope ${cat.scope}`,
      cat.category,
      cat.subcategory ?? '',
      cat.value.toFixed(4),
      cat.dataQuality,
      cat.methodology,
      cat.source,
    ])
  }

  // Summary rows
  rows.push([])
  rows.push(['# Summary'])
  rows.push(['Scope 1 Total', '', '', result.scope1.total.toFixed(4)])
  rows.push(['Scope 2 (Location)', '', '', result.scope2Location.total.toFixed(4)])
  rows.push(['Scope 2 (Market)', '', '', result.scope2Market.total.toFixed(4)])
  rows.push(['Scope 3 Total', '', '', result.scope3.total.toFixed(4)])
  rows.push(['Grand Total (Location)', '', '', result.total.toFixed(4)])
  rows.push(['Grand Total (Market)', '', '', result.totalMarketBased.toFixed(4)])
  rows.push([])
  rows.push(['# Intensity Metrics'])
  rows.push(['tCO2e per sqft', '', '', result.intensity.perSqFt.toFixed(6)])
  if (result.intensity.perEmployee) {
    rows.push(['tCO2e per employee', '', '', result.intensity.perEmployee.toFixed(4)])
  }
  rows.push([])
  rows.push(['# Uncertainty (95% CI)'])
  rows.push(['Lower Bound', '', '', result.uncertainty.totalLowerBound.toFixed(4)])
  rows.push(['Upper Bound', '', '', result.uncertainty.totalUpperBound.toFixed(4)])

  return rows.map(row => row.map(escapeCSV).join(',')).join('\n')
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function downloadCSV(result: EmissionResult, facilityName: string) {
  const csv = generateCSV(result, facilityName)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${facilityName.replace(/\s+/g, '_')}_emissions_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
