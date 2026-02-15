/** Typed representation of the complete emission factor set used in a calculation */
export interface EmissionFactorSet {
  version: string                  // e.g., "epa-2025_egrid-2023_ar6"

  stationaryCombustion: StationaryCombustionFactors
  mobileCombustion: MobileCombustionFactors
  gridElectricity: GridElectricityFactors
  refrigerantGWP: RefrigerantGWPFactors
  scope3: Scope3Factors
  waste: WasteFactors
  water: WaterFactors
  benchmarks: BenchmarkFactors
}

export interface StationaryCombustionFactors {
  [fuelType: string]: {
    co2_kg_per_unit: number
    ch4_g_per_unit: number
    n2o_g_per_unit: number
    unit: string                   // "mmbtu", "gallon", "therm"
    heat_content_mmbtu_per_native?: number
  }
}

export interface MobileCombustionFactors {
  co2_per_fuel: {
    [fuelType: string]: {
      co2_kg_per_gallon: number
    }
  }
  ch4_n2o_per_vehicle: {
    [vehicleType: string]: {
      [fuelType: string]: {
        ch4_g_per_mile: number
        n2o_g_per_mile: number
      }
    }
  }
  default_fuel_economy: {
    [vehicleType: string]: {
      [fuelType: string]: number   // mpg
    }
  }
}

export interface GridElectricityFactors {
  subregions: {
    [subregionCode: string]: {
      co2e_kg_per_kwh: number
      grid_gross_loss_pct: number
    }
  }
  stateToSubregion: { [state: string]: string }
  international: {
    [country: string]: {
      co2e_kg_per_kwh: number
    }
  }
}

export interface RefrigerantGWPFactors {
  gases: Record<string, { gwp100: number }>
  defaultLeakRates: Record<string, number>
}

export interface Scope3Factors {
  businessTravel: {
    [mode: string]: {
      kg_co2e_per_passenger_mile: number
    }
  }
  employeeCommuting: {
    [mode: string]: {
      kg_co2e_per_mile: number     // vehicle-mile or passenger-mile
    }
  }
  productTransport: {
    [mode: string]: {
      kg_co2e_per_ton_mile: number
    }
  }
  spendBased: {
    [sector: string]: {
      kg_co2e_per_usd: number
    }
  }
  upstreamFuelEnergy: {
    [fuelType: string]: {
      wtt_kg_co2e_per_unit: number
      unit: string
    }
  }
}

export interface WasteFactors {
  [wasteType_disposalMethod: string]: {
    tco2e_per_short_ton: number
  }
}

export interface WaterFactors {
  supply: { kg_co2e_per_1000_gallons: number }
  treatment: { kg_co2e_per_1000_gallons: number }
}

export interface BenchmarkFactors {
  [buildingType: string]: {
    eui_kbtu_sqft: { median: number; p25: number; p75: number }
    electricity_kwh_sqft: { median: number }
    natural_gas_therms_sqft: { median: number }
    fuel_split: { electricity_pct: number; natural_gas_pct: number; other_pct: number }
    benchmark_kg_co2e_per_sqft: { median: number; p25: number; p75: number }
  }
}
