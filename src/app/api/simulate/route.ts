import { NextRequest, NextResponse } from 'next/server'
import { buildFactorSet } from '@/lib/factors/registry'
import { runMonteCarloSimulation } from '@/lib/simulation/monte-carlo'
import type { FacilityProfile } from '@/domain/types/facility'
import { z } from 'zod/v4'

const simulateSchema = z.object({
  facility: z.any(), // FacilityProfile — validated at engine level
  runs: z.number().int().min(100).max(50000).default(1000),
  seed: z.number().int().default(42),
  confidenceLevel: z.number().min(0.5).max(0.999).default(0.95),
  histogramBins: z.number().int().min(10).max(200).default(50),
})

/** POST /api/simulate — run Monte Carlo simulation */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = simulateSchema.parse(body)

    const factors = buildFactorSet()

    const result = runMonteCarloSimulation(
      validated.facility as FacilityProfile,
      factors,
      {
        runs: validated.runs,
        seed: validated.seed,
        confidenceLevel: validated.confidenceLevel,
        histogramBins: validated.histogramBins,
      },
    )

    return NextResponse.json(result)
  } catch (error: any) {
    if (error?.issues) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('Simulation failed:', error)
    return NextResponse.json({ error: 'Simulation failed' }, { status: 500 })
  }
}
