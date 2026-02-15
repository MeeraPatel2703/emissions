/**
 * Scope 1 — Stationary Combustion Emissions
 *
 * Calculates CO2, CH4, and N2O from on-site fuel combustion (boilers, furnaces, generators).
 *
 * @methodology GHG Protocol Corporate Standard, Chapter 6: Identifying and Calculating Direct Emissions
 * @formula CO2 = fuel_quantity_in_native_unit × heat_content × EF_CO2 (kg/MMBtu)
 * @formula CH4_CO2e = fuel_quantity × heat_content × EF_CH4 (g/MMBtu) × GWP_CH4 / 1e6
 * @formula N2O_CO2e = fuel_quantity × heat_content × EF_N2O (g/MMBtu) × GWP_N2O / 1e6
 * @source EPA GHG Emission Factors Hub, March 2025, Table 1
 * @source IPCC AR6 WG1, Table 7.SM.7 (GWP-100 values)
 * @uncertainty_class Low (±1% for EFs, ±2.5% for measured fuel data, ±15% for estimated)
 */

import type { EnergyInputSet, DataQuality } from '@/domain/types/facility'
import type { StationaryCombustionFactors } from '@/domain/types/factors'
import type { CategoryBreakdown, GHGBreakdown } from '@/domain/types/emissions'
import { GWP_CH4_FOSSIL, GWP_N2O, MMBTU_PER_THERM, KG_PER_METRIC_TONNE } from '@/domain/constants'

interface StationaryCombustionResult {
  total_co2e_tonnes: number
  categories: CategoryBreakdown[]
}

const FUEL_MAP: Record<string, { energyKey: keyof EnergyInputSet; factorKey: string; nativeUnit: string }> = {
  naturalGas: { energyKey: 'naturalGas', factorKey: 'natural_gas', nativeUnit: 'therms' },
  diesel: { energyKey: 'diesel', factorKey: 'diesel', nativeUnit: 'gallons' },
  fuelOil6: { energyKey: 'fuelOil6', factorKey: 'fuel_oil_6', nativeUnit: 'gallons' },
  propane: { energyKey: 'propane', factorKey: 'propane', nativeUnit: 'gallons' },
  kerosene: { energyKey: 'kerosene', factorKey: 'kerosene', nativeUnit: 'gallons' },
}

export function calculateStationaryCombustion(
  energy: EnergyInputSet,
  factors: StationaryCombustionFactors,
): StationaryCombustionResult {
  const categories: CategoryBreakdown[] = []
  let total = 0

  for (const [name, mapping] of Object.entries(FUEL_MAP)) {
    const input = energy[mapping.energyKey]
    if (!input || input.quantity <= 0) continue

    const ef = factors[mapping.factorKey]
    if (!ef) continue

    const ghg = calculateFuelGHG(input.quantity, ef, mapping.nativeUnit)

    categories.push({
      scope: 1,
      category: 'stationary_combustion',
      subcategory: mapping.factorKey,
      value: ghg.total_co2e_tonnes,
      co2: ghg.co2_tonnes,
      ch4_co2e: ghg.ch4_co2e_tonnes,
      n2o_co2e: ghg.n2o_co2e_tonnes,
      dataQuality: input.dataQuality,
      methodology: `${input.quantity} ${input.unit} × EF (${ef.unit})`,
      source: 'EPA GHG EF Hub 2025, Table 1',
    })

    total += ghg.total_co2e_tonnes
  }

  return { total_co2e_tonnes: total, categories }
}

/**
 * Calculate GHG emissions for a single fuel type.
 *
 * For fuels measured in native units (gallons, therms), the EF is applied directly.
 * For natural gas measured in therms, first convert to MMBtu: therms × 0.1 = MMBtu.
 */
function calculateFuelGHG(
  quantity: number,
  ef: StationaryCombustionFactors[string],
  nativeUnit: string,
): GHGBreakdown {
  let effectiveQuantity = quantity

  // If the EF is per MMBtu and the input is in therms, convert
  if (ef.unit === 'mmbtu' && ef.heat_content_mmbtu_per_native) {
    effectiveQuantity = quantity * ef.heat_content_mmbtu_per_native
  }

  // CO2 in kg → convert to tonnes
  const co2_kg = effectiveQuantity * ef.co2_kg_per_unit
  const co2_tonnes = co2_kg / KG_PER_METRIC_TONNE

  // CH4: g → kg → CO2e tonnes
  // CH4 from fossil fuel combustion uses fossil CH4 GWP (AR6: 29.8)
  const ch4_g = effectiveQuantity * ef.ch4_g_per_unit
  const ch4_co2e_tonnes = (ch4_g * GWP_CH4_FOSSIL) / 1e6

  // N2O: g → CO2e tonnes
  const n2o_g = effectiveQuantity * ef.n2o_g_per_unit
  const n2o_co2e_tonnes = (n2o_g * GWP_N2O) / 1e6

  return {
    co2_tonnes,
    ch4_co2e_tonnes,
    n2o_co2e_tonnes,
    total_co2e_tonnes: co2_tonnes + ch4_co2e_tonnes + n2o_co2e_tonnes,
  }
}
