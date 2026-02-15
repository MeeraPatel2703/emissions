/**
 * Uncertainty Specification Module
 *
 * Maps each input parameter type and data quality level to a probability distribution
 * for Monte Carlo sampling. Grounded in IPCC Tier 2 uncertainty guidance.
 *
 * @source IPCC 2006 Guidelines, Volume 1, Chapter 3: Uncertainties
 * @source Winrock International, Uncertainty Analysis (2017)
 * @source Frontiers in Environmental Science, Monte Carlo Method for GHG EFs (2022)
 */

import type { DataQuality } from '@/domain/types/facility'
import type { UncertaintySpec, DistributionType } from '@/domain/types/simulation'
import { sampleNormal, sampleLognormal, sampleTriangular, sampleUniform } from './distributions'

type ParameterType =
  | 'energy_measured'       // Utility bill data
  | 'energy_estimated'      // Estimated from benchmarks
  | 'stationary_ef'         // Combustion emission factors
  | 'grid_ef'               // Grid electricity emission factors
  | 'refrigerant_charge'    // Refrigerant charge amount
  | 'refrigerant_leak_rate' // Refrigerant leak rate
  | 'fleet_mileage'         // Fleet annual mileage
  | 'fleet_fuel_economy'    // Fleet MPG
  | 'scope3_spend'          // Spend-based EEIO factors
  | 'scope3_distance'       // Distance-based travel/commute
  | 'waste_quantity'         // Waste amounts
  | 'water_quantity'         // Water usage
  | 'gwp'                   // GWP values (treated as fixed per GHG Protocol)

/**
 * Uncertainty specifications by parameter type.
 *
 * These are calibrated from published literature:
 * - Stationary combustion EFs: well-characterized, ±1-3% (IPCC)
 * - Grid EFs: inter-annual variability ±5% (eGRID analysis)
 * - Refrigerant leak rates: high uncertainty ±50% (EPA Vintaging Model)
 * - EEIO spend factors: very high uncertainty ±30% (USEEIO documentation)
 */
const UNCERTAINTY_SPECS: Record<ParameterType, UncertaintySpec> = {
  energy_measured: {
    distribution: 'normal',
    relativeUncertainty: 0.025,  // ±2.5% — meter accuracy + billing rounding
  },
  energy_estimated: {
    distribution: 'lognormal',
    relativeUncertainty: 0.15,   // ±15% — CBECS benchmark variability
  },
  stationary_ef: {
    distribution: 'normal',
    relativeUncertainty: 0.01,   // ±1% — well-characterized fuel EFs
  },
  grid_ef: {
    distribution: 'normal',
    relativeUncertainty: 0.05,   // ±5% — inter-annual grid mix variability
  },
  refrigerant_charge: {
    distribution: 'normal',
    relativeUncertainty: 0.20,   // ±20% — equipment specs vary
  },
  refrigerant_leak_rate: {
    distribution: 'triangular',
    relativeUncertainty: 0.50,   // High uncertainty
    minFactor: 0.5,              // min = 50% of default
    maxFactor: 2.0,              // max = 200% of default
  },
  fleet_mileage: {
    distribution: 'normal',
    relativeUncertainty: 0.10,   // ±10% — odometer precision, driver variability
  },
  fleet_fuel_economy: {
    distribution: 'normal',
    relativeUncertainty: 0.08,   // ±8% — driving conditions
  },
  scope3_spend: {
    distribution: 'lognormal',
    relativeUncertainty: 0.30,   // ±30% — EEIO factors have high uncertainty
  },
  scope3_distance: {
    distribution: 'normal',
    relativeUncertainty: 0.15,   // ±15% — self-reported travel data
  },
  waste_quantity: {
    distribution: 'normal',
    relativeUncertainty: 0.20,   // ±20% — waste measurement imprecision
  },
  water_quantity: {
    distribution: 'normal',
    relativeUncertainty: 0.10,   // ±10% — metered water data
  },
  gwp: {
    distribution: 'fixed',
    relativeUncertainty: 0,      // GWP is treated as fixed per GHG Protocol convention
  },
}

/**
 * Get the uncertainty spec for a parameter based on its type and data quality.
 */
export function getUncertaintySpec(paramType: ParameterType): UncertaintySpec {
  return UNCERTAINTY_SPECS[paramType] ?? UNCERTAINTY_SPECS.energy_estimated
}

/**
 * Map data quality to parameter type for energy inputs.
 */
export function energyParamType(dataQuality: DataQuality): ParameterType {
  return dataQuality === 'measured' ? 'energy_measured' : 'energy_estimated'
}

/**
 * Perturb a value according to its uncertainty specification.
 *
 * @param value - Point estimate
 * @param spec - Uncertainty specification
 * @param rng - Seeded random number generator
 * @returns Perturbed value (always >= 0 for physical quantities)
 */
export function perturbValue(value: number, spec: UncertaintySpec, rng: () => number): number {
  if (spec.distribution === 'fixed' || value === 0) return value

  let result: number

  switch (spec.distribution) {
    case 'normal':
      result = sampleNormal(value, value * spec.relativeUncertainty, rng)
      break

    case 'lognormal':
      result = sampleLognormal(value, spec.relativeUncertainty, rng)
      break

    case 'triangular': {
      const minFactor = spec.minFactor ?? (1 - spec.relativeUncertainty)
      const maxFactor = spec.maxFactor ?? (1 + spec.relativeUncertainty)
      result = sampleTriangular(value * minFactor, value, value * maxFactor, rng)
      break
    }

    case 'uniform': {
      const minVal = value * (1 - spec.relativeUncertainty)
      const maxVal = value * (1 + spec.relativeUncertainty)
      result = sampleUniform(minVal, maxVal, rng)
      break
    }

    default:
      result = value
  }

  // Physical quantities cannot be negative
  return Math.max(0, result)
}
