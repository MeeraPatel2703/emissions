export type InterventionType =
  | 'renewable_switch'
  | 'fleet_electrification'
  | 'hvac_upgrade'
  | 'solar_onsite'
  | 'building_envelope'
  | 'waste_reduction'

export interface Intervention {
  type: InterventionType
  name: string
  description: string
  params: Record<string, number>   // intervention-specific parameters
}

export interface RenewableSwitchParams {
  renewablePct: number             // 0-1, fraction of electricity from renewable PPA
}

export interface FleetElectrificationParams {
  electrificationPct: number       // 0-1, fraction of fleet converted to EV
  evEfficiency: number             // kWh per mile
}

export interface HvacUpgradeParams {
  newCOP: number                   // new coefficient of performance
  oldCOP: number                   // old coefficient of performance
}

export interface SolarOnsiteParams {
  capacityKw: number               // installed capacity in kW
  annualCapacityFactor: number     // 0-1 (e.g., 0.18 for typical US rooftop)
}

export interface BuildingEnvelopeParams {
  heatingReductionPct: number      // 0-1, reduction in heating load
  coolingReductionPct: number      // 0-1, reduction in cooling load
}

export interface WasteReductionParams {
  landfillDiversionPct: number     // 0-1, fraction diverted from landfill
  newDisposalMethod: 'recycled' | 'composted' | 'incinerated'
}

export interface InterventionResult {
  type: InterventionType
  annualEmissionReduction: number  // tCO2e/year
  capex: number                    // USD
  annualOpexChange: number         // USD (negative = savings)
  implementationYears: number
}

export interface ScenarioResult {
  name: string
  interventions: InterventionResult[]
  baselineEmissions: number        // tCO2e/year (current)
  projectedEmissions: number       // tCO2e/year (after interventions)
  totalReduction: number           // tCO2e/year
  reductionPct: number             // 0-1
  totalCapex: number
  annualSavings: number
  simplePaybackYears: number
  npv: number                      // at default discount rate
  irr: number | null               // internal rate of return
  cumulativeCO2Avoided10yr: number // tCO2e over 10 years
  projectedTrajectory: YearlyProjection[]
}

export interface YearlyProjection {
  year: number
  baselineEmissions: number
  scenarioEmissions: number
  cumulativeReduction: number
  gridEF: number                   // projected grid emission factor
}

export interface CarbonPriceScenario {
  name: string
  pricePerTon: number              // USD per tCO2e
  annualEscalation: number         // fraction (e.g., 0.03 for 3%/year)
}
