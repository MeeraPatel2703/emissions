'use client'

import { useState, useMemo } from 'react'
import { useWizardStore } from '@/stores/wizard-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { computeAllEmissions } from '@/lib/emissions/engine'
import { buildFactorSet } from '@/lib/factors/registry'
import { runMonteCarloSimulation } from '@/lib/simulation/monte-carlo'
import type { FacilityProfile } from '@/domain/types/facility'
import type { EmissionResult } from '@/domain/types/emissions'
import type { EmissionFactorSet } from '@/domain/types/factors'
import type { SimulationResult } from '@/domain/types/simulation'
import { ResultsDashboard } from '@/components/results/results-dashboard'

export function ReviewStep() {
  const store = useWizardStore()
  const [result, setResult] = useState<EmissionResult | null>(null)
  const [mcResult, setMcResult] = useState<SimulationResult | null>(null)
  const [factors, setFactors] = useState<EmissionFactorSet | null>(null)
  const [calculating, setCalculating] = useState(false)
  const [runningMC, setRunningMC] = useState(false)

  const profile = useMemo((): FacilityProfile => ({
    name: store.name,
    buildingType: store.buildingType,
    location: store.location,
    dimensions: { squareFeet: store.squareFeet, yearBuilt: store.yearBuilt },
    inputMode: store.inputMode,
    energy: store.energy,
    refrigerants: store.refrigerants,
    fleet: store.fleet,
    waste: store.waste,
    water: store.water,
    scope3: store.scope3,
    occupancy: store.occupancy,
  }), [store])

  const calculate = () => {
    setCalculating(true)
    try {
      const f = buildFactorSet()
      setFactors(f)
      const res = computeAllEmissions(profile, f)
      setResult(res)

      // Run MC simulation in background after main result
      setRunningMC(true)
      setTimeout(() => {
        try {
          const mc = runMonteCarloSimulation(profile, f, { runs: 500, seed: 42 })
          setMcResult(mc)
        } catch (err) {
          console.error('Monte Carlo simulation failed:', err)
        }
        setRunningMC(false)
      }, 0)
    } catch (err) {
      console.error('Calculation failed:', err)
    }
    setCalculating(false)
  }

  return (
    <div className="space-y-6">
      {/* Input Summary */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="p-3 bg-muted rounded-lg">
          <div className="font-medium">Facility</div>
          <div>{store.name || 'Unnamed'} / {store.buildingType}</div>
          <div>{store.squareFeet.toLocaleString()} sqft</div>
          <div>{store.location.state ?? store.location.country}</div>
        </div>
        <div className="p-3 bg-muted rounded-lg">
          <div className="font-medium">Energy Data</div>
          {store.energy.electricity?.quantity ? (
            <div>Electricity: {store.energy.electricity.quantity.toLocaleString()} kWh</div>
          ) : (
            <div className="text-muted-foreground">Electricity: Estimated from benchmarks</div>
          )}
          {store.energy.naturalGas?.quantity ? (
            <div>Natural Gas: {store.energy.naturalGas.quantity.toLocaleString()} therms</div>
          ) : (
            <div className="text-muted-foreground">Natural Gas: Estimated from benchmarks</div>
          )}
        </div>
        <div className="p-3 bg-muted rounded-lg">
          <div className="font-medium">Other Sources</div>
          <div>Refrigerant systems: {store.refrigerants.length}</div>
          <div>Fleet vehicle groups: {store.fleet.length}</div>
          <div>Waste streams: {store.waste.length}</div>
        </div>
        <div className="p-3 bg-muted rounded-lg">
          <div className="font-medium">Mode</div>
          <Badge>{store.inputMode}</Badge>
          {store.inputMode === 'basic' && (
            <p className="text-muted-foreground mt-1">Missing data will be estimated. Uncertainty: ±15%</p>
          )}
        </div>
      </div>

      {/* Calculate Button */}
      {!result && (
        <Button
          size="lg"
          className="w-full"
          onClick={calculate}
          disabled={calculating || store.squareFeet <= 0}
        >
          {calculating ? 'Calculating...' : 'Calculate Emissions'}
        </Button>
      )}

      {/* Results */}
      {result && factors && (
        <ResultsDashboard
          result={result}
          facilityName={store.name}
          facility={profile}
          factors={factors}
          mcResult={mcResult}
          runningMC={runningMC}
        />
      )}
    </div>
  )
}
