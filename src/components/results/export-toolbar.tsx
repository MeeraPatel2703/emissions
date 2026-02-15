'use client'

import { Button } from '@/components/ui/button'
import type { EmissionResult } from '@/domain/types/emissions'
import type { SimulationResult } from '@/domain/types/simulation'
import { downloadCSV } from '@/lib/export/csv'
import { downloadJSON } from '@/lib/export/json-export'
import { downloadPDF } from '@/lib/export/pdf'

interface Props {
  result: EmissionResult
  facilityName: string
  simulation?: SimulationResult | null
}

export function ExportToolbar({ result, facilityName, simulation }: Props) {
  return (
    <div className="flex gap-2">
      <button
        className="text-xs uppercase tracking-wider opacity-60 hover:opacity-100 transition-opacity"
        onClick={() => downloadPDF(result, facilityName, simulation)}
      >
        [PDF]
      </button>
      <button
        className="text-xs uppercase tracking-wider opacity-60 hover:opacity-100 transition-opacity"
        onClick={() => downloadCSV(result, facilityName)}
      >
        [CSV]
      </button>
      <button
        className="text-xs uppercase tracking-wider opacity-60 hover:opacity-100 transition-opacity"
        onClick={() => downloadJSON(result, facilityName, simulation)}
      >
        [JSON]
      </button>
    </div>
  )
}
