/**
 * Scope 3 — Value Chain Emissions (All 15 Categories)
 *
 * Implements the GHG Protocol Corporate Value Chain (Scope 3) Standard.
 * Each category uses the primary calculation method from the Scope 3 Technical Guidance.
 *
 * @methodology GHG Protocol Scope 3 Calculation Guidance (2013)
 * @source EPA GHG EF Hub 2025, Tables 8-12
 * @source EPA USEEIO v2.0 (spend-based factors)
 */

import type { FacilityProfile, Scope3InputSet, WasteStreamInput } from '@/domain/types/facility'
import type { EmissionFactorSet } from '@/domain/types/factors'
import type { ScopeResult, CategoryBreakdown } from '@/domain/types/emissions'
import { MMBTU_PER_THERM, METRIC_TONNES_PER_SHORT_TON, KG_PER_METRIC_TONNE, DEFAULT_WORKING_DAYS_PER_YEAR } from '@/domain/constants'

export function calculateScope3(
  facility: FacilityProfile,
  factors: EmissionFactorSet,
): ScopeResult {
  const categories: CategoryBreakdown[] = []
  const s3 = facility.scope3

  // Cat 1: Purchased Goods & Services (spend-based)
  categories.push(...calcSpendBased(s3.cat1PurchasedGoods, 1, 'Purchased Goods & Services', factors))

  // Cat 2: Capital Goods (spend-based)
  categories.push(...calcSpendBased(s3.cat2CapitalGoods, 2, 'Capital Goods', factors))

  // Cat 3: Fuel & Energy-Related Activities (auto-calculated)
  categories.push(...calcFuelEnergy(facility, factors))

  // Cat 4: Upstream Transportation
  categories.push(...calcTransport(s3.cat4UpstreamTransport, 4, 'Upstream Transportation', factors))

  // Cat 5: Waste Generated in Operations
  categories.push(...calcWaste(facility.waste, factors))

  // Cat 6: Business Travel
  categories.push(...calcBusinessTravel(s3.cat6BusinessTravel, factors))

  // Cat 7: Employee Commuting
  categories.push(...calcEmployeeCommuting(s3.cat7EmployeeCommuting, factors))

  // Cat 8: Upstream Leased Assets
  categories.push(...calcSpendBased(s3.cat8UpstreamLeased, 8, 'Upstream Leased Assets', factors))

  // Cat 9: Downstream Transportation
  categories.push(...calcTransport(s3.cat9DownstreamTransport, 9, 'Downstream Transportation', factors))

  // Cat 10-15: Simplified spend-based
  categories.push(...calcSpendBased(s3.cat10Processing, 10, 'Processing of Sold Products', factors))
  categories.push(...calcSpendBased(s3.cat11ProductUse, 11, 'Use of Sold Products', factors))
  categories.push(...calcSpendBased(s3.cat12EndOfLife, 12, 'End-of-Life Treatment', factors))
  categories.push(...calcSpendBased(s3.cat13DownstreamLeased, 13, 'Downstream Leased Assets', factors))
  categories.push(...calcSpendBased(s3.cat14Franchises, 14, 'Franchises', factors))
  categories.push(...calcSpendBased(s3.cat15Investments, 15, 'Investments', factors))

  const total = categories.reduce((sum, c) => sum + c.value, 0)
  return { total, categories }
}

/**
 * Categories 1, 2, 8, 10-15: Spend-based method using EEIO factors.
 * @formula CO2e = annual_spend_USD × sector_EF (kg CO2e/USD) / 1000
 */
function calcSpendBased(
  inputs: { sector: string; annualSpendUSD: number; dataQuality: any }[] | undefined,
  catNum: number,
  catName: string,
  factors: EmissionFactorSet,
): CategoryBreakdown[] {
  if (!inputs || inputs.length === 0) return []

  return inputs.map(input => {
    const ef = factors.scope3.spendBased[input.sector]?.kg_co2e_per_usd ?? 0.30 // default if sector not found
    const co2e_tonnes = (input.annualSpendUSD * ef) / KG_PER_METRIC_TONNE

    return {
      scope: 3 as const,
      category: `scope3_cat${catNum}`,
      subcategory: input.sector,
      value: co2e_tonnes,
      dataQuality: input.dataQuality,
      methodology: `$${input.annualSpendUSD.toLocaleString()} × ${ef} kg CO2e/USD`,
      source: `EPA USEEIO v2.0 (Cat ${catNum}: ${catName})`,
    }
  })
}

/**
 * Category 3: Fuel & Energy-Related Activities (not included in Scope 1/2)
 * Includes well-to-tank (WTT) emissions for fuels and T&D losses for electricity.
 * @formula WTT_CO2e = fuel_quantity × WTT_EF
 * @formula TND_CO2e = kWh × grid_EF × T&D_loss_pct
 */
