/**
 * Scope 2 — Purchased Electricity Emissions Aggregator
 *
 * Per GHG Protocol Scope 2 Guidance, both location-based and market-based
 * methods are always computed and reported.
 */

import type { FacilityProfile } from '@/domain/types/facility'
import type { EmissionFactorSet } from '@/domain/types/factors'
import type { ScopeResult } from '@/domain/types/emissions'
import { calculateLocationBased } from './location-based'
import { calculateMarketBased } from './market-based'

export interface Scope2Result {
  locationBased: ScopeResult
  marketBased: ScopeResult
}

export function calculateScope2(
  facility: FacilityProfile,
  factors: EmissionFactorSet,
): Scope2Result {
  const location = calculateLocationBased(facility, factors.gridElectricity)
  const market = calculateMarketBased(facility, factors.gridElectricity)

  return {
    locationBased: {
      total: location.total_co2e_tonnes,
      categories: location.categories,
    },
    marketBased: {
      total: market.total_co2e_tonnes,
      categories: market.categories,
    },
  }
}
