'use client'

import { useWizardStore } from '@/stores/wizard-store'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import type { DataQuality } from '@/domain/types/facility'

export function EnergyInputsStep() {
  const { energy, setEnergy, inputMode } = useWizardStore()

  const updateElectricity = (field: string, value: any) => {
    setEnergy({
      electricity: {
        quantity: energy.electricity?.quantity ?? 0,
        unit: 'kWh',
        period: 'annual' as const,
        dataQuality: energy.electricity?.dataQuality ?? ('measured' as DataQuality),
        ...energy.electricity,
        [field]: value,
      },
    })
  }

  const updateGas = (field: string, value: any) => {
    setEnergy({
      naturalGas: {
        quantity: energy.naturalGas?.quantity ?? 0,
        unit: 'therms',
        period: 'annual' as const,
        dataQuality: energy.naturalGas?.dataQuality ?? ('measured' as DataQuality),
        ...energy.naturalGas,
        [field]: value,
      },
    })
  }

  const updateDiesel = (field: string, value: any) => {
    setEnergy({
      diesel: {
        quantity: energy.diesel?.quantity ?? 0,
        unit: 'gallons',
        period: 'annual' as const,
        dataQuality: energy.diesel?.dataQuality ?? ('measured' as DataQuality),
        ...energy.diesel,
        [field]: value,
      },
    })
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">
        Enter your annual energy consumption. If you don&apos;t have exact numbers, leave blank and
        the system will estimate based on your building type and location.
      </p>

      {/* Electricity */}
      <div className="space-y-3 p-4 border rounded-lg">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Electricity</h3>
          <Badge variant="outline">Scope 2</Badge>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <Label>Annual Consumption (kWh)</Label>
            <Input
              type="number"
              placeholder="730000"
              value={energy.electricity?.quantity || ''}
              onChange={(e) => updateElectricity('quantity', Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Data Quality</Label>
            <Select
              value={energy.electricity?.dataQuality ?? 'measured'}
              onValueChange={(v) => updateElectricity('dataQuality', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="measured">Utility Bill</SelectItem>
                <SelectItem value="estimated">Estimated</SelectItem>
                <SelectItem value="modeled">Modeled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Natural Gas */}
      <div className="space-y-3 p-4 border rounded-lg">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Natural Gas</h3>
          <Badge variant="outline">Scope 1</Badge>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <Label>Annual Consumption (therms)</Label>
            <Input
              type="number"
              placeholder="50000"
              value={energy.naturalGas?.quantity || ''}
              onChange={(e) => updateGas('quantity', Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Data Quality</Label>
            <Select
              value={energy.naturalGas?.dataQuality ?? 'measured'}
              onValueChange={(v) => updateGas('dataQuality', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="measured">Utility Bill</SelectItem>
                <SelectItem value="estimated">Estimated</SelectItem>
                <SelectItem value="modeled">Modeled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Diesel (Advanced/Expert only) */}
      {inputMode !== 'basic' && (
        <div className="space-y-3 p-4 border rounded-lg">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Diesel (Backup Generators)</h3>
            <Badge variant="outline">Scope 1</Badge>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Label>Annual Consumption (gallons)</Label>
              <Input
                type="number"
                placeholder="500"
                value={energy.diesel?.quantity || ''}
                onChange={(e) => updateDiesel('quantity', Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Data Quality</Label>
              <Select
                value={energy.diesel?.dataQuality ?? 'estimated'}
                onValueChange={(v) => updateDiesel('dataQuality', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="measured">Measured</SelectItem>
                  <SelectItem value="estimated">Estimated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