function calcFuelEnergy(
  facility: FacilityProfile,
  factors: EmissionFactorSet,
): CategoryBreakdown[] {
  const categories: CategoryBreakdown[] = []

  // WTT for natural gas
  const gas = facility.energy.naturalGas
  if (gas && gas.quantity > 0) {
    const mmbtu = gas.quantity * MMBTU_PER_THERM
    const wttEF = factors.scope3.upstreamFuelEnergy.natural_gas?.wtt_kg_co2e_per_unit ?? 10.62
    const co2e_tonnes = (mmbtu * wttEF) / KG_PER_METRIC_TONNE

    categories.push({
      scope: 3,
      category: 'scope3_cat3',
      subcategory: 'natural_gas_wtt',
      value: co2e_tonnes,
      dataQuality: gas.dataQuality,
      methodology: `${mmbtu.toFixed(0)} MMBtu × ${wttEF} kg CO2e/MMBtu (WTT)`,
      source: 'EPA GHG EF Hub 2025, Table 8',
    })
  }

  // WTT for diesel
  const diesel = facility.energy.diesel
  if (diesel && diesel.quantity > 0) {
    const wttEF = factors.scope3.upstreamFuelEnergy.diesel?.wtt_kg_co2e_per_unit ?? 2.69
    const co2e_tonnes = (diesel.quantity * wttEF) / KG_PER_METRIC_TONNE

    categories.push({
      scope: 3,
      category: 'scope3_cat3',
      subcategory: 'diesel_wtt',
      value: co2e_tonnes,
      dataQuality: diesel.dataQuality,
      methodology: `${diesel.quantity} gal × ${wttEF} kg CO2e/gal (WTT)`,
      source: 'EPA GHG EF Hub 2025, Table 8',
    })
  }

  // T&D losses for electricity
  const elec = facility.energy.electricity
  if (elec && elec.quantity > 0) {
    // Resolve grid factor for T&D loss portion
    let gridEF = 0.3716 // US average fallback
    let subregion = 'US_average'
    if (facility.location.state && facility.location.country === 'US') {
      const sr = factors.gridElectricity.stateToSubregion[facility.location.state.toUpperCase()]
      if (sr && factors.gridElectricity.subregions[sr]) {
        gridEF = factors.gridElectricity.subregions[sr].co2e_kg_per_kwh
        subregion = sr
      }
    }

    const tndLossPct = factors.gridElectricity.subregions[subregion]?.grid_gross_loss_pct ?? 0.05
    const tndKwh = elec.quantity * tndLossPct
    const co2e_tonnes = (tndKwh * gridEF) / KG_PER_METRIC_TONNE

    categories.push({
      scope: 3,
      category: 'scope3_cat3',
      subcategory: 'electricity_tnd_losses',
      value: co2e_tonnes,
      dataQuality: elec.dataQuality,
      methodology: `${elec.quantity.toLocaleString()} kWh × ${(tndLossPct * 100).toFixed(1)}% T&D × ${gridEF.toFixed(4)} kg/kWh`,
      source: 'EPA eGRID2023 + GHG EF Hub 2025, Table 8',
    })
  }

  return categories
}

/**
 * Categories 4 & 9: Transportation (distance-based)
 * @formula CO2e = ton_miles × EF (kg CO2e/ton-mile) / 1000
 */
function calcTransport(
  inputs: { mode: string; tonMiles: number; dataQuality: any }[] | undefined,
  catNum: number,
  catName: string,
  factors: EmissionFactorSet,
): CategoryBreakdown[] {
  if (!inputs || inputs.length === 0) return []

  const modeMap: Record<string, string> = {
    truck: 'truck_medium_heavy',
    rail: 'rail',
    waterborne: 'waterborne_cargo',
    air: 'air_freight',
  }

  return inputs.map(input => {
    const factorKey = modeMap[input.mode] ?? input.mode
    const ef = factors.scope3.productTransport[factorKey]?.kg_co2e_per_ton_mile ?? 0.1616
    const co2e_tonnes = (input.tonMiles * ef) / KG_PER_METRIC_TONNE

    return {
      scope: 3 as const,
      category: `scope3_cat${catNum}`,
      subcategory: input.mode,
      value: co2e_tonnes,
      dataQuality: input.dataQuality,
      methodology: `${input.tonMiles.toLocaleString()} ton-mi × ${ef} kg CO2e/ton-mi`,
      source: `EPA GHG EF Hub 2025, Table 10 (Cat ${catNum}: ${catName})`,
    }
  })
}

