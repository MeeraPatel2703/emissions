'use client'

import { useState } from 'react'
import { useWizardStore } from '@/stores/wizard-store'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { RefrigerantInput } from '@/domain/types/facility'

const REFRIGERANT_TYPES = [
  { value: 'R-410A', label: 'R-410A (GWP 2088)', gwp: 2088 },
  { value: 'R-134a', label: 'R-134a (GWP 1526)', gwp: 1526 },
  { value: 'R-32', label: 'R-32 (GWP 771)', gwp: 771 },
  { value: 'R-22', label: 'R-22 / HCFC-22 (GWP 1960)', gwp: 1960 },
  { value: 'R-404A', label: 'R-404A (GWP 4728)', gwp: 4728 },
  { value: 'R-407C', label: 'R-407C (GWP 1924)', gwp: 1924 },
]

export function RefrigerantsStep() {
  const { refrigerants, setRefrigerants } = useWizardStore()

  const addRefrigerant = () => {
    setRefrigerants([
      ...refrigerants,
      {
        refrigerantType: 'R-410A',
        chargeAmount: 0,
        annualLeakRate: 0.05,
        equipmentType: 'split_system',
        dataQuality: 'estimated',
      },
    ])
  }

  const updateRefrigerant = (idx: number, updates: Partial<RefrigerantInput>) => {
    const updated = [...refrigerants]
    updated[idx] = { ...updated[idx], ...updates }
    setRefrigerants(updated)
  }

  const removeRefrigerant = (idx: number) => {
    setRefrigerants(refrigerants.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Add refrigerant systems (HVAC, chillers, refrigeration). Fugitive emissions from refrigerant
        leakage are a significant Scope 1 source, especially for high-GWP refrigerants.
      </p>

      {refrigerants.map((ref, idx) => (
        <div key={idx} className="p-4 border rounded-lg space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">System {idx + 1}</h4>
            <Button variant="ghost" size="sm" onClick={() => removeRefrigerant(idx)}>Remove</Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Refrigerant Type</Label>
              <Select value={ref.refrigerantType} onValueChange={(v) => updateRefrigerant(idx, { refrigerantType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REFRIGERANT_TYPES.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Equipment Type</Label>
              <Select value={ref.equipmentType ?? 'split_system'} onValueChange={(v) => updateRefrigerant(idx, { equipmentType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="chiller_centrifugal">Chiller (Centrifugal)</SelectItem>
                  <SelectItem value="chiller_reciprocating">Chiller (Reciprocating)</SelectItem>
                  <SelectItem value="split_system">Split System</SelectItem>
                  <SelectItem value="rooftop_unit">Rooftop Unit</SelectItem>
                  <SelectItem value="commercial_refrigeration">Commercial Refrigeration</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Charge Amount (kg)</Label>
              <Input
                type="number"
                placeholder="50"
                value={ref.chargeAmount || ''}
                onChange={(e) => updateRefrigerant(idx, { chargeAmount: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Annual Leak Rate (%)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="5"
                value={ref.annualLeakRate ? ref.annualLeakRate * 100 : ''}
                onChange={(e) => updateRefrigerant(idx, { annualLeakRate: Number(e.target.value) / 100 })}
              />
            </div>
          </div>
        </div>
      ))}

      <Button variant="outline" onClick={addRefrigerant}>+ Add Refrigerant System</Button>
    </div>
  )
}
