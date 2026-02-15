/**
 * Estimation Fallback Module
 *
 * When a user provides only building type + square footage + geography (Basic mode),
 * this module estimates energy consumption using CBECS benchmarks and ASHRAE climate data.
 *
 * @methodology
 * 1. Look up median EUI (kBtu/sqft) from CBECS 2018 for building type
 * 2. Apply climate zone adjustment (HDD+CDD ratio vs reference zone 4A)
 * 3. Split energy into electricity vs natural gas using CBECS fuel mix ratios
 * 4. Convert to kWh and therms
 *
 * @source EIA CBECS 2018
 * @source ASHRAE Standard 169-2020
 * @uncertainty_class High (±15% for estimated energy, ±5% if actual data provided)
 */

import type { FacilityProfile, BuildingType, EnergyInputSet } from '@/domain/types/facility'
import type { BenchmarkFactors } from '@/domain/types/factors'
import { MMBTU_PER_KWH, MMBTU_PER_THERM, MMBTU_PER_KBTU } from '@/domain/constants'
import climateZonesData from '../../../../data/ashrae-climate-zones.json'

const climateZones = climateZonesData as any

/**
 * Estimate energy consumption for a facility based on building type, size, and climate.
 * Returns an EnergyInputSet with estimated values marked as dataQuality: 'estimated'.
 */
export function estimateEnergy(facility: FacilityProfile, benchmarks: BenchmarkFactors): EnergyInputSet {
  const bm = benchmarks[facility.buildingType]
  if (!bm) {
    // Unknown building type — use office defaults
    return estimateFromDefaults(facility.dimensions.squareFeet)
  }

  // Get climate adjustment factor
  const climateAdj = getClimateAdjustment(facility)

  // Estimate total EUI (kBtu/sqft), adjusted for climate
  const adjustedEUI = bm.eui_kbtu_sqft.median * climateAdj

  // Total energy in MMBtu
  const totalMMBtu = adjustedEUI * facility.dimensions.squareFeet * MMBTU_PER_KBTU

  // Split by fuel type
  const electricityMMBtu = totalMMBtu * bm.fuel_split.electricity_pct
  const gasMMBtu = totalMMBtu * bm.fuel_split.natural_gas_pct

  // Convert to native units
  const electricityKwh = electricityMMBtu / MMBTU_PER_KWH
  const gasTherms = gasMMBtu / MMBTU_PER_THERM

  const result: EnergyInputSet = {}

  if (electricityKwh > 0) {
    result.electricity = {
      quantity: Math.round(electricityKwh),
      unit: 'kWh',
      period: 'annual',
      dataQuality: 'estimated',
    }
  }

  if (gasTherms > 0) {
    result.naturalGas = {
      quantity: Math.round(gasTherms),
      unit: 'therms',
      period: 'annual',
      dataQuality: 'estimated',
    }
  }

  return result
}

/**
 * Calculate climate adjustment factor.
 * Compares target zone's total degree days to reference zone (4A).
 *
 * Adjustment = (target_HDD + target_CDD) / (ref_HDD + ref_CDD)
 *
 * This is a simplified approach. More accurate methods use separate
 * heating and cooling adjustments weighted by fuel type split.
 */
function getClimateAdjustment(facility: FacilityProfile): number {
  const refZone = climateZones.zones['4A']
  const refTotal = refZone.hdd65 + refZone.cdd65

  // Resolve climate zone
  let zone = facility.location.climateZone
  if (!zone && facility.location.state) {
    zone = climateZones.stateToDefaultZone[facility.location.state.toUpperCase()]
  }
  if (!zone) return 1.0 // No adjustment if we can't determine zone

  const targetZone = climateZones.zones[zone]
  if (!targetZone) return 1.0

  const targetTotal = targetZone.hdd65 + targetZone.cdd65
  const adjustment = targetTotal / refTotal

  // Clamp to reasonable range (0.5x to 2.5x)
  return Math.max(0.5, Math.min(2.5, adjustment))
}

/**
 * Fallback defaults if building type is unknown.
 * Uses median US office building profile.
 */
function estimateFromDefaults(sqft: number): EnergyInputSet {
  // Office median: 14.6 kWh/sqft, 0.18 therms/sqft
  return {
    electricity: {
      quantity: Math.round(sqft * 14.6),
      unit: 'kWh',
      period: 'annual',
      dataQuality: 'estimated',
    },
    naturalGas: {
      quantity: Math.round(sqft * 0.18),
      unit: 'therms',
      period: 'annual',
      dataQuality: 'estimated',
    },
  }
}

/**
 * Check if the facility has enough actual energy data to skip estimation.
 */
export function hasActualEnergyData(energy: EnergyInputSet): boolean {
  const hasElectricity = energy.electricity && energy.electricity.quantity > 0
  return !!hasElectricity
}
