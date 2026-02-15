/**
 * Monte Carlo Simulation Engine
 *
 * Quantifies epistemic and aleatory uncertainty by treating input parameters
 * and emission factors as probability distributions, running N simulations,
 * and collecting distributional statistics on the outputs.
 *
 * @methodology IPCC Tier 2 uncertainty analysis via Monte Carlo propagation
 * @source Winrock International, Monte Carlo Guidance for GHG Inventories (2017)
 * @source Frontiers in Environmental Science, 10.3389/fenvs.2022.896256
 *
 * Performance: 1000 runs with ~20 parameters ≈ <500ms on modern hardware.
 */

import type { FacilityProfile, EnergyLineItem } from '@/domain/types/facility'
import type { EmissionFactorSet, StationaryCombustionFactors } from '@/domain/types/factors'
import type { MonteCarloConfig, SimulationResult } from '@/domain/types/simulation'
import { computeAllEmissions } from '@/lib/emissions/engine'
import { createRng } from './distributions'
import { perturbValue, getUncertaintySpec, energyParamType } from './uncertainty'
import { buildDistributionSummary, computeConvergenceDiagnostic } from './statistics'

const DEFAULT_CONFIG: MonteCarloConfig = {
  runs: 1000,
  seed: 42,
  confidenceLevel: 0.95,
  histogramBins: 50,
}

/**
 * Run Monte Carlo simulation on a facility's emissions calculation.
 *
 * For each run:
 * 1. Sample all uncertain input parameters from their distributions
 * 2. Sample emission factor perturbations
 * 3. Run the deterministic engine with perturbed values
 * 4. Record per-scope totals
 *
 * @param facility - Facility profile with input data
 * @param factors - Emission factor set
 * @param config - Simulation configuration (runs, seed, etc.)
 * @returns SimulationResult with distributional statistics
 */
export function runMonteCarloSimulation(
  facility: FacilityProfile,
  factors: EmissionFactorSet,
  config: Partial<MonteCarloConfig> = {},
): SimulationResult {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const rng = createRng(cfg.seed)

  // Collectors for each run's results
  const totals: number[] = []
  const scope1s: number[] = []
  const scope2Ls: number[] = []
  const scope2Ms: number[] = []
  const scope3s: number[] = []
  const categoryCollectors: Record<string, number[]> = {}

  for (let i = 0; i < cfg.runs; i++) {
    // Perturb inputs
    const perturbedFacility = perturbFacility(facility, rng)
    const perturbedFactors = perturbFactors(factors, rng)

    // Run deterministic calculation with perturbed values
    const result = computeAllEmissions(perturbedFacility, perturbedFactors, {
      includeScope3: true,
      includeEstimation: true,
    })

    totals.push(result.total)
    scope1s.push(result.scope1.total)
    scope2Ls.push(result.scope2Location.total)
    scope2Ms.push(result.scope2Market.total)
    scope3s.push(result.scope3.total)

    // Collect per-category results
    for (const cat of result.breakdown) {
      const key = `${cat.category}_${cat.subcategory ?? ''}`
      if (!categoryCollectors[key]) categoryCollectors[key] = []
      categoryCollectors[key].push(cat.value)
    }
  }

  // Build per-category summaries
  const perCategory: Record<string, { mean: number; ci95Lower: number; ci95Upper: number }> = {}
  for (const [key, values] of Object.entries(categoryCollectors)) {
    const summary = buildDistributionSummary(values, cfg.histogramBins)
    perCategory[key] = {
      mean: summary.mean,
      ci95Lower: summary.ci95Lower,
      ci95Upper: summary.ci95Upper,
    }
  }

  return {
    runs: cfg.runs,
    seed: cfg.seed,
    totalEmissions: buildDistributionSummary(totals, cfg.histogramBins),
    scope1: buildDistributionSummary(scope1s, cfg.histogramBins),
    scope2Location: buildDistributionSummary(scope2Ls, cfg.histogramBins),
    scope2Market: buildDistributionSummary(scope2Ms, cfg.histogramBins),
    scope3: buildDistributionSummary(scope3s, cfg.histogramBins),
    perCategory,
    convergenceDiagnostic: computeConvergenceDiagnostic(totals),
  }
}

