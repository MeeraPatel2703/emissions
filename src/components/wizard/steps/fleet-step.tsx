'use client'

import { useWizardStore } from '@/stores/wizard-store'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { FleetVehicleInput } from '@/domain/types/facility'

export function FleetStep() {
  const { fleet, setFleet } = useWizardStore()

  const addVehicle = () => {
    setFleet([
      ...fleet,
      {
        vehicleType: 'passenger_car',
        fuelType: 'gasoline',
        count: 1,
        annualMilesPerVehicle: 12000,
        dataQuality: 'estimated',
      },
    ])
  }

  const updateVehicle = (idx: number, updates: Partial<FleetVehicleInput>) => {
    const updated = [...fleet]
    updated[idx] = { ...updated[idx], ...updates }
    setFleet(updated)
  }

  const removeVehicle = (idx: number) => {
    setFleet(fleet.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Add company-owned or leased vehicles. These contribute to Scope 1 (direct) emissions.
        Electric vehicles have zero Scope 1 but add to Scope 2 via grid charging.
      </p>

      {fleet.map((v, idx) => (
        <div key={idx} className="p-4 border rounded-lg space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">Vehicle Group {idx + 1}</h4>
            <Button variant="ghost" size="sm" onClick={() => removeVehicle(idx)}>Remove</Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Vehicle Type</Label>
              <Select value={v.vehicleType} onValueChange={(val) => updateVehicle(idx, { vehicleType: val as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="passenger_car">Passenger Car</SelectItem>
                  <SelectItem value="light_truck">Light Truck / SUV</SelectItem>
                  <SelectItem value="medium_truck">Medium-Duty Truck</SelectItem>
                  <SelectItem value="heavy_truck">Heavy-Duty Truck</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fuel Type</Label>
              <Select value={v.fuelType} onValueChange={(val) => updateVehicle(idx, { fuelType: val as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gasoline">Gasoline</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="ev">Electric (EV)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Number of Vehicles</Label>
              <Input
                type="number"
                value={v.count || ''}
                onChange={(e) => updateVehicle(idx, { count: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Annual Miles (per vehicle)</Label>
              <Input
                type="number"
                placeholder="12000"
                value={v.annualMilesPerVehicle || ''}
                onChange={(e) => updateVehicle(idx, { annualMilesPerVehicle: Number(e.target.value) })}
              />
            </div>
          </div>
        </div>
      ))}

      <Button variant="outline" onClick={addVehicle}>+ Add Vehicle Group</Button>
    </div>
  )
}
