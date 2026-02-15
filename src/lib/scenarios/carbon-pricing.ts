/**
 * Carbon Pricing Simulation
 *
 * Models the financial impact of carbon prices on facility emissions.
 * Includes Social Cost of Carbon, EU ETS, and internal carbon price scenarios.
 */

import type { CarbonPriceScenario } from '@/domain/types/scenario'

export const CARBON_PRICE_SCENARIOS: Record<string, CarbonPriceScenario> = {
  us_scc_low: {
    name: 'US Social Cost of Carbon (Low)',
    pricePerTon: 51,
    annualEscalation: 0.02,
  },
  us_scc_central: {
    name: 'US Social Cost of Carbon (Central)',
    pricePerTon: 190,
    annualEscalation: 0.02,
  },
  us_scc_high: {
    name: 'US Social Cost of Carbon (High)',
    pricePerTon: 340,
    annualEscalation: 0.02,
  },
  eu_ets_current: {
    name: 'EU ETS (Current ~€65)',
    pricePerTon: 70,
    annualEscalation: 0.05,
  },
  eu_ets_projected: {
    name: 'EU ETS (2030 Projected ~€100)',
    pricePerTon: 100,
    annualEscalation: 0.03,
  },
  internal_low: {
    name: 'Internal Carbon Price (Low)',
    pricePerTon: 25,
    annualEscalation: 0.03,
  },
  internal_high: {
    name: 'Internal Carbon Price (High)',
    pricePerTon: 100,
    annualEscalation: 0.05,
  },
}

export interface CarbonCostProjection {
  year: number
  carbonPrice: number        // $/tCO2e
  emissions: number          // tCO2e
  annualCost: number         // USD
  cumulativeCost: number     // USD
}

/**
 * Project carbon costs over a given period.
 * @param annualEmissions - Current annual emissions in tCO2e
 * @param scenario - Carbon price scenario
 * @param years - Number of years to project
 * @param emissionsDeclineRate - Annual emissions decline rate (e.g., 0.03 for 3%/yr from decarbonization)
 */
export function projectCarbonCosts(
  annualEmissions: number,
  scenario: CarbonPriceScenario,
  years: number = 10,
  emissionsDeclineRate: number = 0,
): CarbonCostProjection[] {
  const currentYear = new Date().getFullYear()
  const projections: CarbonCostProjection[] = []
  let cumulativeCost = 0

  for (let i = 0; i < years; i++) {
    const carbonPrice = scenario.pricePerTon * Math.pow(1 + scenario.annualEscalation, i)
    const emissions = annualEmissions * Math.pow(1 - emissionsDeclineRate, i)
    const annualCost = emissions * carbonPrice
    cumulativeCost += annualCost

    projections.push({
      year: currentYear + i,
      carbonPrice: Math.round(carbonPrice * 100) / 100,
      emissions: Math.round(emissions * 100) / 100,
      annualCost: Math.round(annualCost),
      cumulativeCost: Math.round(cumulativeCost),
    })
  }

  return projections
}
