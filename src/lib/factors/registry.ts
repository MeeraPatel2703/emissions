/**
 * Central emission factor registry.
 * Loads factors from static JSON datasets and provides typed lookup functions.
 *
 * @source EPA GHG Emission Factors Hub 2025
 * @source EPA eGRID2023
 * @source IPCC AR6 WG1 Table 7.SM.7
 * @source UK DEFRA/DESNZ 2025
 * @source EIA CBECS 2018
 */

import type { EmissionFactorSet } from '@/domain/types/factors'
import epaFactorsData from '../../../data/epa-emission-factors-2025.json'
import egridData from '../../../data/egrid-subregions-2023.json'
import gwpData from '../../../data/ipcc-ar6-gwp100.json'
import cbecsData from '../../../data/cbecs-2018-benchmarks.json'
import scope3SpendData from '../../../data/scope3-spend-factors.json'
import { GWP_CH4_FOSSIL, GWP_N2O, FACTOR_SET_VERSION, MMBTU_PER_THERM } from '@/domain/constants'

const epa = epaFactorsData.tables
const egrid = egridData as any
const gwp = gwpData as any
const cbecs = cbecsData as any
const scope3Spend = scope3SpendData as any

/**
 * Build the complete EmissionFactorSet from static JSON data.
 * This is the single source of truth for all calculations.
 */
export function buildFactorSet(): EmissionFactorSet {
  return {
    version: FACTOR_SET_VERSION,
    stationaryCombustion: buildStationaryCombustionFactors(),
    mobileCombustion: buildMobileCombustionFactors(),
    gridElectricity: buildGridElectricityFactors(),
    refrigerantGWP: buildRefrigerantGWPFactors(),
    scope3: buildScope3Factors(),
    waste: buildWasteFactors(),
    water: buildWaterFactors(),
    benchmarks: buildBenchmarkFactors(),
  }
}

function buildStationaryCombustionFactors() {
  const sc = epa.table1_stationary_combustion
  return {
    natural_gas: {
      co2_kg_per_unit: sc.natural_gas.co2_kg_per_mmbtu,
      ch4_g_per_unit: sc.natural_gas.ch4_g_per_mmbtu,
      n2o_g_per_unit: sc.natural_gas.n2o_g_per_mmbtu,
      unit: 'mmbtu',
      heat_content_mmbtu_per_native: MMBTU_PER_THERM,
    },
    diesel: {
      co2_kg_per_unit: sc.diesel_no2.co2_kg_per_gallon,
      ch4_g_per_unit: sc.diesel_no2.ch4_g_per_gallon,
      n2o_g_per_unit: sc.diesel_no2.n2o_g_per_gallon,
      unit: 'gallon',
    },
    fuel_oil_6: {
      co2_kg_per_unit: sc.residual_fuel_oil_no6.co2_kg_per_gallon,
      ch4_g_per_unit: sc.residual_fuel_oil_no6.ch4_g_per_gallon,
      n2o_g_per_unit: sc.residual_fuel_oil_no6.n2o_g_per_gallon,
      unit: 'gallon',
    },
    propane: {
      co2_kg_per_unit: sc.propane.co2_kg_per_gallon,
      ch4_g_per_unit: sc.propane.ch4_g_per_gallon,
      n2o_g_per_unit: sc.propane.n2o_g_per_gallon,
      unit: 'gallon',
    },
    kerosene: {
      co2_kg_per_unit: sc.kerosene.co2_kg_per_gallon,
      ch4_g_per_unit: sc.kerosene.ch4_g_per_gallon,
      n2o_g_per_unit: sc.kerosene.n2o_g_per_gallon,
      unit: 'gallon',
    },
  }
}

function buildMobileCombustionFactors() {
  return {
    co2_per_fuel: {
      gasoline: { co2_kg_per_gallon: epa.table2_mobile_combustion_co2.gasoline.co2_kg_per_gallon },
      diesel: { co2_kg_per_gallon: epa.table2_mobile_combustion_co2.diesel.co2_kg_per_gallon },
    },
    ch4_n2o_per_vehicle: epa.table3_mobile_combustion_ch4_n2o,
    default_fuel_economy: epa.table4_default_fuel_economy_mpg,
  }
}

function buildGridElectricityFactors() {
  const subregions: Record<string, { co2e_kg_per_kwh: number; grid_gross_loss_pct: number }> = {}
  for (const [code, data] of Object.entries(egrid.subregions)) {
    const d = data as any
    subregions[code] = {
      co2e_kg_per_kwh: d.co2e_kg_per_kwh,
      grid_gross_loss_pct: d.grid_gross_loss_pct,
    }
  }

  const international: Record<string, { co2e_kg_per_kwh: number }> = {}
  for (const [country, data] of Object.entries(egrid.international_grid_factors)) {
    const d = data as any
    international[country] = { co2e_kg_per_kwh: d.co2e_kg_per_kwh }
  }

  return {
    subregions,
    stateToSubregion: egrid.stateToSubregion as Record<string, string>,
    international,
  }
}

