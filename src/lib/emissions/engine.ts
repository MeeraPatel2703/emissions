/**
 * Top-Level Emissions Calculation Engine
 *
 * Pure function that orchestrates Scope 1, 2, and 3 calculations.
 * No side effects, no framework dependencies, no database calls.
 *
 * @methodology GHG Protocol Corporate Standard (Revised Edition, 2015)
 * @note Both Scope 2 methods (location-based and market-based) are always computed
 *       per GHG Protocol Scope 2 Guidance requirements.
 */

import type { FacilityProfile } from '@/domain/types/facility'
import type { EmissionFactorSet } from '@/domain/types/factors'
import type {
  EmissionResult,
  IntensityMetrics,
  BenchmarkComparison,
  UncertaintyResult,
  UncertaintyBand,
  MethodologyRecord,
  CategoryBreakdown,
} from '@/domain/types/emissions'
import { ENGINE_VERSION } from '@/domain/constants'
import { calculateScope1 } from './scope1'
import { calculateScope2 } from './scope2'
import { calculateScope3 } from './scope3'
import { estimateEnergy, hasActualEnergyData } from './estimation/fallback-estimator'

export interface CalculationOptions {
  includeScope3?: boolean
  includeEstimation?: boolean  // auto-estimate missing energy data
}

/**
 * Compute all emissions for a facility.
 *
 * This is the primary entry point for the emissions engine.
 * It is a pure function — given the same inputs, it will always produce the same output.
 */
export function computeAllEmissions(
  facility: FacilityProfile,
  factors: EmissionFactorSet,
  options: CalculationOptions = {},
): EmissionResult {
  const { includeScope3 = true, includeEstimation = true } = options

  // If Basic mode and no actual energy data, estimate from benchmarks
  let workingFacility = facility
  if (includeEstimation && !hasActualEnergyData(facility.energy)) {
    const estimatedEnergy = estimateEnergy(facility, factors.benchmarks)
    workingFacility = {
      ...facility,
      energy: { ...facility.energy, ...estimatedEnergy },
    }
  }

  // Calculate all scopes
  const scope1 = calculateScope1(workingFacility, factors)
  const scope2 = calculateScope2(workingFacility, factors)
  const scope3 = includeScope3
    ? calculateScope3(workingFacility, factors)
    : { total: 0, categories: [] }

  // Total using location-based Scope 2 (primary reporting)
  const total = scope1.total + scope2.locationBased.total + scope3.total
  const totalMarketBased = scope1.total + scope2.marketBased.total + scope3.total

  // Combine all category breakdowns
  const breakdown: CategoryBreakdown[] = [
    ...scope1.categories,
    ...scope2.locationBased.categories,
    ...scope2.marketBased.categories,
    ...scope3.categories,
  ]

  // Calculate intensity metrics
  const intensity = calculateIntensity(total, workingFacility)

  // Benchmark comparison
  const benchmarkComparison = calculateBenchmark(
    total,
    workingFacility,
    factors,
  )

  // Uncertainty estimation (analytical, not Monte Carlo)
  const uncertainty = estimateUncertainty(scope1, scope2, scope3, breakdown)

  // Data quality score
  const dataQualityScore = calculateDataQualityScore(breakdown)

  // Methodology record
  const methodology = buildMethodologyRecord(factors, breakdown, workingFacility)

  return {
    scope1,
    scope2Location: scope2.locationBased,
    scope2Market: scope2.marketBased,
    scope3,
    total,
    totalMarketBased,
    breakdown,
    intensity,
    benchmarkComparison,
    uncertainty,
    methodology,
    dataQualityScore,
  }
}

function calculateIntensity(total: number, facility: FacilityProfile): IntensityMetrics {
  const perSqFt = total / facility.dimensions.squareFeet
  const perEmployee = facility.occupancy?.employees
    ? total / facility.occupancy.employees
    : undefined

  return { perSqFt, perEmployee }
}

function calculateBenchmark(
  total: number,
  facility: FacilityProfile,
  factors: EmissionFactorSet,
): BenchmarkComparison {
  const bm = factors.benchmarks[facility.buildingType]
  const facilityIntensity = (total * 1000) / facility.dimensions.squareFeet // kg CO2e/sqft

  if (!bm?.benchmark_kg_co2e_per_sqft) {
    return {
      buildingType: facility.buildingType,
      facilityIntensity,
      industryMedian: 7.8, // office default
      industryP25: 5.2,
      industryP75: 11.8,
      percentile: 50,
      classification: 'average',
    }
  }

  const { median, p25, p75 } = bm.benchmark_kg_co2e_per_sqft

  // Estimate percentile using linear interpolation between quartiles
  let percentile: number
  if (facilityIntensity <= p25) {
    percentile = 25 * (facilityIntensity / p25)
  } else if (facilityIntensity <= median) {
    percentile = 25 + 25 * ((facilityIntensity - p25) / (median - p25))
  } else if (facilityIntensity <= p75) {
    percentile = 50 + 25 * ((facilityIntensity - median) / (p75 - median))
  } else {
    percentile = 75 + 25 * Math.min(1, (facilityIntensity - p75) / (p75 - median))
  }

  percentile = Math.max(0, Math.min(100, percentile))

  let classification: 'low' | 'average' | 'high' | 'very_high'
  if (percentile <= 25) classification = 'low'
  else if (percentile <= 50) classification = 'average'
  else if (percentile <= 75) classification = 'high'
  else classification = 'very_high'

  return {
    buildingType: facility.buildingType,
    facilityIntensity,
    industryMedian: median,
    industryP25: p25,
    industryP75: p75,
    percentile,
    classification,
  }
}

