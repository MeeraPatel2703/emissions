import { NextResponse } from 'next/server'
import { buildFactorSet } from '@/lib/factors/registry'
import { computeAllEmissions } from '@/lib/emissions/engine'
import { generateCSV } from '@/lib/export/csv'
import { generateJSON } from '@/lib/export/json-export'
import type { FacilityProfile } from '@/domain/types/facility'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { facility, format } = body as {
      facility: FacilityProfile
      format: 'csv' | 'json'
    }

    if (!facility) {
      return NextResponse.json({ error: 'facility is required' }, { status: 400 })
    }

    const factors = buildFactorSet()
    const result = computeAllEmissions(facility, factors)
    const name = facility.name || 'facility'

    if (format === 'csv') {
      const csv = generateCSV(result, name)
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${name}_emissions.csv"`,
        },
      })
    }

    const json = generateJSON(result, name)
    return new Response(json, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${name}_emissions.json"`,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
