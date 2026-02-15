import { NextResponse } from 'next/server'
import { buildFactorSet } from '@/lib/factors/registry'
import { computeAllEmissions } from '@/lib/emissions/engine'
import { evaluateScenario } from '@/lib/scenarios/decarbonization'
import type { FacilityProfile } from '@/domain/types/facility'
import type { Intervention } from '@/domain/types/scenario'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { facility, interventions, scenarioName } = body as {
      facility: FacilityProfile
      interventions: Intervention[]
      scenarioName?: string
    }

    if (!facility || !interventions?.length) {
      return NextResponse.json(
        { error: 'facility and interventions are required' },
        { status: 400 },
      )
    }

    const factors = buildFactorSet()
    const baseline = computeAllEmissions(facility, factors)
    const result = evaluateScenario(
      scenarioName ?? 'API Scenario',
      facility,
      factors,
      interventions,
      baseline,
    )

    return NextResponse.json({
      baseline: { total: baseline.total, scope1: baseline.scope1.total, scope2: baseline.scope2Location.total, scope3: baseline.scope3.total },
      scenario: result,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