function buildRefrigerantGWPFactors() {
  const gases: Record<string, { gwp100: number }> = {}

  for (const [name, data] of Object.entries(gwp.gases)) {
    const d = data as any
    const key = d.common_name || name
    gases[key] = { gwp100: d.gwp100 }
    // Also store by formal name
    if (d.common_name && d.common_name !== name) {
      gases[name] = { gwp100: d.gwp100 }
    }
  }

  return {
    gases,
    defaultLeakRates: gwp.default_leak_rates_by_equipment as Record<string, number>,
  }
}

function buildScope3Factors() {
  const travel = epa.table9_business_travel
  const commute = epa.table11_employee_commuting
  const transport = epa.table10_product_transport
  const upstream = epa.table8_upstream_fuel_and_energy

  const businessTravel: Record<string, { kg_co2e_per_passenger_mile: number }> = {}
  for (const [mode, data] of Object.entries(travel)) {
    businessTravel[mode] = { kg_co2e_per_passenger_mile: (data as any).kg_co2e_per_passenger_mile }
  }

  const employeeCommuting: Record<string, { kg_co2e_per_mile: number }> = {}
  for (const [mode, data] of Object.entries(commute)) {
    const d = data as any
    employeeCommuting[mode] = {
      kg_co2e_per_mile: d.kg_co2e_per_vehicle_mile || d.kg_co2e_per_passenger_mile || 0,
    }
  }

  const productTransport: Record<string, { kg_co2e_per_ton_mile: number }> = {}
  for (const [mode, data] of Object.entries(transport)) {
    productTransport[mode] = { kg_co2e_per_ton_mile: (data as any).kg_co2e_per_ton_mile }
  }

  const spendBased: Record<string, { kg_co2e_per_usd: number }> = {}
  for (const [sector, data] of Object.entries(scope3Spend.sectors)) {
    spendBased[sector] = { kg_co2e_per_usd: (data as any).factor }
  }

  return {
    businessTravel,
    employeeCommuting,
    productTransport,
    spendBased,
    upstreamFuelEnergy: {
      natural_gas: {
        wtt_kg_co2e_per_unit: upstream.natural_gas_wtt_kg_co2e_per_mmbtu,
        unit: 'mmbtu',
      },
      diesel: {
        wtt_kg_co2e_per_unit: upstream.diesel_wtt_kg_co2e_per_gallon,
        unit: 'gallon',
      },
      gasoline: {
        wtt_kg_co2e_per_unit: upstream.gasoline_wtt_kg_co2e_per_gallon,
        unit: 'gallon',
      },
    },
  }
}

function buildWasteFactors() {
  const w = epa.table12_waste_disposal
  const result: Record<string, { tco2e_per_short_ton: number }> = {}
  for (const [key, data] of Object.entries(w)) {
    result[key] = { tco2e_per_short_ton: (data as any).tco2e_per_short_ton }
  }
  return result
}

function buildWaterFactors() {
  return {
    supply: { kg_co2e_per_1000_gallons: 0.4163 },
    treatment: { kg_co2e_per_1000_gallons: 0.8706 },
  }
}

function buildBenchmarkFactors() {
  const result: Record<string, any> = {}
  for (const [type, data] of Object.entries(cbecs.buildingTypes)) {
    const d = data as any
    result[type] = {
      eui_kbtu_sqft: d.eui_kbtu_sqft,
      electricity_kwh_sqft: d.electricity_kwh_sqft,
      natural_gas_therms_sqft: d.natural_gas_therms_sqft,
      fuel_split: d.fuel_split,
      benchmark_kg_co2e_per_sqft: d.benchmark_kg_co2e_per_sqft,
    }
  }
  return result
}

// ═══════════════════════════════════════════════════
// CONVENIENCE LOOKUP FUNCTIONS
// ═══════════════════════════════════════════════════

/** Get eGRID subregion code from US state abbreviation */
export function stateToSubregion(state: string): string | undefined {
  return egrid.stateToSubregion[state.toUpperCase()]
}

/** Get grid emission factor for a US state (kg CO2e/kWh) */
export function getGridFactorForState(state: string): number {
  const subregion = stateToSubregion(state)
  if (!subregion) return egrid.international_grid_factors.US_national_average.co2e_kg_per_kwh
  return egrid.subregions[subregion]?.co2e_kg_per_kwh ?? egrid.international_grid_factors.US_national_average.co2e_kg_per_kwh
}

/** Get GWP-100 for a refrigerant by common name (e.g., "R-410A") */
export function getGWP(refrigerant: string): number {
  const gas = gwp.gases[refrigerant]
  if (gas) return gas.gwp100

  // Try common name lookup
  for (const data of Object.values(gwp.gases)) {
    const d = data as any
    if (d.common_name === refrigerant) return d.gwp100
  }

  throw new Error(`Unknown refrigerant: ${refrigerant}. Check IPCC AR6 GWP data.`)
}
