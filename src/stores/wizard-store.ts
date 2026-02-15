import { create } from 'zustand'
import type {
  BuildingType,
  InputMode,
  FacilityLocation,
  EnergyInputSet,
  RefrigerantInput,
  FleetVehicleInput,
  WasteStreamInput,
  WaterUsageInput,
  Scope3InputSet,
  OccupancyInput,
} from '@/domain/types/facility'

export interface WizardState {
  // Current wizard position
  currentStep: number
  inputMode: InputMode

  // Facility data
  name: string
  buildingType: BuildingType
  squareFeet: number
  yearBuilt: number | undefined
  location: FacilityLocation
  energy: EnergyInputSet
  refrigerants: RefrigerantInput[]
  fleet: FleetVehicleInput[]
  waste: WasteStreamInput[]
  water: WaterUsageInput[]
  scope3: Scope3InputSet
  occupancy: OccupancyInput | undefined

  // Actions
  setStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  setInputMode: (mode: InputMode) => void
  setName: (name: string) => void
  setBuildingType: (type: BuildingType) => void
  setSquareFeet: (sqft: number) => void
  setYearBuilt: (year: number | undefined) => void
  setLocation: (loc: Partial<FacilityLocation>) => void
  setEnergy: (energy: Partial<EnergyInputSet>) => void
  setRefrigerants: (refs: RefrigerantInput[]) => void
  setFleet: (fleet: FleetVehicleInput[]) => void
  setWaste: (waste: WasteStreamInput[]) => void
  setWater: (water: WaterUsageInput[]) => void
  setScope3: (s3: Partial<Scope3InputSet>) => void
  setOccupancy: (occ: OccupancyInput | undefined) => void
  reset: () => void
}

const INITIAL_STATE = {
  currentStep: 0,
  inputMode: 'basic' as InputMode,
  name: '',
  buildingType: 'office' as BuildingType,
  squareFeet: 0,
  yearBuilt: undefined,
  location: { country: 'US' } as FacilityLocation,
  energy: {} as EnergyInputSet,
  refrigerants: [] as RefrigerantInput[],
  fleet: [] as FleetVehicleInput[],
  waste: [] as WasteStreamInput[],
  water: [] as WaterUsageInput[],
  scope3: {} as Scope3InputSet,
  occupancy: undefined,
}

export const useWizardStore = create<WizardState>((set) => ({
  ...INITIAL_STATE,

  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((s) => ({ currentStep: s.currentStep + 1 })),
  prevStep: () => set((s) => ({ currentStep: Math.max(0, s.currentStep - 1) })),
  setInputMode: (mode) => set({ inputMode: mode }),
  setName: (name) => set({ name }),
  setBuildingType: (type) => set({ buildingType: type }),
  setSquareFeet: (sqft) => set({ squareFeet: sqft }),
  setYearBuilt: (year) => set({ yearBuilt: year }),
  setLocation: (loc) => set((s) => ({ location: { ...s.location, ...loc } })),
  setEnergy: (energy) => set((s) => ({ energy: { ...s.energy, ...energy } })),
  setRefrigerants: (refs) => set({ refrigerants: refs }),
  setFleet: (fleet) => set({ fleet }),
  setWaste: (waste) => set({ waste }),
  setWater: (water) => set({ water }),
  setScope3: (s3) => set((s) => ({ scope3: { ...s.scope3, ...s3 } })),
  setOccupancy: (occ) => set({ occupancy: occ }),
  reset: () => set(INITIAL_STATE),
}))
