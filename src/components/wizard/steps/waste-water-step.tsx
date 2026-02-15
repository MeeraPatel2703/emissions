'use client'

import { useWizardStore } from '@/stores/wizard-store'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function WasteWaterStep() {
  const { waste, water, setWaste, setWater } = useWizardStore()

  const addWaste = () => {
    setWaste([...waste, {
      wasteType: 'mixed_msw',
      disposalMethod: 'landfill',
      annualTonnes: 0,
      dataQuality: 'estimated',
    }])
  }

  const updateWaste = (idx: number, updates: any) => {
    const updated = [...waste]
    updated[idx] = { ...updated[idx], ...updates }
    setWaste(updated)
  }

  const removeWaste = (idx: number) => setWaste(waste.filter((_, i) => i !== idx))

  return (
    <div className="space-y-8">
      {/* Waste */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Waste Streams (Scope 3, Cat 5)</h3>
        <p className="text-sm text-muted-foreground">
          Waste disposal method significantly impacts emissions. Landfilling produces methane;
          recycling avoids virgin production emissions.
        </p>

        {waste.map((w, idx) => (
          <div key={idx} className="p-4 border rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Waste Stream {idx + 1}</h4>
              <Button variant="ghost" size="sm" onClick={() => removeWaste(idx)}>Remove</Button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Waste Type</Label>
                <Select value={w.wasteType} onValueChange={(v) => updateWaste(idx, { wasteType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mixed_msw">Mixed Municipal Waste</SelectItem>
                    <SelectItem value="paper">Paper</SelectItem>
                    <SelectItem value="cardboard">Cardboard</SelectItem>
                    <SelectItem value="plastic">Plastic</SelectItem>
                    <SelectItem value="food">Food Waste</SelectItem>
                    <SelectItem value="construction">Construction Debris</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Disposal Method</Label>
                <Select value={w.disposalMethod} onValueChange={(v) => updateWaste(idx, { disposalMethod: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="landfill">Landfill</SelectItem>
                    <SelectItem value="recycled">Recycled</SelectItem>
                    <SelectItem value="composted">Composted</SelectItem>
                    <SelectItem value="incinerated">Incinerated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Annual Tonnes</Label>
                <Input
                  type="number"
                  placeholder="50"
                  value={w.annualTonnes || ''}
                  onChange={(e) => updateWaste(idx, { annualTonnes: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>
        ))}
        <Button variant="outline" onClick={addWaste}>+ Add Waste Stream</Button>
      </div>

      {/* Water */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Water Usage</h3>
        <div className="p-4 border rounded-lg grid grid-cols-2 gap-4">
          <div>
            <Label>Annual Water Consumption (gallons)</Label>
            <Input
              type="number"
              placeholder="1000000"
              value={water[0]?.annualGallons || ''}
              onChange={(e) => setWater([{
                source: 'municipal',
                annualGallons: Number(e.target.value),
                dataQuality: 'estimated',
              }])}
            />
          </div>
          <div>
            <Label>Source</Label>
            <Select
              value={water[0]?.source ?? 'municipal'}
              onValueChange={(v) => setWater([{
                ...water[0],
                source: v as any,
                annualGallons: water[0]?.annualGallons ?? 0,
                dataQuality: 'estimated',
              }])}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="municipal">Municipal Supply</SelectItem>
                <SelectItem value="groundwell">Ground Well</SelectItem>
                <SelectItem value="surface">Surface Water</SelectItem>
                <SelectItem value="recycled">Recycled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}
