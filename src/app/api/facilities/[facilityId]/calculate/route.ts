import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/adapters/prisma/client'
import { computeAllEmissions } from '@/lib/emissions/engine'
import { buildFactorSet } from '@/lib/factors/registry'
import type { FacilityProfile } from '@/domain/types/facility'

/** POST /api/facilities/[facilityId]/calculate — run full emissions calculation */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ facilityId: string }> },
) {
  try {
    const { facilityId } = await params

    // Load facility with all related data
    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
      include: {
        energyInputs: true,
        refrigerants: true,
        fleetVehicles: true,
        wasteStreams: true,
        waterUsage: true,
        scope3Inputs: true,
        buildingPhysics: true,
      },
    })

    if (!facility) {
      return NextResponse.json({ error: 'Facility not found' }, { status: 404 })
    }

    // Transform DB model to domain model
    const profile = transformToProfile(facility)

    // Build factor set and compute
    const factors = buildFactorSet()
    const result = computeAllEmissions(profile, factors)

    // Persist the result
    const saved = await prisma.calculationResult.create({
      data: {
        facilityId,
        totalEmissions: result.total,
        scope1Total: result.scope1.total,
        scope2LocationTotal: result.scope2Location.total,
        scope2MarketTotal: result.scope2Market.total,
        scope3Total: result.scope3.total,
        emissionsPerSqft: result.intensity.perSqFt,
        emissionsPerEmployee: result.intensity.perEmployee,
        breakdown: result.breakdown as any,
        methodology: result.methodology as any,
        uncertainty: result.uncertainty as any,
        inputSnapshot: profile as any,
        factorSetVersion: factors.version,
        calculationVersion: result.methodology.engineVersion,
      },
    })

    return NextResponse.json({
      resultId: saved.id,
      ...result,
    })
  } catch (error) {
    console.error('Calculation failed:', error)
    return NextResponse.json({ error: 'Calculation failed' }, { status: 500 })
  }
}

function transformToProfile(dbFacility: any): FacilityProfile {
  const energy: FacilityProfile['energy'] = {}

  for (const input of dbFacility.energyInputs) {
    const key = fuelTypeToKey(input.fuelType)
    if (key) {
      energy[key] = {
        quantity: input.quantity,
        unit: input.unit,
        period: input.period as any,
        dataQuality: input.dataQuality as any,
        isRenewable: input.isRenewable,
        supplierEF: input.supplierEF ?? undefined,
      }
    }
  }

  return {
    id: dbFacility.id,
    name: dbFacility.name,
    buildingType: dbFacility.buildingType as any,
    location: {
      country: dbFacility.country,
      state: dbFacility.state ?? undefined,
      zipCode: dbFacility.zipCode ?? undefined,
      city: dbFacility.city ?? undefined,
      climateZone: dbFacility.climateZone ?? undefined,
      egridSubregion: dbFacility.egridSubregion ?? undefined,
      latitude: dbFacility.latitude ?? undefined,
      longitude: dbFacility.longitude ?? undefined,
    },
    dimensions: {
      squareFeet: dbFacility.squareFeet,
      yearBuilt: dbFacility.yearBuilt ?? undefined,
    },
    inputMode: dbFacility.inputMode as any,
    energy,
    refrigerants: dbFacility.refrigerants.map((r: any) => ({
      refrigerantType: r.refrigerantType,
      chargeAmount: r.chargeAmount,
      annualLeakRate: r.annualLeakRate,
      equipmentType: r.equipmentType ?? undefined,
      dataQuality: r.dataQuality as any,
    })),
    fleet: dbFacility.fleetVehicles.map((f: any) => ({
      vehicleType: f.vehicleType as any,
      fuelType: f.fuelType as any,
      count: f.count,
      annualMilesPerVehicle: f.annualMiles,
      fuelEfficiency: f.fuelEfficiency ?? undefined,
      dataQuality: f.dataQuality as any,
    })),
    waste: dbFacility.wasteStreams.map((w: any) => ({
      wasteType: w.wasteType,
      disposalMethod: w.disposalMethod,
      annualTonnes: w.annualTonnes,
      dataQuality: w.dataQuality as any,
    })),
    water: dbFacility.waterUsage.map((w: any) => ({
      source: w.source as any,
      annualGallons: w.annualGallons,
      treatmentType: w.treatmentType ?? undefined,
      dataQuality: w.dataQuality as any,
    })),
    scope3: {
      cat3FuelEnergy: { included: true },
      cat5Waste: { included: true },
    },
    occupancy: undefined,
  }
}

function fuelTypeToKey(fuelType: string): keyof FacilityProfile['energy'] | null {
  const map: Record<string, keyof FacilityProfile['energy']> = {
    electricity: 'electricity',
    naturalGas: 'naturalGas',
    natural_gas: 'naturalGas',
    diesel: 'diesel',
    fuelOil2: 'fuelOil2',
    fuel_oil_2: 'fuelOil2',
    fuelOil6: 'fuelOil6',
    fuel_oil_6: 'fuelOil6',
    propane: 'propane',
    kerosene: 'kerosene',
  }
  return map[fuelType] ?? null
}
