import type { DataQuality } from './facility'

/** Top-level result from the emissions engine */
export interface EmissionResult {
  scope1: ScopeResult
  scope2Location: ScopeResult
  scope2Market: ScopeResult
  scope3: ScopeResult
  total: number               // tCO2e (using location-based Scope 2)
  totalMarketBased: number    // tCO2e (using market-based Scope 2)
  breakdown: CategoryBreakdown[]
  intensity: IntensityMetrics
  benchmarkComparison: BenchmarkComparison
  uncertainty: UncertaintyResult
  methodology: MethodologyRecord
  dataQualityScore: number    // 0-100 based on measured vs estimated inputs
}

export interface ScopeResult {
  total: number               // tCO2e
  categories: CategoryBreakdown[]
}

export interface CategoryBreakdown {
  scope: 1 | 2 | 3
  category: string            // e.g., "stationary_combustion", "grid_electricity"
  subcategory?: string        // e.g., "natural_gas", "diesel"
  value: number               // tCO2e
  co2?: number                // tCO2 (direct)
  ch4_co2e?: number           // tCO2e from CH4
  n2o_co2e?: number           // tCO2e from N2O
  dataQuality: DataQuality
  methodology: string         // brief formula description
  source: string              // e.g., "EPA GHG EF Hub 2025, Table 1"
}

export interface IntensityMetrics {
  perSqFt: number             // tCO2e per sqft
  perEmployee?: number        // tCO2e per employee
  perRevenue?: number         // tCO2e per $M revenue
  euiKbtuSqft?: number        // Energy Use Intensity
}

export interface BenchmarkComparison {
  buildingType: string
  facilityIntensity: number   // kg CO2e per sqft
  industryMedian: number
  industryP25: number
  industryP75: number
  percentile: number          // estimated percentile (0-100)
  classification: 'low' | 'average' | 'high' | 'very_high'
}

export interface UncertaintyResult {
  totalLowerBound: number     // tCO2e
  totalUpperBound: number     // tCO2e
  confidenceLevel: number     // 0.95 for 95% CI
  perScope: {
    scope1: UncertaintyBand
    scope2Location: UncertaintyBand
    scope2Market: UncertaintyBand
    scope3: UncertaintyBand
  }
  overallDataQuality: DataQuality
}

export interface UncertaintyBand {
  lower: number
  upper: number
  relativeUncertainty: number // e.g., 0.15 for ±15%
}

export interface MethodologyRecord {
  engineVersion: string
  factorSetVersion: string
  calculationDate: string     // ISO 8601
  scope2Method: 'location-based' | 'market-based' | 'both'
  ghgProtocolAlignment: string
  factorSources: FactorSourceRecord[]
  assumptions: string[]
  dataGaps: string[]
}

export interface FactorSourceRecord {
  source: string
  version: string
  category: string
  citation: string
}

/** GHG breakdown for a single combustion or process */
export interface GHGBreakdown {
  co2_tonnes: number
  ch4_co2e_tonnes: number
  n2o_co2e_tonnes: number
  total_co2e_tonnes: number
}
