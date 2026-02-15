/**
 * Decarbonization Scenario Engine
 *
 * Models the impact of various interventions on facility emissions,
 * including financial analysis and 10-year projections.
 */

import type { FacilityProfile } from '@/domain/types/facility'
import type { EmissionFactorSet } from '@/domain/types/factors'
import type { EmissionResult } from '@/domain/types/emissions'
import type {
  Intervention,
  InterventionResult,
  ScenarioResult,
  YearlyProjection,
} from '@/domain/types/scenario'
import { computeAllEmissions } from '@/lib/emissions/engine'
import { calculateNPV, calculateIRR, calculatePayback, buildCashFlows, cumulativeCO2Avoided } from './financial'
import gridProjectionData from '../../../data/grid-projection-eia.json'

const DEFAULT_DISCOUNT_RATE = 0.08
const PROJECTION_YEARS = 10

const gridProjection = gridProjectionData as any

/**
 * Evaluate a set of interventions against a facility's baseline emissions.
 */
export function evaluateScenario(
  name: string,
  facility: FacilityProfile,
  factors: EmissionFactorSet,
  interventions: Intervention[],
  baselineResult: EmissionResult,
): ScenarioResult {
  const interventionResults = interventions.map(i =>
    evaluateIntervention(i, facility, factors, baselineResult)
  )

  const totalReduction = interventionResults.reduce((s, r) => s + r.annualEmissionReduction, 0)
  const totalCapex = interventionResults.reduce((s, r) => s + r.capex, 0)
  const annualSavings = -interventionResults.reduce((s, r) => s + r.annualOpexChange, 0)

  const projectedEmissions = baselineResult.total - totalReduction
  const reductionPct = baselineResult.total > 0 ? totalReduction / baselineResult.total : 0

  const cashFlows = buildCashFlows(totalCapex, annualSavings, PROJECTION_YEARS)

  const trajectory = buildProjection(
    baselineResult.total,
    totalReduction,
    facility,
    factors,
  )

  return {
    name,
    interventions: interventionResults,
    baselineEmissions: baselineResult.total,
    projectedEmissions: Math.max(0, projectedEmissions),
    totalReduction,
    reductionPct,
    totalCapex,
    annualSavings,
    simplePaybackYears: calculatePayback(totalCapex, annualSavings),
    npv: calculateNPV(cashFlows, DEFAULT_DISCOUNT_RATE),
    irr: calculateIRR(cashFlows),
    cumulativeCO2Avoided10yr: cumulativeCO2Avoided(totalReduction, 10),
    projectedTrajectory: trajectory,
  }
}

function evaluateIntervention(
  intervention: Intervention,
  facility: FacilityProfile,
  factors: EmissionFactorSet,
  baseline: EmissionResult,
): InterventionResult {
  switch (intervention.type) {
    case 'renewable_switch':
      return evalRenewableSwitch(intervention, baseline)
    case 'fleet_electrification':
      return evalFleetElectrification(intervention, facility, baseline)
    case 'hvac_upgrade':
      return evalHvacUpgrade(intervention, facility, baseline)
    case 'solar_onsite':
      return evalSolarOnsite(intervention, facility, factors)
    case 'building_envelope':
      return evalBuildingEnvelope(intervention, baseline)
    case 'waste_reduction':
      return evalWasteReduction(intervention, baseline)
    default:
      return {
        type: intervention.type,
        annualEmissionReduction: 0,
        capex: 0,
        annualOpexChange: 0,
        implementationYears: 1,
      }
  }
}

/**
 * Renewable PPA/REC switch.
 * Reduces Scope 2 (market-based) by the renewable percentage.
 * CapEx: ~$0 for PPA; cost modeled as OpEx premium.
 */
