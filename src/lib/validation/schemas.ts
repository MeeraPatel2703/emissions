/**
 * Zod Validation Schemas
 *
 * Single source of truth for input validation.
 * Shared between API routes, form validation, and Prisma input validation.
 */

import { z } from 'zod/v4'

export const buildingTypes = [
  'office', 'warehouse', 'manufacturing', 'data_center',
  'hospital', 'retail', 'education', 'food_service', 'lodging',
] as const

export const dataQualities = ['measured', 'estimated', 'modeled'] as const

export const locationSchema = z.object({
  country: z.string().default('US'),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  city: z.string().optional(),
  climateZone: z.string().optional(),
  egridSubregion: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
})

export const energyLineItemSchema = z.object({
  quantity: z.number().min(0),
  unit: z.string(),
  period: z.enum(['annual', 'monthly']).default('annual'),
  dataQuality: z.enum(dataQualities).default('estimated'),
  isRenewable: z.boolean().default(false),
  supplierEF: z.number().min(0).optional(),
})

export const energyInputSetSchema = z.object({
  electricity: energyLineItemSchema.optional(),
  naturalGas: energyLineItemSchema.optional(),
  diesel: energyLineItemSchema.optional(),
  fuelOil2: energyLineItemSchema.optional(),
  fuelOil6: energyLineItemSchema.optional(),
  propane: energyLineItemSchema.optional(),
  kerosene: energyLineItemSchema.optional(),
})

export const refrigerantInputSchema = z.object({
  refrigerantType: z.string(),
  chargeAmount: z.number().min(0),
  annualLeakRate: z.number().min(0).max(1),
  equipmentType: z.string().optional(),
  dataQuality: z.enum(dataQualities).default('estimated'),
})

export const fleetVehicleSchema = z.object({
  vehicleType: z.enum(['passenger_car', 'light_truck', 'medium_truck', 'heavy_truck']),
  fuelType: z.enum(['gasoline', 'diesel', 'ev', 'hybrid']),
  count: z.number().int().min(0),
  annualMilesPerVehicle: z.number().min(0),
  fuelEfficiency: z.number().min(0).optional(),
  dataQuality: z.enum(dataQualities).default('estimated'),
})

export const wasteStreamSchema = z.object({
  wasteType: z.string(),
  disposalMethod: z.string(),
  annualTonnes: z.number().min(0),
  dataQuality: z.enum(dataQualities).default('estimated'),
})

export const waterUsageSchema = z.object({
  source: z.enum(['municipal', 'groundwell', 'surface', 'recycled']),
  annualGallons: z.number().min(0),
  treatmentType: z.enum(['primary', 'secondary', 'tertiary']).optional(),
  dataQuality: z.enum(dataQualities).default('estimated'),
})

export const facilityCreateSchema = z.object({
  name: z.string().min(1).max(200),
  buildingType: z.enum(buildingTypes),
  squareFeet: z.number().min(100).max(10_000_000),
  yearBuilt: z.number().int().min(1800).max(2030).optional(),
  location: locationSchema,
  inputMode: z.enum(['basic', 'advanced', 'expert']).default('basic'),
  energy: energyInputSetSchema.default({}),
  refrigerants: z.array(refrigerantInputSchema).default([]),
  fleet: z.array(fleetVehicleSchema).default([]),
  waste: z.array(wasteStreamSchema).default([]),
  water: z.array(waterUsageSchema).default([]),
  occupancy: z.object({
    employees: z.number().int().min(0),
    annualVisitors: z.number().int().min(0).optional(),
  }).optional(),
})

export type FacilityCreateInput = z.infer<typeof facilityCreateSchema>
