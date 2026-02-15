import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/adapters/prisma/client'
import { facilityCreateSchema } from '@/lib/validation/schemas'

/** GET /api/facilities — list all facilities */
export async function GET() {
  try {
    const facilities = await prisma.facility.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        results: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            totalEmissions: true,
            scope1Total: true,
            scope2LocationTotal: true,
            scope3Total: true,
            emissionsPerSqft: true,
            createdAt: true,
          },
        },
      },
    })

    return NextResponse.json(facilities)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch facilities' }, { status: 500 })
  }
}

/** POST /api/facilities — create a new facility */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = facilityCreateSchema.parse(body)

    const facility = await prisma.facility.create({
      data: {
        name: validated.name,
        buildingType: validated.buildingType,
        squareFeet: validated.squareFeet,
        yearBuilt: validated.yearBuilt,
        country: validated.location.country,
        state: validated.location.state,
        zipCode: validated.location.zipCode,
        city: validated.location.city,
        climateZone: validated.location.climateZone,
        egridSubregion: validated.location.egridSubregion,
        latitude: validated.location.latitude,
        longitude: validated.location.longitude,
        inputMode: validated.inputMode,
        energyInputs: {
          create: Object.entries(validated.energy)
            .filter(([, v]) => v && v.quantity > 0)
            .map(([fuelType, v]) => ({
              fuelType,
              quantity: v!.quantity,
              unit: v!.unit,
              period: v!.period,
              dataQuality: v!.dataQuality,
              isRenewable: v!.isRenewable ?? false,
              supplierEF: v!.supplierEF,
            })),
        },
        refrigerants: {
          create: validated.refrigerants.map(r => ({
            refrigerantType: r.refrigerantType,
            chargeAmount: r.chargeAmount,
            annualLeakRate: r.annualLeakRate,
            equipmentType: r.equipmentType,
            dataQuality: r.dataQuality,
          })),
        },
        fleetVehicles: {
          create: validated.fleet.map(f => ({
            vehicleType: f.vehicleType,
            fuelType: f.fuelType,
            count: f.count,
            annualMiles: f.annualMilesPerVehicle,
            fuelEfficiency: f.fuelEfficiency,
            dataQuality: f.dataQuality,
          })),
        },
        wasteStreams: {
          create: validated.waste.map(w => ({
            wasteType: w.wasteType,
            disposalMethod: w.disposalMethod,
            annualTonnes: w.annualTonnes,
            dataQuality: w.dataQuality,
          })),
        },
        waterUsage: {
          create: validated.water.map(w => ({
            source: w.source,
            annualGallons: w.annualGallons,
            treatmentType: w.treatmentType,
            dataQuality: w.dataQuality,
          })),
        },
      },
    })

    return NextResponse.json(facility, { status: 201 })
  } catch (error: any) {
    if (error?.issues) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create facility' }, { status: 500 })
  }
}
