/**
 * Scope 2 — Location-Based Electricity Emissions
 *
 * Calculates emissions from purchased electricity using regional grid average emission factors.
 *
 * @methodology GHG Protocol Scope 2 Guidance, Location-Based Method
 * @formula CO2e = kWh × grid_EF (kg CO2e/kWh) × (1 + T&D_loss_pct)
 * @source EPA eGRID2023 (US subregional factors)
 * @source IEA (international grid factors)
 * @uncertainty_class Low-Medium (±5% for grid EFs due to inter-annual variability)
 */

import type { FacilityProfile } from '@/domain/types/facility'
import type { GridElectricityFactors } from '@/domain/types/factors'
import type { CategoryBreakdown } from '@/domain/types/emissions'
import { DEFAULT_TND_LOSS_PCT } from '@/domain/constants'

interface LocationBasedResult {
  total_co2e_tonnes: number
  categories: CategoryBreakdown[]
  gridFactor: number           // the actual kg CO2e/kWh used
  subregion: string | null
}

export function calculateLocationBased(
  facility: FacilityProfile,
  gridFactors: GridElectricityFactors,
): LocationBasedResult {
  const electricity = facility.energy.electricity
  if (!electricity || electricity.quantity <= 0) {
    return { total_co2e_tonnes: 0, categories: [], gridFactor: 0, subregion: null }
  }

  const kWh = electricity.quantity

  // Resolve grid emission factor
  const { factor, subregion, source } = resolveGridFactor(facility, gridFactors)

  // Resolve T&D loss percentage
  const tndLoss = subregion
    ? (gridFactors.subregions[subregion]?.grid_gross_loss_pct ?? DEFAULT_TND_LOSS_PCT)
    : DEFAULT_TND_LOSS_PCT

  // Location-based: multiply kWh by grid factor
  // T&D losses are included to capture full Scope 2 impact
  const co2e_kg = kWh * factor * (1 + tndLoss)
  const co2e_tonnes = co2e_kg / 1000

  const categories: CategoryBreakdown[] = [{
    scope: 2,
    category: 'grid_electricity_location',
    subcategory: subregion ?? 'national_average',
    value: co2e_tonnes,
    dataQuality: electricity.dataQuality,
    methodology: `${kWh.toLocaleString()} kWh × ${factor.toFixed(4)} kg/kWh × (1 + ${(tndLoss * 100).toFixed(1)}% T&D)`,
    source,
  }]

  return { total_co2e_tonnes: co2e_tonnes, categories, gridFactor: factor, subregion }
}

/**
 * Resolve the appropriate grid emission factor based on facility location.
 * Priority: explicit eGRID subregion > state lookup > country > US national average
 */
function resolveGridFactor(
  facility: FacilityProfile,
  gridFactors: GridElectricityFactors,
): { factor: number; subregion: string | null; source: string } {
  // 1. Explicit eGRID subregion
  if (facility.location.egridSubregion) {
    const sr = gridFactors.subregions[facility.location.egridSubregion]
    if (sr) {
      return {
        factor: sr.co2e_kg_per_kwh,
        subregion: facility.location.egridSubregion,
        source: `eGRID2023, subregion ${facility.location.egridSubregion}`,
      }
    }
  }

  // 2. State lookup → eGRID subregion
  if (facility.location.state && facility.location.country === 'US') {
    const subregion = gridFactors.stateToSubregion[facility.location.state.toUpperCase()]
    if (subregion && gridFactors.subregions[subregion]) {
      return {
        factor: gridFactors.subregions[subregion].co2e_kg_per_kwh,
        subregion,
        source: `eGRID2023, subregion ${subregion} (from state ${facility.location.state})`,
      }
    }
  }

  // 3. International grid factor by country
  if (facility.location.country && facility.location.country !== 'US') {
    const intl = gridFactors.international[facility.location.country]
    if (intl) {
      return {
        factor: intl.co2e_kg_per_kwh,
        subregion: null,
        source: `International grid factor: ${facility.location.country}`,
      }
    }
  }

  // 4. US national average fallback
  const usAvg = gridFactors.international['US_national_average']
  return {
    factor: usAvg?.co2e_kg_per_kwh ?? 0.3716,
    subregion: null,
    source: 'eGRID2023, US national average (fallback)',
  }
}
