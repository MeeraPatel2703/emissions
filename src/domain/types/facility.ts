export type BuildingType =
  | 'office'
  | 'warehouse'
  | 'manufacturing'
  | 'data_center'
  | 'hospital'
  | 'retail'
  | 'education'
  | 'food_service'
  | 'lodging'

export type InputMode = 'basic' | 'advanced' | 'expert'

export type DataQuality = 'measured' | 'estimated' | 'modeled'

export interface FacilityLocation {
  country: string
  state?: string
  zipCode?: string
  city?: string
  climateZone?: string    // ASHRAE zone (e.g., "4A")
  egridSubregion?: string // eGRID code (e.g., "RFCE")
  latitude?: number
  longitude?: number
}

export interface FacilityDimensions {
  squareFeet: number
  height?: number   // feet
  yearBuilt?: number
}

export interface FacilityProfile {
  id?: string
  name: string
  buildingType: BuildingType
  location: FacilityLocation
  dimensions: FacilityDimensions
  inputMode: InputMode
  energy: EnergyInputSet
  refrigerants: RefrigerantInput[]
  fleet: FleetVehicleInput[]
  waste: WasteStreamInput[]
  water: WaterUsageInput[]
  scope3: Scope3InputSet
  buildingPhysics?: BuildingPhysicsInput
  occupancy?: OccupancyInput
}

export interface OccupancyInput {
  employees: number
  annualVisitors?: number
}

export interface EnergyInputSet {
  electricity?: EnergyLineItem
  naturalGas?: EnergyLineItem
  diesel?: EnergyLineItem
  fuelOil2?: EnergyLineItem
  fuelOil6?: EnergyLineItem
  propane?: EnergyLineItem
  kerosene?: EnergyLineItem
}

export interface EnergyLineItem {
  quantity: number
  unit: string          // kWh, therms, ccf, MMBtu, gallons
  period: 'annual' | 'monthly'
  dataQuality: DataQuality
  isRenewable?: boolean // for market-based Scope 2
  supplierEF?: number   // supplier-specific emission factor (kg CO2e/kWh)
}

export interface RefrigerantInput {
  refrigerantType: string // R-410A, R-134a, R-32, R-22, etc.
  chargeAmount: number    // kg
  annualLeakRate: number  // fraction (0.05 = 5%)
  equipmentType?: string
  dataQuality: DataQuality
}

export interface FleetVehicleInput {
  vehicleType: 'passenger_car' | 'light_truck' | 'medium_truck' | 'heavy_truck'
  fuelType: 'gasoline' | 'diesel' | 'ev' | 'hybrid'
  count: number
  annualMilesPerVehicle: number
  fuelEfficiency?: number // mpg override
  dataQuality: DataQuality
}

export interface WasteStreamInput {
  wasteType: string      // mixed_msw, paper, cardboard, plastic, food, construction
  disposalMethod: string // landfill, recycled, composted, incinerated, anaerobic_digestion
  annualTonnes: number   // metric tonnes
  dataQuality: DataQuality
}

export interface WaterUsageInput {
  source: 'municipal' | 'groundwell' | 'surface' | 'recycled'
  annualGallons: number
  treatmentType?: 'primary' | 'secondary' | 'tertiary'
  dataQuality: DataQuality
}

export interface Scope3InputSet {
  cat1PurchasedGoods?: Scope3SpendInput[]
  cat2CapitalGoods?: Scope3SpendInput[]
  cat3FuelEnergy?: { included: boolean }  // auto-calculated from Scope 1/2 data
  cat4UpstreamTransport?: Scope3TransportInput[]
  cat5Waste?: { included: boolean }       // auto-calculated from waste data
  cat6BusinessTravel?: Scope3TravelInput[]
  cat7EmployeeCommuting?: Scope3CommuteInput
  cat8UpstreamLeased?: Scope3SpendInput[]
  cat9DownstreamTransport?: Scope3TransportInput[]
  cat10Processing?: Scope3SpendInput[]
  cat11ProductUse?: Scope3SpendInput[]
  cat12EndOfLife?: Scope3SpendInput[]
  cat13DownstreamLeased?: Scope3SpendInput[]
  cat14Franchises?: Scope3SpendInput[]
  cat15Investments?: Scope3SpendInput[]
}

export interface Scope3SpendInput {
  sector: string
  annualSpendUSD: number
  dataQuality: DataQuality
}

export interface Scope3TransportInput {
  mode: 'truck' | 'rail' | 'waterborne' | 'air'
  tonMiles: number
  dataQuality: DataQuality
}

export interface Scope3TravelInput {
  mode: 'air_short' | 'air_medium' | 'air_long' | 'rail' | 'bus' | 'car'
  passengerMiles: number
  dataQuality: DataQuality
}

export interface Scope3CommuteInput {
  employees: number
  workingDaysPerYear: number
  modes: CommuteMode[]
  dataQuality: DataQuality
}

export interface CommuteMode {
  mode: 'car' | 'bus' | 'rail_light' | 'rail_heavy' | 'bike' | 'walk' | 'telecommute'
  percentOfEmployees: number // fraction
  oneWayDistanceMiles: number
}

export interface BuildingPhysicsInput {
  wallUValue?: number    // W/(m2*K)
  roofUValue?: number
  windowUValue?: number
  windowToWallRatio?: number // 0-1
  infiltrationRate?: number  // ACH
  hvacType?: 'central_air' | 'split' | 'heat_pump' | 'boiler_chiller'
  hvacEfficiency?: number    // COP or AFUE
  lightingDensity?: number   // W/sqft
  occupantDensity?: number   // persons/sqft
  operatingHours?: number    // hours/week
}
