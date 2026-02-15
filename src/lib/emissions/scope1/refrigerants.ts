/**
 * Scope 1 — Fugitive Emissions from Refrigerants
 *
 * Calculates CO2e from refrigerant leakage using GWP-100 values.
 *
 * @methodology GHG Protocol Corporate Standard, Chapter 8: Fugitive Emissions
 * @formula CO2e = charge_kg × annual_leak_rate × GWP_100
 * @source IPCC AR6 WG1, Table 7.SM.7 (GWP-100 values)
 * @source EPA Vintaging Model (default leak rates by equipment type)
 * @uncertainty_class High (±20% for charge estimates, ±50% for leak rate estimates)
 */

import type { RefrigerantInput } from '@/domain/types/facility'
import type { RefrigerantGWPFactors } from '@/domain/types/factors'
import type { CategoryBreakdown } from '@/domain/types/emissions'

interface RefrigerantResult {
  total_co2e_tonnes: number
  categories: CategoryBreakdown[]
}

export function calculateRefrigerantEmissions(
  refrigerants: RefrigerantInput[],
  factors: RefrigerantGWPFactors,
): RefrigerantResult {
  const categories: CategoryBreakdown[] = []
  let total = 0

  for (const ref of refrigerants) {
    if (ref.chargeAmount <= 0) continue

    const gwpEntry = factors.gases[ref.refrigerantType]
    if (!gwpEntry) {
      // Unknown refrigerant — skip but log
      console.warn(`Unknown refrigerant type: ${ref.refrigerantType}. Skipping.`)
      continue
    }

    const gwp = gwpEntry.gwp100

    // Use provided leak rate, or look up default by equipment type
    let leakRate = ref.annualLeakRate
    if (leakRate <= 0 && ref.equipmentType) {
      leakRate = factors.defaultLeakRates[ref.equipmentType] ?? 0.05
    }
    if (leakRate <= 0) {
      leakRate = 0.05 // 5% default per EPA
    }

    // CO2e = charge (kg) × leak rate × GWP / 1000 (to get tonnes)
    const leakedKg = ref.chargeAmount * leakRate
    const co2e_tonnes = (leakedKg * gwp) / 1000

    categories.push({
      scope: 1,
      category: 'fugitive_emissions',
      subcategory: ref.refrigerantType,
      value: co2e_tonnes,
      dataQuality: ref.dataQuality,
      methodology: `${ref.chargeAmount} kg × ${(leakRate * 100).toFixed(1)}% leak × GWP ${gwp}`,
      source: 'IPCC AR6 Table 7.SM.7; EPA Vintaging Model',
    })

    total += co2e_tonnes
  }

  return { total_co2e_tonnes: total, categories }
}
