/**
 * Scope 1 — Mobile Combustion Emissions
 *
 * Calculates CO2, CH4, and N2O from company-owned fleet vehicles.
 *
 * @methodology GHG Protocol Corporate Standard, Chapter 6
 * @formula CO2 = (annual_miles / mpg) × EF_CO2 (kg/gallon)
 * @formula CH4_CO2e = annual_miles × EF_CH4 (g/mile) × GWP_CH4 / 1e6
 * @formula N2O_CO2e = annual_miles × EF_N2O (g/mile) × GWP_N2O / 1e6
 * @source EPA GHG EF Hub 2025, Tables 2-5
 * @source IPCC AR6 WG1, Table 7.SM.7
 * @uncertainty_class Medium (±10% for fleet data, ±2% for EFs)
 */

import type { FleetVehicleInput } from '@/domain/types/facility'
import type { MobileCombustionFactors } from '@/domain/types/factors'
import type { CategoryBreakdown, GHGBreakdown } from '@/domain/types/emissions'
import { GWP_CH4_FOSSIL, GWP_N2O, KG_PER_METRIC_TONNE } from '@/domain/constants'

interface MobileCombustionResult {
  total_co2e_tonnes: number
  categories: CategoryBreakdown[]
}

export function calculateMobileCombustion(
  fleet: FleetVehicleInput[],
  factors: MobileCombustionFactors,
): MobileCombustionResult {
  const categories: CategoryBreakdown[] = []
  let total = 0

  for (const vehicle of fleet) {
    if (vehicle.fuelType === 'ev') continue // EVs have zero Scope 1 (Scope 2 from charging)
    if (vehicle.count <= 0 || vehicle.annualMilesPerVehicle <= 0) continue

    const totalMiles = vehicle.count * vehicle.annualMilesPerVehicle
    const ghg = calculateVehicleGHG(vehicle, totalMiles, factors)

    categories.push({
      scope: 1,
      category: 'mobile_combustion',
      subcategory: `${vehicle.vehicleType}_${vehicle.fuelType}`,
      value: ghg.total_co2e_tonnes,
      co2: ghg.co2_tonnes,
      ch4_co2e: ghg.ch4_co2e_tonnes,
      n2o_co2e: ghg.n2o_co2e_tonnes,
      dataQuality: vehicle.dataQuality,
      methodology: `${vehicle.count} vehicles × ${vehicle.annualMilesPerVehicle} mi/yr × EF`,
      source: 'EPA GHG EF Hub 2025, Tables 2-5',
    })

    total += ghg.total_co2e_tonnes
  }

  return { total_co2e_tonnes: total, categories }
}

function calculateVehicleGHG(
  vehicle: FleetVehicleInput,
  totalMiles: number,
  factors: MobileCombustionFactors,
): GHGBreakdown {
  const fuelType = vehicle.fuelType === 'hybrid' ? 'gasoline' : vehicle.fuelType

  // CO2 from fuel consumption: miles / mpg = gallons, gallons × EF
  const mpg = vehicle.fuelEfficiency
    ?? factors.default_fuel_economy[vehicle.vehicleType]?.[fuelType]
    ?? 25 // fallback

  const gallons = totalMiles / mpg
  const co2_kg = gallons * (factors.co2_per_fuel[fuelType]?.co2_kg_per_gallon ?? 0)
  let co2_tonnes = co2_kg / KG_PER_METRIC_TONNE

  // For hybrids, assume 30% fuel reduction vs gasoline equivalent
  if (vehicle.fuelType === 'hybrid') {
    co2_tonnes *= 0.7
  }

  // CH4 and N2O per mile (distance-based factors)
  const ch4n2o = factors.ch4_n2o_per_vehicle[vehicle.vehicleType]?.[fuelType]
  const ch4_g = totalMiles * (ch4n2o?.ch4_g_per_mile ?? 0)
  const n2o_g = totalMiles * (ch4n2o?.n2o_g_per_mile ?? 0)

  const ch4_co2e_tonnes = (ch4_g * GWP_CH4_FOSSIL) / 1e6
  const n2o_co2e_tonnes = (n2o_g * GWP_N2O) / 1e6

  return {
    co2_tonnes,
    ch4_co2e_tonnes,
    n2o_co2e_tonnes,
    total_co2e_tonnes: co2_tonnes + ch4_co2e_tonnes + n2o_co2e_tonnes,
  }
}
