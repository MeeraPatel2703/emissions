/**
 * Scope 2 — Market-Based Electricity Emissions
 *
 * Calculates emissions using market-based hierarchy per GHG Protocol Scope 2 Guidance:
 * 1. Supplier-specific emission factor (if provided by utility)
 * 2. Renewable energy certificates (RECs) — zero-rate the renewable portion
 * 3. Residual mix factor (Green-e or eGRID subregion as proxy)
 *
 * @methodology GHG Protocol Scope 2 Guidance (2015), Market-Based Method
 * @formula CO2e_market = kWh_non_renewable × EF_residual
 * @formula CO2e_renewable = 0 (covered by RECs or PPAs)
 * @source GHG Protocol Scope 2 Quality Criteria
 * @uncertainty_class Medium (depends on REC quality and residual mix accuracy)
 */

import type { FacilityProfile } from '@/domain/types/facility'
import type { GridElectricityFactors } from '@/domain/types/factors'
import type { CategoryBreakdown } from '@/domain/types/emissions'
import { DEFAULT_TND_LOSS_PCT } from '@/domain/constants'

interface MarketBasedResult {
  total_co2e_tonnes: number
  categories: CategoryBreakdown[]
}

export function calculateMarketBased(
  facility: FacilityProfile,
  gridFactors: GridElectricityFactors,
): MarketBasedResult {
  const electricity = facility.energy.electricity
  if (!electricity || electricity.quantity <= 0) {
    return { total_co2e_tonnes: 0, categories: [] }
  }

  const kWh = electricity.quantity
  const categories: CategoryBreakdown[] = []
  let total = 0

  // Check if supplier-specific EF is provided
  if (electricity.supplierEF !== undefined && electricity.supplierEF !== null) {
    // Use supplier-specific factor for all kWh
    const co2e_kg = kWh * electricity.supplierEF
    const co2e_tonnes = co2e_kg / 1000

    categories.push({
      scope: 2,
      category: 'grid_electricity_market',
      subcategory: 'supplier_specific',
      value: co2e_tonnes,
      dataQuality: electricity.dataQuality,
      methodology: `${kWh.toLocaleString()} kWh × ${electricity.supplierEF.toFixed(4)} kg/kWh (supplier-specific)`,
      source: 'Supplier-specific emission factor (GHG Protocol Scope 2 Guidance, Hierarchy Level 1)',
    })

    return { total_co2e_tonnes: co2e_tonnes, categories }
  }

  // If electricity is marked as renewable (covered by RECs or PPA)
  if (electricity.isRenewable) {
    categories.push({
      scope: 2,
      category: 'grid_electricity_market',
      subcategory: 'renewable_rec',
      value: 0,
      dataQuality: electricity.dataQuality,
      methodology: `${kWh.toLocaleString()} kWh × 0 kg/kWh (100% covered by RECs/PPA)`,
      source: 'GHG Protocol Scope 2 Guidance — REC/PPA accounting',
    })

    return { total_co2e_tonnes: 0, categories }
  }

  // Fallback: use eGRID subregion factor as proxy for residual mix
  // In practice, the residual mix factor differs from grid average, but eGRID is
  // the best publicly available proxy for US facilities.
  const { factor, source } = resolveResidualMixFactor(facility, gridFactors)

  const tndLoss = DEFAULT_TND_LOSS_PCT
  const co2e_kg = kWh * factor * (1 + tndLoss)
  const co2e_tonnes = co2e_kg / 1000

  categories.push({
    scope: 2,
    category: 'grid_electricity_market',
    subcategory: 'residual_mix',
    value: co2e_tonnes,
    dataQuality: electricity.dataQuality,
    methodology: `${kWh.toLocaleString()} kWh × ${factor.toFixed(4)} kg/kWh (residual mix proxy)`,
    source,
  })

  return { total_co2e_tonnes: co2e_tonnes, categories }
}

function resolveResidualMixFactor(
  facility: FacilityProfile,
  gridFactors: GridElectricityFactors,
): { factor: number; source: string } {
  // Use eGRID subregion or state mapping as proxy
  if (facility.location.egridSubregion) {
    const sr = gridFactors.subregions[facility.location.egridSubregion]
    if (sr) {
      return {
        factor: sr.co2e_kg_per_kwh,
        source: `eGRID2023 ${facility.location.egridSubregion} (residual mix proxy)`,
      }
    }
  }

  if (facility.location.state && facility.location.country === 'US') {
    const subregion = gridFactors.stateToSubregion[facility.location.state.toUpperCase()]
    if (subregion && gridFactors.subregions[subregion]) {
      return {
        factor: gridFactors.subregions[subregion].co2e_kg_per_kwh,
        source: `eGRID2023 ${subregion} via state ${facility.location.state} (residual mix proxy)`,
      }
    }
  }

  // International or fallback
  if (facility.location.country !== 'US') {
    const intl = gridFactors.international[facility.location.country]
    if (intl) {
      return {
        factor: intl.co2e_kg_per_kwh,
        source: `International grid factor: ${facility.location.country} (residual mix proxy)`,
      }
    }
  }

  return {
    factor: gridFactors.international['US_national_average']?.co2e_kg_per_kwh ?? 0.3716,
    source: 'US national average (residual mix proxy, fallback)',
  }
}
