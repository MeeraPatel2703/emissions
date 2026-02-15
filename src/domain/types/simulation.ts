export interface MonteCarloConfig {
  runs: number             // default 1000
  seed: number             // for reproducibility
  confidenceLevel: number  // default 0.95
  histogramBins: number    // default 50
}

export interface SimulationResult {
  runs: number
  seed: number
  totalEmissions: DistributionSummary
  scope1: DistributionSummary
  scope2Location: DistributionSummary
  scope2Market: DistributionSummary
  scope3: DistributionSummary
  perCategory: Record<string, { mean: number; ci95Lower: number; ci95Upper: number }>
  convergenceDiagnostic: number  // coefficient of variation of running mean
}

export interface DistributionSummary {
  mean: number
  median: number
  stdDev: number
  ci95Lower: number
  ci95Upper: number
  p5: number
  p10: number
  p25: number
  p75: number
  p90: number
  p95: number
  min: number
  max: number
  histogram: HistogramData
}

export interface HistogramData {
  binEdges: number[]
  counts: number[]
}

export type DistributionType = 'normal' | 'lognormal' | 'triangular' | 'uniform' | 'fixed'

export interface UncertaintySpec {
  distribution: DistributionType
  relativeUncertainty: number  // fraction (e.g., 0.05 = ±5%)
  minFactor?: number           // for triangular: min = value * minFactor
  maxFactor?: number           // for triangular: max = value * maxFactor
}
