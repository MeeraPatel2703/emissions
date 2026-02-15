/**
 * Recommendation Engine
 *
 * Rule-based (not ML) for determinism and explainability.
 * Identifies the largest emission drivers and ranks interventions
 * by cost-effectiveness.
 */

import type { EmissionResult } from '@/domain/types/emissions'
import type { Intervention, InterventionResult } from '@/domain/types/scenario'

export interface Recommendation {
  rank: number
  intervention: Intervention
  annualReduction: number          // tCO2e/year
  costPerTonne: number             // $/tCO2e
  paybackYears: number
  rationale: string
  impact: 'high' | 'medium' | 'low'
}

/**
 * Generate top decarbonization recommendations for a facility.
 * Returns up to 5 recommendations ranked by cost-effectiveness ($/tCO2e).
 */
export function generateRecommendations(
  baseline: EmissionResult,
  interventionResults: { intervention: Intervention; result: InterventionResult }[],
): Recommendation[] {
  const recommendations: Recommendation[] = []

  for (const { intervention, result } of interventionResults) {
    if (result.annualEmissionReduction <= 0) continue

    const costPerTonne = result.capex > 0
      ? result.capex / (result.annualEmissionReduction * 10) // Amortized over 10 years
      : Math.abs(result.annualOpexChange) / result.annualEmissionReduction

    const paybackYears = result.annualOpexChange < 0
      ? result.capex / Math.abs(result.annualOpexChange)
      : Infinity

    const reductionPct = baseline.total > 0 ? result.annualEmissionReduction / baseline.total : 0
    const impact: 'high' | 'medium' | 'low' = reductionPct > 0.15 ? 'high' : reductionPct > 0.05 ? 'medium' : 'low'

    recommendations.push({
      rank: 0,
      intervention,
      annualReduction: result.annualEmissionReduction,
      costPerTonne,
      paybackYears,
      rationale: buildRationale(intervention, result, baseline),
      impact,
    })
  }

  // Sort by cost-effectiveness (lowest $/tCO2e first; negative = savings)
  recommendations.sort((a, b) => a.costPerTonne - b.costPerTonne)

  // Assign ranks
  recommendations.forEach((r, i) => { r.rank = i + 1 })

  return recommendations.slice(0, 5)
}

function buildRationale(
  intervention: Intervention,
  result: InterventionResult,
  baseline: EmissionResult,
): string {
  const pct = ((result.annualEmissionReduction / baseline.total) * 100).toFixed(1)

  switch (intervention.type) {
    case 'renewable_switch':
      return `Switching to renewable electricity reduces Scope 2 emissions by ${pct}% with zero upfront capital investment.`
    case 'fleet_electrification':
      return `Electrifying ${((intervention.params.electrificationPct ?? 0.5) * 100).toFixed(0)}% of the fleet eliminates ${pct}% of total emissions. Fuel savings offset the EV premium within the payback period.`
    case 'hvac_upgrade':
      return `Upgrading HVAC efficiency from COP ${intervention.params.oldCOP ?? 2.5} to ${intervention.params.newCOP ?? 4.0} reduces heating/cooling energy by ${pct}% of total emissions.`
    case 'solar_onsite':
      return `Rooftop solar displaces grid electricity, reducing emissions by ${pct}%. Federal ITC may reduce CapEx by 30%.`
    case 'building_envelope':
      return `Improving insulation reduces heating and cooling loads, cutting ${pct}% of total emissions.`
    case 'waste_reduction':
      return `Diverting waste from landfill eliminates methane generation, reducing Scope 3 by ${pct}% of total.`
    default:
      return `This intervention reduces emissions by ${pct}% annually.`
  }
}

/**
 * Identify the single largest emission driver.
 */
export function identifyLargestDriver(baseline: EmissionResult): {
  category: string
  value: number
  pctOfTotal: number
  description: string
} {
  if (baseline.breakdown.length === 0) {
    return { category: 'none', value: 0, pctOfTotal: 0, description: 'No emissions calculated.' }
  }

  // Aggregate by top-level category
  const categoryTotals: Record<string, number> = {}
  for (const cat of baseline.breakdown) {
    const key = cat.category
    categoryTotals[key] = (categoryTotals[key] ?? 0) + cat.value
  }

  const sorted = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])
  const [category, value] = sorted[0]
  const pctOfTotal = baseline.total > 0 ? value / baseline.total : 0

  const descriptions: Record<string, string> = {
    stationary_combustion: 'On-site fuel combustion (natural gas, diesel)',
    mobile_combustion: 'Company-owned fleet vehicles',
    fugitive_emissions: 'Refrigerant leakage from HVAC/cooling equipment',
    grid_electricity_location: 'Purchased grid electricity',
    grid_electricity_market: 'Purchased electricity (market-based)',
    scope3_cat1: 'Purchased goods and services',
    scope3_cat3: 'Fuel and energy-related activities (upstream)',
    scope3_cat5: 'Waste generated in operations',
    scope3_cat6: 'Business travel',
    scope3_cat7: 'Employee commuting',
  }

  return {
    category,
    value,
    pctOfTotal,
    description: descriptions[category] ?? category,
  }
}
