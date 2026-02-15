/**
 * Probability Distribution Sampling Functions
 *
 * All functions use a seeded PRNG for reproducibility — critical for thesis work.
 * The reader must be able to reproduce exact Monte Carlo results given the same seed.
 *
 * @source IPCC Tier 2 uncertainty guidance
 * @source Winrock International Monte Carlo Guidance (2017)
 */

/**
 * Mulberry32 — a fast, high-quality 32-bit seeded PRNG.
 * Returns a function that produces uniform [0, 1) values.
 */
export function createRng(seed: number): () => number {
  let state = seed | 0
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Sample from a normal distribution using Box-Muller transform.
 * @param mean - Center of distribution
 * @param stdDev - Standard deviation
 * @param rng - Seeded random number generator
 */
export function sampleNormal(mean: number, stdDev: number, rng: () => number): number {
  // Box-Muller transform: convert two uniform samples to normal
  const u1 = rng()
  const u2 = rng()
  const z = Math.sqrt(-2 * Math.log(u1 || 1e-10)) * Math.cos(2 * Math.PI * u2)
  return mean + stdDev * z
}

/**
 * Sample from a lognormal distribution.
 * The underlying normal has parameters muLog and sigmaLog.
 *
 * To parameterize from desired mean and relative uncertainty:
 *   sigmaLog = sqrt(ln(1 + (cv)^2)) where cv = relativeUncertainty
 *   muLog = ln(mean) - sigmaLog^2 / 2
 *
 * @param mean - Desired mean of the lognormal (not the underlying normal)
 * @param relativeUncertainty - Coefficient of variation (e.g., 0.15 for 15%)
 * @param rng - Seeded random number generator
 */
export function sampleLognormal(mean: number, relativeUncertainty: number, rng: () => number): number {
  const cv = relativeUncertainty
  const sigmaLog = Math.sqrt(Math.log(1 + cv * cv))
  const muLog = Math.log(mean) - sigmaLog * sigmaLog / 2
  const normalSample = sampleNormal(muLog, sigmaLog, rng)
  return Math.exp(normalSample)
}

/**
 * Sample from a triangular distribution.
 * @param min - Minimum value
 * @param mode - Most likely value (peak)
 * @param max - Maximum value
 * @param rng - Seeded random number generator
 */
export function sampleTriangular(min: number, mode: number, max: number, rng: () => number): number {
  const u = rng()
  const fc = (mode - min) / (max - min)

  if (u < fc) {
    return min + Math.sqrt(u * (max - min) * (mode - min))
  } else {
    return max - Math.sqrt((1 - u) * (max - min) * (max - mode))
  }
}

/**
 * Sample from a uniform distribution.
 * @param min - Minimum value
 * @param max - Maximum value
 * @param rng - Seeded random number generator
 */
export function sampleUniform(min: number, max: number, rng: () => number): number {
  return min + rng() * (max - min)
}
