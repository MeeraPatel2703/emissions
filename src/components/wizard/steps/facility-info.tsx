'use client'

import { useWizardStore } from '@/stores/wizard-store'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { BuildingType } from '@/domain/types/facility'

const BUILDING_TYPES: { value: BuildingType; label: string }[] = [
  { value: 'office', label: 'Office' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'data_center', label: 'Data Center' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'retail', label: 'Retail' },
  { value: 'education', label: 'Education' },
  { value: 'food_service', label: 'Food Service' },
  { value: 'lodging', label: 'Lodging / Hotel' },
]

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN',
  'IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH',
  'NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT',
  'VT','VA','WA','WV','WI','WY',
]

export function FacilityInfoStep() {
  const {
    name, buildingType, squareFeet, yearBuilt, location, occupancy,
    setName, setBuildingType, setSquareFeet, setYearBuilt, setLocation, setOccupancy,
  } = useWizardStore()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="name">Facility Name</Label>
          <Input
            id="name"
            placeholder="e.g. Headquarters Building"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="buildingType">Building Type</Label>
          <Select value={buildingType} onValueChange={(v) => setBuildingType(v as BuildingType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BUILDING_TYPES.map(bt => (
                <SelectItem key={bt.value} value={bt.value}>{bt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="sqft">Square Footage</Label>
          <Input
            id="sqft"
            type="number"
            placeholder="50000"
            value={squareFeet || ''}
            onChange={(e) => setSquareFeet(Number(e.target.value))}
          />
        </div>

        <div>
          <Label htmlFor="state">State</Label>
          <Select
            value={location.state ?? ''}
            onValueChange={(v) => setLocation({ state: v, country: 'US' })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {US_STATES.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="zip">ZIP Code</Label>
          <Input
            id="zip"
            placeholder="20001"
            value={location.zipCode ?? ''}
            onChange={(e) => setLocation({ zipCode: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="yearBuilt">Year Built</Label>
          <Input
            id="yearBuilt"
            type="number"
            placeholder="2005"
            value={yearBuilt ?? ''}
            onChange={(e) => setYearBuilt(e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>

        <div>
          <Label htmlFor="employees">Number of Employees</Label>
          <Input
            id="employees"
            type="number"
            placeholder="250"
            value={occupancy?.employees ?? ''}
            onChange={(e) => {
              const val = Number(e.target.value)
              setOccupancy(val > 0 ? { employees: val } : undefined)
            }}
          />
        </div>
      </div>
    </div>
  )
}
