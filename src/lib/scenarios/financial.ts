/**
 * Financial Analysis Engine
 *
 * Calculates NPV, IRR, simple payback, and cumulative CO2 avoided
 * for decarbonization investments.
 */

/**
 * Net Present Value of a cash flow series.
 * @param cashFlows - Array where index 0 is initial investment (negative), rest are annual returns
 * @param discountRate - Annual discount rate (e.g., 0.08 for 8%)
 */
export function calculateNPV(cashFlows: number[], discountRate: number): number {
  return cashFlows.reduce((npv, cf, t) => {
    return npv + cf / Math.pow(1 + discountRate, t)
  }, 0)
}

/**
 * Internal Rate of Return using Newton-Raphson iteration.
 * @param cashFlows - Array where index 0 is initial investment (negative)
 * @returns IRR as fraction, or null if not convergent
 */
export function calculateIRR(cashFlows: number[], maxIterations = 100, tolerance = 1e-7): number | null {
  if (cashFlows.length < 2) return null

  // Initial guess based on simple payback
  let rate = 0.10

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0
    let dnpv = 0 // derivative of NPV w.r.t. rate

    for (let t = 0; t < cashFlows.length; t++) {
      const factor = Math.pow(1 + rate, t)
      npv += cashFlows[t] / factor
      dnpv -= t * cashFlows[t] / (factor * (1 + rate))
    }

    if (Math.abs(npv) < tolerance) return rate
    if (Math.abs(dnpv) < 1e-15) return null // Avoid division by zero

    const newRate = rate - npv / dnpv

    // Guard against divergence
    if (newRate < -0.99) return null
    if (Math.abs(newRate - rate) < tolerance) return newRate

    rate = newRate
  }

  return null // Did not converge
}

/**
 * Simple payback period in years.
 * @param capex - Total capital expenditure (positive number)
 * @param annualSavings - Annual cost savings (positive number)
 */
export function calculatePayback(capex: number, annualSavings: number): number {
  if (annualSavings <= 0) return Infinity
  return capex / annualSavings
}

/**
 * Build a 10-year cash flow array for an intervention.
 * @param capex - Upfront cost (year 0, negative)
 * @param annualSavings - Annual savings from intervention (positive)
 * @param years - Number of years to project
 */
export function buildCashFlows(
  capex: number,
  annualSavings: number,
  years: number = 10,
): number[] {
  const flows = [-capex]
  for (let i = 0; i < years; i++) {
    flows.push(annualSavings)
  }
  return flows
}

/**
 * Calculate cumulative CO2 avoided over a period.
 * Accounts for grid decarbonization reducing the value of electricity-related interventions.
 */
export function cumulativeCO2Avoided(
  annualReduction: number,
  years: number,
  annualDecayRate: number = 0,
): number {
  let total = 0
  for (let i = 0; i < years; i++) {
    total += annualReduction * Math.pow(1 - annualDecayRate, i)
  }
  return total
}