/**
 * Category 5: Waste Generated in Operations
 * @formula CO2e = tonnes × (1 / METRIC_TONNES_PER_SHORT_TON) × EF (tCO2e/short ton)
 */
function calcWaste(
  waste: WasteStreamInput[],
  factors: EmissionFactorSet,
): CategoryBreakdown[] {
  if (!waste || waste.length === 0) return []

  return waste.map(w => {
    const key = `${w.wasteType}_${w.disposalMethod}`
    const ef = factors.waste[key]?.tco2e_per_short_ton ?? factors.waste['mixed_msw_landfill']?.tco2e_per_short_ton ?? 0.52

    // Convert metric tonnes to short tons, then apply EF
    const shortTons = w.annualTonnes / METRIC_TONNES_PER_SHORT_TON
    const co2e_tonnes = shortTons * ef

    return {
      scope: 3 as const,
      category: 'scope3_cat5',
      subcategory: `${w.wasteType}_${w.disposalMethod}`,
      value: Math.max(0, co2e_tonnes), // Recycling offsets can be negative, floor at 0 for simplicity
      dataQuality: w.dataQuality,
      methodology: `${w.annualTonnes} t × ${ef.toFixed(2)} tCO2e/short ton`,
      source: 'EPA GHG EF Hub 2025, Table 12',
    }
  })
}

/**
 * Category 6: Business Travel
 * @formula CO2e = passenger_miles × EF (kg CO2e/passenger-mile) / 1000
 */
function calcBusinessTravel(
  inputs: { mode: string; passengerMiles: number; dataQuality: any }[] | undefined,
  factors: EmissionFactorSet,
): CategoryBreakdown[] {
  if (!inputs || inputs.length === 0) return []

  const modeMap: Record<string, string> = {
    air_short: 'air_short_haul_under_300mi',
    air_medium: 'air_medium_haul_300_2300mi',
    air_long: 'air_long_haul_over_2300mi',
    rail: 'rail_intercity',
    bus: 'bus_intercity',
    car: 'passenger_car',
  }

  return inputs.map(input => {
    const factorKey = modeMap[input.mode] ?? input.mode
    const ef = factors.scope3.businessTravel[factorKey]?.kg_co2e_per_passenger_mile ?? 0.137
    const co2e_tonnes = (input.passengerMiles * ef) / KG_PER_METRIC_TONNE

    return {
      scope: 3 as const,
      category: 'scope3_cat6',
      subcategory: input.mode,
      value: co2e_tonnes,
      dataQuality: input.dataQuality,
      methodology: `${input.passengerMiles.toLocaleString()} pax-mi × ${ef} kg CO2e/pax-mi`,
      source: 'EPA GHG EF Hub 2025, Table 9',
    }
  })
}

/**
 * Category 7: Employee Commuting
 * @formula CO2e = employees × mode_pct × distance × 2 (round trip) × working_days × EF / 1000
 */
function calcEmployeeCommuting(
  input: {
    employees: number
    workingDaysPerYear: number
    modes: { mode: string; percentOfEmployees: number; oneWayDistanceMiles: number }[]
    dataQuality: any
  } | undefined,
  factors: EmissionFactorSet,
): CategoryBreakdown[] {
  if (!input || input.employees <= 0) return []

  const modeMap: Record<string, string> = {
    car: 'passenger_car',
    bus: 'bus_transit',
    rail_light: 'rail_light_transit',
    rail_heavy: 'rail_heavy_subway',
    bike: 'telecommute', // zero emissions
    walk: 'telecommute', // zero emissions
    telecommute: 'telecommute',
  }

  return input.modes
    .filter(m => m.percentOfEmployees > 0 && m.oneWayDistanceMiles > 0)
    .map(m => {
      const factorKey = modeMap[m.mode] ?? m.mode
      const ef = factors.scope3.employeeCommuting[factorKey]?.kg_co2e_per_mile ?? 0

      const employeesInMode = input.employees * m.percentOfEmployees
      const annualMiles = employeesInMode * m.oneWayDistanceMiles * 2 * input.workingDaysPerYear
      const co2e_tonnes = (annualMiles * ef) / KG_PER_METRIC_TONNE

      return {
        scope: 3 as const,
        category: 'scope3_cat7',
        subcategory: m.mode,
        value: co2e_tonnes,
        dataQuality: input.dataQuality,
        methodology: `${employeesInMode.toFixed(0)} employees × ${m.oneWayDistanceMiles} mi × 2 × ${input.workingDaysPerYear} days × ${ef} kg/mi`,
        source: 'EPA GHG EF Hub 2025, Table 11',
      }
    })
}