/**
 * Create a perturbed copy of the facility profile.
 * Each numeric input is sampled from its uncertainty distribution.
 */
function perturbFacility(facility: FacilityProfile, rng: () => number): FacilityProfile {
  return {
    ...facility,
    energy: perturbEnergy(facility.energy, rng),
    refrigerants: facility.refrigerants.map(r => ({
      ...r,
      chargeAmount: perturbValue(r.chargeAmount, getUncertaintySpec('refrigerant_charge'), rng),
      annualLeakRate: perturbValue(r.annualLeakRate, getUncertaintySpec('refrigerant_leak_rate'), rng),
    })),
    fleet: facility.fleet.map(f => ({
      ...f,
      annualMilesPerVehicle: perturbValue(f.annualMilesPerVehicle, getUncertaintySpec('fleet_mileage'), rng),
      fuelEfficiency: f.fuelEfficiency
        ? perturbValue(f.fuelEfficiency, getUncertaintySpec('fleet_fuel_economy'), rng)
        : undefined,
    })),
    waste: facility.waste.map(w => ({
      ...w,
      annualTonnes: perturbValue(w.annualTonnes, getUncertaintySpec('waste_quantity'), rng),
    })),
    water: facility.water.map(w => ({
      ...w,
      annualGallons: perturbValue(w.annualGallons, getUncertaintySpec('water_quantity'), rng),
    })),
  }
}

function perturbEnergy(
  energy: FacilityProfile['energy'],
  rng: () => number,
): FacilityProfile['energy'] {
  const result = { ...energy }

  const perturbLineItem = (item: EnergyLineItem | undefined): EnergyLineItem | undefined => {
    if (!item) return undefined
    const spec = getUncertaintySpec(energyParamType(item.dataQuality))
    return {
      ...item,
      quantity: perturbValue(item.quantity, spec, rng),
    }
  }

  result.electricity = perturbLineItem(energy.electricity)
  result.naturalGas = perturbLineItem(energy.naturalGas)
  result.diesel = perturbLineItem(energy.diesel)
  result.fuelOil2 = perturbLineItem(energy.fuelOil2)
  result.fuelOil6 = perturbLineItem(energy.fuelOil6)
  result.propane = perturbLineItem(energy.propane)
  result.kerosene = perturbLineItem(energy.kerosene)

  return result
}

/**
 * Create a perturbed copy of the emission factor set.
 * Stationary combustion and grid EFs are perturbed; GWPs are fixed.
 */
function perturbFactors(factors: EmissionFactorSet, rng: () => number): EmissionFactorSet {
  const stationarySpec = getUncertaintySpec('stationary_ef')
  const gridSpec = getUncertaintySpec('grid_ef')

  // Perturb stationary combustion factors
  const perturbedStationary: StationaryCombustionFactors = {}
  for (const [fuel, ef] of Object.entries(factors.stationaryCombustion)) {
    perturbedStationary[fuel] = {
      ...ef,
      co2_kg_per_unit: perturbValue(ef.co2_kg_per_unit, stationarySpec, rng),
      // CH4 and N2O are small; perturb them too for completeness
      ch4_g_per_unit: perturbValue(ef.ch4_g_per_unit, stationarySpec, rng),
      n2o_g_per_unit: perturbValue(ef.n2o_g_per_unit, stationarySpec, rng),
    }
  }

  // Perturb grid electricity factors
  const perturbedSubregions: typeof factors.gridElectricity.subregions = {}
  for (const [code, sr] of Object.entries(factors.gridElectricity.subregions)) {
    perturbedSubregions[code] = {
      ...sr,
      co2e_kg_per_kwh: perturbValue(sr.co2e_kg_per_kwh, gridSpec, rng),
    }
  }

  return {
    ...factors,
    stationaryCombustion: perturbedStationary,
    gridElectricity: {
      ...factors.gridElectricity,
      subregions: perturbedSubregions,
    },
    // GWPs are NOT perturbed per GHG Protocol convention
  }
}