function evalRenewableSwitch(intervention: Intervention, baseline: EmissionResult): InterventionResult {
  const pct = intervention.params.renewablePct ?? 0.20
  const reduction = baseline.scope2Location.total * pct

  // Green power premium typically $0.01-0.03/kWh above grid rate
  const premiumPerKwh = 0.015
  const estimatedKwh = baseline.scope2Location.total > 0
    ? (baseline.scope2Location.total / 0.4) * 1000 // rough kWh estimate
    : 0
  const annualPremium = estimatedKwh * pct * premiumPerKwh

  return {
    type: 'renewable_switch',
    annualEmissionReduction: reduction,
    capex: 0,
    annualOpexChange: annualPremium, // positive = additional cost
    implementationYears: 0,
  }
}

/**
 * Fleet electrification.
 * Removes Scope 1 mobile combustion, adds Scope 2 from EV charging.
 */
function evalFleetElectrification(
  intervention: Intervention,
  facility: FacilityProfile,
  baseline: EmissionResult,
): InterventionResult {
  const pct = intervention.params.electrificationPct ?? 0.50

  // Scope 1 reduction from removing ICE vehicles
  const mobileEmissions = baseline.scope1.categories
    .filter(c => c.category === 'mobile_combustion')
    .reduce((s, c) => s + c.value, 0)
  const scope1Reduction = mobileEmissions * pct

  // Scope 2 increase from EV charging (typically much less than ICE emissions)
  // Average EV: 3 mi/kWh, grid average 0.37 kg/kWh → 0.12 kg/mi vs 0.35 kg/mi for ICE
  const evScope2Increase = scope1Reduction * 0.35 // ~35% of original emissions

  const netReduction = scope1Reduction - evScope2Increase

  // CapEx: ~$10,000 premium per vehicle + $2,000 charging infrastructure
  const vehicleCount = facility.fleet.reduce((s, f) => s + f.count, 0)
  const evCount = Math.ceil(vehicleCount * pct)
  const capex = evCount * 12000

  // Fuel savings: average $1,200/yr per vehicle (gas vs electricity)
  const annualSavings = evCount * 1200

  return {
    type: 'fleet_electrification',
    annualEmissionReduction: netReduction,
    capex,
    annualOpexChange: -annualSavings, // negative = savings
    implementationYears: 2,
  }
}

/**
 * HVAC efficiency upgrade.
 * Reduces heating/cooling energy proportional to COP improvement.
 */
function evalHvacUpgrade(
  intervention: Intervention,
  facility: FacilityProfile,
  baseline: EmissionResult,
): InterventionResult {
  const oldCOP = intervention.params.oldCOP ?? 2.5
  const newCOP = intervention.params.newCOP ?? 4.0

  // Efficiency improvement fraction
  const improvementFraction = 1 - (oldCOP / newCOP)

  // HVAC typically 40-60% of total building energy
  const hvacFraction = 0.50
  const totalEmissions = baseline.scope1.total + baseline.scope2Location.total
  const reduction = totalEmissions * hvacFraction * improvementFraction

  // CapEx: ~$5-15/sqft for HVAC replacement
  const capex = facility.dimensions.squareFeet * 8

  // Energy savings
  const annualEnergySavings = capex * 0.12 // ~12% of CapEx annually

  return {
    type: 'hvac_upgrade',
    annualEmissionReduction: reduction,
    capex,
    annualOpexChange: -annualEnergySavings,
    implementationYears: 1,
  }
}

/**
 * On-site solar installation.
 * Offsets grid electricity with zero-carbon solar generation.
 */