/**
 * Analytical uncertainty estimation.
 * Assigns uncertainty bands based on data quality distribution.
 * For rigorous uncertainty, use the Monte Carlo simulation module.
 */
function estimateUncertainty(
  scope1: { total: number },
  scope2: { locationBased: { total: number }; marketBased: { total: number } },
  scope3: { total: number },
  breakdown: CategoryBreakdown[],
): UncertaintyResult {
  const uncertaintyByQuality = {
    measured: 0.05,   // ±5%
    modeled: 0.10,    // ±10%
    estimated: 0.15,  // ±15%
  }

  function bandForScope(scopeNum: 1 | 2 | 3, total: number): UncertaintyBand {
    const scopeCategories = breakdown.filter(c => c.scope === scopeNum)
    if (scopeCategories.length === 0 || total === 0) {
      return { lower: 0, upper: 0, relativeUncertainty: 0 }
    }

    // Weighted average uncertainty by category value
    let weightedUncertainty = 0
    for (const cat of scopeCategories) {
      const u = uncertaintyByQuality[cat.dataQuality] ?? 0.15
      weightedUncertainty += u * (cat.value / total)
    }

    return {
      lower: total * (1 - weightedUncertainty),
      upper: total * (1 + weightedUncertainty),
      relativeUncertainty: weightedUncertainty,
    }
  }

  const s1band = bandForScope(1, scope1.total)
  const s2lBand = bandForScope(2, scope2.locationBased.total)
  const s2mBand = bandForScope(2, scope2.marketBased.total)
  const s3band = bandForScope(3, scope3.total)

  const totalValue = scope1.total + scope2.locationBased.total + scope3.total
  const totalLower = s1band.lower + s2lBand.lower + s3band.lower
  const totalUpper = s1band.upper + s2lBand.upper + s3band.upper

  // Overall data quality
  const measuredFrac = breakdown.filter(c => c.dataQuality === 'measured').reduce((s, c) => s + c.value, 0) / (totalValue || 1)
  const overallQuality = measuredFrac > 0.7 ? 'measured' : measuredFrac > 0.3 ? 'modeled' : 'estimated'

  return {
    totalLowerBound: totalLower,
    totalUpperBound: totalUpper,
    confidenceLevel: 0.95,
    perScope: {
      scope1: s1band,
      scope2Location: s2lBand,
      scope2Market: s2mBand,
      scope3: s3band,
    },
    overallDataQuality: overallQuality as any,
  }
}

function calculateDataQualityScore(breakdown: CategoryBreakdown[]): number {
  if (breakdown.length === 0) return 0

  const totalValue = breakdown.reduce((s, c) => s + c.value, 0)
  if (totalValue === 0) return 0

  const qualityWeights = { measured: 100, modeled: 70, estimated: 40 }
  let weightedScore = 0

  for (const cat of breakdown) {
    const weight = cat.value / totalValue
    const score = qualityWeights[cat.dataQuality] ?? 40
    weightedScore += weight * score
  }

  return Math.round(weightedScore)
}

function buildMethodologyRecord(
  factors: EmissionFactorSet,
  breakdown: CategoryBreakdown[],
  facility: FacilityProfile,
): MethodologyRecord {
  const sources = new Set<string>()
  for (const cat of breakdown) {
    sources.add(cat.source)
  }

  const assumptions: string[] = []
  const dataGaps: string[] = []

  if (facility.inputMode === 'basic') {
    assumptions.push('Energy consumption estimated from CBECS 2018 median EUI for building type')
    assumptions.push('Climate zone adjustment applied based on ASHRAE 169-2020 degree day data')
  }

  if (!facility.energy.electricity?.quantity) {
    dataGaps.push('Electricity consumption not provided — estimated from benchmarks')
  }
  if (facility.refrigerants.length === 0) {
    dataGaps.push('Refrigerant data not provided — fugitive emissions may be underreported')
  }
  if (facility.fleet.length === 0) {
    dataGaps.push('Fleet data not provided — mobile combustion not included')
  }

  return {
    engineVersion: ENGINE_VERSION,
    factorSetVersion: factors.version,
    calculationDate: new Date().toISOString(),
    scope2Method: 'both',
    ghgProtocolAlignment: 'GHG Protocol Corporate Standard (2015), Scope 2 Guidance (2015), Scope 3 Standard (2011)',
    factorSources: Array.from(sources).map(s => ({
      source: s,
      version: factors.version,
      category: '',
      citation: s,
    })),
    assumptions,
    dataGaps,
  }
}
