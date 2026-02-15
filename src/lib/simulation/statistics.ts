/**
 * Statistical Functions for Monte Carlo Results
 *
 * Computes summary statistics, percentiles, confidence intervals,
 * and histogram bin data from simulation output arrays.
 */

import type { DistributionSummary, HistogramData } from '@/domain/types/simulation'

export function computeMean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

export function computeMedian(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export function computeStdDev(values: number[]): number {
  if (values.length < 2) return 0
  const mean = computeMean(values)
  const sumSquares = values.reduce((sum, v) => sum + (v - mean) ** 2, 0)
  return Math.sqrt(sumSquares / (values.length - 1)) // Bessel's correction
}

/**
 * Compute percentile using linear interpolation (same method as Excel PERCENTILE.INC).
 * @param sorted - Pre-sorted array (ascending)
 * @param p - Percentile as fraction (e.g., 0.95 for 95th)
 */
export function computePercentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  if (sorted.length === 1) return sorted[0]

  const index = p * (sorted.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const weight = index - lower

  if (upper >= sorted.length) return sorted[sorted.length - 1]
  return sorted[lower] * (1 - weight) + sorted[upper] * weight
}

/**
 * Compute confidence interval bounds.
 * @param values - Unsorted array
 * @param level - Confidence level (e.g., 0.95)
 * @returns [lower, upper] bounds
 */
export function computeCI(values: number[], level: number): [number, number] {
  const sorted = [...values].sort((a, b) => a - b)
  const alpha = (1 - level) / 2
  return [
    computePercentile(sorted, alpha),
    computePercentile(sorted, 1 - alpha),
  ]
}

/**
 * Build histogram data for visualization.
 * Returns bin edges and counts suitable for Recharts BarChart.
 */
export function buildHistogram(values: number[], bins: number): HistogramData {
  if (values.length === 0) return { binEdges: [], counts: [] }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1 // Avoid zero range

  const binWidth = range / bins
  const binEdges: number[] = []
  const counts: number[] = new Array(bins).fill(0)

  for (let i = 0; i <= bins; i++) {
    binEdges.push(min + i * binWidth)
  }

  for (const v of values) {
    let binIndex = Math.floor((v - min) / binWidth)
    if (binIndex >= bins) binIndex = bins - 1 // Include max in last bin
    counts[binIndex]++
  }

  return { binEdges, counts }
}

/**
 * Build a complete DistributionSummary from an array of values.
 */
export function buildDistributionSummary(values: number[], histogramBins: number): DistributionSummary {
  const sorted = [...values].sort((a, b) => a - b)

  return {
    mean: computeMean(values),
    median: computeMedian(values),
    stdDev: computeStdDev(values),
    ci95Lower: computePercentile(sorted, 0.025),
    ci95Upper: computePercentile(sorted, 0.975),
    p5: computePercentile(sorted, 0.05),
    p10: computePercentile(sorted, 0.10),
    p25: computePercentile(sorted, 0.25),
    p75: computePercentile(sorted, 0.75),
    p90: computePercentile(sorted, 0.90),
    p95: computePercentile(sorted, 0.95),
    min: sorted[0] ?? 0,
    max: sorted[sorted.length - 1] ?? 0,
    histogram: buildHistogram(values, histogramBins),
  }
}

/**
 * Compute convergence diagnostic — coefficient of variation of the running mean.
 * If this is < 0.01 (1%), the simulation has converged.
 */
export function computeConvergenceDiagnostic(values: number[]): number {
  if (values.length < 100) return 1.0 // Not enough data

  // Compute running mean for last 10% of runs
  const windowStart = Math.floor(values.length * 0.9)
  const windowValues = values.slice(windowStart)

  let runningSum = values.slice(0, windowStart).reduce((s, v) => s + v, 0)
  const runningMeans: number[] = []

  for (let i = 0; i < windowValues.length; i++) {
    runningSum += windowValues[i]
    runningMeans.push(runningSum / (windowStart + i + 1))
  }

  const meanOfMeans = computeMean(runningMeans)
  const stdOfMeans = computeStdDev(runningMeans)

  return meanOfMeans > 0 ? stdOfMeans / meanOfMeans : 0
}
