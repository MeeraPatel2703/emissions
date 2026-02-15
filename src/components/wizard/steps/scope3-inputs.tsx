'use client'

import { useWizardStore } from '@/stores/wizard-store'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

const TRAVEL_MODES = [
  { value: 'air_short', label: 'Air (Short-haul < 300mi)' },
  { value: 'air_medium', label: 'Air (Medium-haul 300-2300mi)' },
  { value: 'air_long', label: 'Air (Long-haul > 2300mi)' },
  { value: 'rail', label: 'Rail' },
  { value: 'bus', label: 'Bus' },
  { value: 'car', label: 'Car Rental' },
]

const SPEND_SECTORS = [
  { value: 'professional_services', label: 'Professional Services' },
  { value: 'information_technology', label: 'IT / Software' },
  { value: 'office_supplies', label: 'Office Supplies' },
  { value: 'food_and_beverage', label: 'Food & Beverage' },
  { value: 'construction', label: 'Construction' },
  { value: 'chemicals', label: 'Chemicals' },
  { value: 'machinery', label: 'Machinery' },
  { value: 'furniture', label: 'Furniture' },
]

export function Scope3InputsStep() {
  const { scope3, setScope3, occupancy } = useWizardStore()

  // Business Travel
  const travel = scope3.cat6BusinessTravel ?? []
  const addTravel = () => {
    setScope3({
      cat6BusinessTravel: [...travel, { mode: 'air_medium' as any, passengerMiles: 0, dataQuality: 'estimated' as any }],
    })
  }
  const updateTravel = (idx: number, updates: any) => {
    const updated = [...travel]
    updated[idx] = { ...updated[idx], ...updates }
    setScope3({ cat6BusinessTravel: updated })
  }
  const removeTravel = (idx: number) => {
    setScope3({ cat6BusinessTravel: travel.filter((_, i) => i !== idx) })
  }

  // Purchased Goods
  const purchases = scope3.cat1PurchasedGoods ?? []
  const addPurchase = () => {
    setScope3({
      cat1PurchasedGoods: [...purchases, { sector: 'professional_services', annualSpendUSD: 0, dataQuality: 'estimated' as any }],
    })
  }
  const updatePurchase = (idx: number, updates: any) => {
    const updated = [...purchases]
    updated[idx] = { ...updated[idx], ...updates }
    setScope3({ cat1PurchasedGoods: updated })
  }
  const removePurchase = (idx: number) => {
    setScope3({ cat1PurchasedGoods: purchases.filter((_, i) => i !== idx) })
  }

  // Employee Commuting
  const commute = scope3.cat7EmployeeCommuting

  return (
    <div className="space-y-8">
      {/* Cat 6: Business Travel */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">Business Travel</h3>
          <Badge>Cat 6</Badge>
        </div>
        {travel.map((t, idx) => (
          <div key={idx} className="p-3 border rounded-lg grid grid-cols-3 gap-3 items-end">
            <div>
              <Label>Mode</Label>
              <Select value={t.mode} onValueChange={(v) => updateTravel(idx, { mode: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRAVEL_MODES.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Total Passenger-Miles (annual)</Label>
              <Input
                type="number"
                placeholder="500000"
                value={t.passengerMiles || ''}
                onChange={(e) => updateTravel(idx, { passengerMiles: Number(e.target.value) })}
              />
            </div>
            <Button variant="ghost" size="sm" onClick={() => removeTravel(idx)}>Remove</Button>
          </div>
        ))}
        <Button variant="outline" onClick={addTravel}>+ Add Travel Category</Button>
      </div>

      {/* Cat 7: Employee Commuting */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">Employee Commuting</h3>
          <Badge>Cat 7</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Configure commute patterns. Uses {occupancy?.employees ?? 'N/A'} employees from facility info.
        </p>
        <div className="p-4 border rounded-lg grid grid-cols-2 gap-4">
          <div>
            <Label>Working Days/Year</Label>
            <Input
              type="number"
              value={commute?.workingDaysPerYear ?? 250}
              onChange={(e) => setScope3({
                cat7EmployeeCommuting: {
                  employees: occupancy?.employees ?? 0,
                  workingDaysPerYear: Number(e.target.value),
                  modes: commute?.modes ?? [{ mode: 'car', percentOfEmployees: 0.7, oneWayDistanceMiles: 15 }],
                  dataQuality: 'estimated',
                },
              })}
            />
          </div>
          <div>
            <Label>Avg. One-Way Distance (miles)</Label>
            <Input
              type="number"
              placeholder="15"
              value={commute?.modes?.[0]?.oneWayDistanceMiles ?? ''}
              onChange={(e) => setScope3({
                cat7EmployeeCommuting: {
                  employees: occupancy?.employees ?? 0,
                  workingDaysPerYear: commute?.workingDaysPerYear ?? 250,
                  modes: [{ mode: 'car', percentOfEmployees: 0.7, oneWayDistanceMiles: Number(e.target.value) }],
                  dataQuality: 'estimated',
                },
              })}
            />
          </div>
        </div>
      </div>

      {/* Cat 1: Purchased Goods */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">Purchased Goods & Services</h3>
          <Badge>Cat 1</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Spend-based method: enter annual spend by sector. Uses EPA USEEIO factors.
        </p>
        {purchases.map((p, idx) => (
          <div key={idx} className="p-3 border rounded-lg grid grid-cols-3 gap-3 items-end">
            <div>
              <Label>Sector</Label>
              <Select value={p.sector} onValueChange={(v) => updatePurchase(idx, { sector: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SPEND_SECTORS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Annual Spend (USD)</Label>
              <Input
                type="number"
                placeholder="100000"
                value={p.annualSpendUSD || ''}
                onChange={(e) => updatePurchase(idx, { annualSpendUSD: Number(e.target.value) })}
              />
            </div>
            <Button variant="ghost" size="sm" onClick={() => removePurchase(idx)}>Remove</Button>
          </div>
        ))}
        <Button variant="outline" onClick={addPurchase}>+ Add Spend Category</Button>
      </div>
    </div>
  )
}
