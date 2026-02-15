/**
 * JSON Export — machine-readable schema with full metadata.
 */

import type { EmissionResult } from '@/domain/types/emissions'
import type { SimulationResult } from '@/domain/types/simulation'

interface ExportPayload {
  schema: string
  exportDate: string
  facility: string
  result: EmissionResult
  simulation?: SimulationResult
}

export function generateJSON(
  result: EmissionResult,
  facilityName: string,
  simulation?: SimulationResult | null,
): string {
  const payload: ExportPayload = {
    schema: 'carbon-intelligence-platform/v1',
    exportDate: new Date().toISOString(),
    facility: facilityName,
    result,
    ...(simulation ? { simulation } : {}),
  }

  return JSON.stringify(payload, null, 2)
}

export function downloadJSON(
  result: EmissionResult,
  facilityName: string,
  simulation?: SimulationResult | null,
) {
  const json = generateJSON(result, facilityName, simulation)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${facilityName.replace(/\s+/g, '_')}_emissions_${new Date().toISOString().split('T')[0]}.json`
  link.click()
  URL.revokeObjectURL(url)
}
