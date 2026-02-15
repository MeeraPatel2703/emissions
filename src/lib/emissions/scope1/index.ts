/**
 * Scope 1 — Direct Emissions Aggregator
 *
 * Combines stationary combustion, mobile combustion, and fugitive emissions.
 */

import type { FacilityProfile } from '@/domain/types/facility'
import type { EmissionFactorSet } from '@/domain/types/factors'
import type { ScopeResult } from '@/domain/types/emissions'
import { calculateStationaryCombustion } from './stationary-combustion'
import { calculateMobileCombustion } from './mobile-combustion'
import { calculateRefrigerantEmissions } from './refrigerants'

export function calculateScope1(
  facility: FacilityProfile,
  factors: EmissionFactorSet,
): ScopeResult {
  const stationary = calculateStationaryCombustion(facility.energy, factors.stationaryCombustion)
  const mobile = calculateMobileCombustion(facility.fleet, factors.mobileCombustion)
  const refrigerant = calculateRefrigerantEmissions(facility.refrigerants, factors.refrigerantGWP)

  const allCategories = [
    ...stationary.categories,
    ...mobile.categories,
    ...refrigerant.categories,
  ]

  const total =
    stationary.total_co2e_tonnes +
    mobile.total_co2e_tonnes +
    refrigerant.total_co2e_tonnes

  return { total, categories: allCategories }
}