function evalSolarOnsite(
  intervention: Intervention,
  facility: FacilityProfile,
  factors: EmissionFactorSet,
): InterventionResult {
  const capacityKw = intervention.params.capacityKw ?? Math.floor(facility.dimensions.squareFeet * 0.01) // ~10W/sqft
  const capacityFactor = intervention.params.annualCapacityFactor ?? 0.18

  // Annual generation
  const annualKwh = capacityKw * 8760 * capacityFactor

  // Grid factor for offset
  let gridEF = 0.3716
  if (facility.location.state) {
    const subregion = factors.gridElectricity.stateToSubregion[facility.location.state.toUpperCase()]
    if (subregion) gridEF = factors.gridElectricity.subregions[subregion]?.co2e_kg_per_kwh ?? gridEF
  }

  const reduction = (annualKwh * gridEF) / 1000 // tCO2e

  // CapEx: ~$2.50/W installed (2024 US average)
  const capex = capacityKw * 2500

  // Electricity savings: ~$0.12/kWh
  const annualSavings = annualKwh * 0.12

  return {
    type: 'solar_onsite',
    annualEmissionReduction: reduction,
    capex,
    annualOpexChange: -annualSavings,
    implementationYears: 1,
  }
}

/**
 * Building envelope improvement.
 * Reduces heating/cooling loads through insulation and window upgrades.
 */
function evalBuildingEnvelope(intervention: Intervention, baseline: EmissionResult): InterventionResult {
  const heatingReduction = intervention.params.heatingReductionPct ?? 0.20
  const coolingReduction = intervention.params.coolingReductionPct ?? 0.10

  // Assume 30% of emissions are heating, 20% are cooling
  const totalScope12 = baseline.scope1.total + baseline.scope2Location.total
  const heatingEmissions = totalScope12 * 0.30
  const coolingEmissions = totalScope12 * 0.20

  const reduction = heatingEmissions * heatingReduction + coolingEmissions * coolingReduction

  // CapEx: ~$3-8/sqft for envelope improvements
  const capex = (baseline.scope1.total > 0 ? 50000 : 25000) // Simplified estimate

  return {
    type: 'building_envelope',
    annualEmissionReduction: reduction,
    capex,
    annualOpexChange: -capex * 0.08, // ~8% annual energy savings
    implementationYears: 1,
  }
}

/**
 * Waste diversion from landfill.
 */
function evalWasteReduction(intervention: Intervention, baseline: EmissionResult): InterventionResult {
  const diversionPct = intervention.params.landfillDiversionPct ?? 0.50

  const wasteEmissions = baseline.scope3.categories
    .filter(c => c.category === 'scope3_cat5')
    .reduce((s, c) => s + c.value, 0)

  const reduction = wasteEmissions * diversionPct * 0.8 // 80% net reduction from diversion

  return {
    type: 'waste_reduction',
    annualEmissionReduction: reduction,
    capex: 5000, // Bins, signage, training
    annualOpexChange: -2000, // Lower waste hauling costs
    implementationYears: 0,
  }
}

/**
 * Build 10-year emissions projection with grid decarbonization.
 */
function buildProjection(
  baselineTotal: number,
  annualReduction: number,
  facility: FacilityProfile,
  factors: EmissionFactorSet,
): YearlyProjection[] {
  const currentYear = new Date().getFullYear()
  const projections: YearlyProjection[] = []
  let cumulativeReduction = 0

  for (let i = 0; i <= PROJECTION_YEARS; i++) {
    const year = currentYear + i
    const yearStr = year.toString()

    // Get projected grid EF (or extrapolate)
    const projectedGridEF = gridProjection.national_grid_ef[yearStr]
      ?? gridProjection.national_grid_ef['2035']
      ?? 0.224

    // Baseline declines with grid decarbonization (Scope 2 portion)
    const scope2Fraction = 0.45 // Approximate Scope 2 share of total
    const gridDeclineRatio = projectedGridEF / (gridProjection.national_grid_ef[currentYear.toString()] ?? 0.371)
    const gridAdjustedBaseline = baselineTotal * (1 - scope2Fraction + scope2Fraction * gridDeclineRatio)

    const scenarioEmissions = Math.max(0, gridAdjustedBaseline - annualReduction)
    cumulativeReduction += gridAdjustedBaseline - scenarioEmissions

    projections.push({
      year,
      baselineEmissions: gridAdjustedBaseline,
      scenarioEmissions,
      cumulativeReduction,
      gridEF: projectedGridEF,
    })
  }

  return projections
}
