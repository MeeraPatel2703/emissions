'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { EmissionResult } from '@/domain/types/emissions'
import type { EmissionFactorSet } from '@/domain/types/factors'
import type { FacilityProfile } from '@/domain/types/facility'
import type { Intervention, InterventionType, ScenarioResult } from '@/domain/types/scenario'
import { evaluateScenario } from '@/lib/scenarios/decarbonization'
import { ProjectionChart } from '@/components/charts/projection-chart'
import { MaccChart } from '@/components/charts/macc-chart'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'

interface Props {
  facility: FacilityProfile
  factors: EmissionFactorSet
  baselineResult: EmissionResult
}

interface InterventionConfig {
  type: InterventionType
  name: string
  description: string
  paramName: string
  paramLabel: string
  min: number
  max: number
  step: number
  defaultValue: number
  unit: string
}

const AVAILABLE_INTERVENTIONS: InterventionConfig[] = [
  {
    type: 'renewable_switch',
    name: 'Renewable Energy PPA',
    description: 'Purchase renewable electricity via power purchase agreement',
    paramName: 'renewablePct',
    paramLabel: 'Renewable %',
    min: 0,
    max: 1,
    step: 0.05,
    defaultValue: 0.5,
    unit: '%',
  },
  {
    type: 'fleet_electrification',
    name: 'Fleet Electrification',
    description: 'Replace ICE fleet vehicles with electric vehicles',
    paramName: 'electrificationPct',
    paramLabel: 'EV conversion %',
    min: 0,
    max: 1,
    step: 0.05,
    defaultValue: 0.5,
    unit: '%',
  },
  {
    type: 'hvac_upgrade',
    name: 'HVAC Efficiency Upgrade',
    description: 'Replace aging HVAC with high-efficiency heat pump system',
    paramName: 'newCOP',
    paramLabel: 'New COP',
    min: 2.5,
    max: 6,
    step: 0.5,
    defaultValue: 4.0,
    unit: '',
  },
  {
    type: 'solar_onsite',
    name: 'On-site Solar PV',
    description: 'Install rooftop or ground-mount solar panels',
    paramName: 'capacityKw',
    paramLabel: 'Capacity (kW)',
    min: 10,
    max: 500,
    step: 10,
    defaultValue: 100,
    unit: 'kW',
  },
  {
    type: 'building_envelope',
    name: 'Building Envelope',
    description: 'Improve insulation, windows, and air sealing',
    paramName: 'heatingReductionPct',
    paramLabel: 'Heating load reduction',
    min: 0,
    max: 0.5,
    step: 0.05,
    defaultValue: 0.2,
    unit: '%',
  },
  {
    type: 'waste_reduction',
    name: 'Waste Diversion',
    description: 'Divert waste from landfill to recycling/composting',
    paramName: 'landfillDiversionPct',
    paramLabel: 'Diversion %',
    min: 0,
    max: 1,
    step: 0.05,
    defaultValue: 0.5,
    unit: '%',
  },
]

export function ScenarioBuilder({ facility, factors, baselineResult }: Props) {
  const [selectedInterventions, setSelectedInterventions] = useState<
    Map<InterventionType, { config: InterventionConfig; paramValue: number }>
  >(new Map())
  const [scenarioResult, setScenarioResult] = useState<ScenarioResult | null>(null)

  function toggleIntervention(config: InterventionConfig) {
    setSelectedInterventions((prev) => {
      const next = new Map(prev)
      if (next.has(config.type)) {
        next.delete(config.type)
      } else {
        next.set(config.type, { config, paramValue: config.defaultValue })
      }
      return next
    })
    setScenarioResult(null)
  }

  function updateParam(type: InterventionType, value: number) {
    setSelectedInterventions((prev) => {
      const next = new Map(prev)
      const entry = next.get(type)
      if (entry) {
        next.set(type, { ...entry, paramValue: value })
      }
      return next
    })
    setScenarioResult(null)
  }

  function runScenario() {
    const interventions: Intervention[] = Array.from(selectedInterventions.entries()).map(
      ([type, { config, paramValue }]) => ({
        type,
        name: config.name,
        description: config.description,
        params: { [config.paramName]: paramValue },
      })
    )

    if (interventions.length === 0) return

    const result = evaluateScenario(
      'Custom Scenario',
      facility,
      factors,
      interventions,
      baselineResult
    )
    setScenarioResult(result)
  }

  const formatParamValue = (config: InterventionConfig, value: number) => {
    if (config.unit === '%') return `${(value * 100).toFixed(0)}%`
    if (config.unit === 'kW') return `${value} kW`
    return value.toFixed(1)
  }

  return (
    <div className="space-y-6">
      {/* Intervention Selector */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-muted-foreground text-[10px]">&#x251C;</span>
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Decarbonization Interventions
          </span>
        </div>

        {AVAILABLE_INTERVENTIONS.map((config) => {
          const isSelected = selectedInterventions.has(config.type)
          const entry = selectedInterventions.get(config.type)

          return (
            <div
              key={config.type}
              className={`border p-4 transition-colors ${
                isSelected ? 'border-foreground bg-muted' : 'border-border'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <button
                    onClick={() => toggleIntervention(config)}
                    className="text-left"
                  >
                    <p className="font-medium text-sm">{config.name}</p>
                    <p className="text-xs text-muted-foreground">{config.description}</p>
                  </button>
                </div>
                <Button
                  size="sm"
                  variant={isSelected ? 'default' : 'outline'}
                  onClick={() => toggleIntervention(config)}
                >
                  {isSelected ? 'Remove' : 'Add'}
                </Button>
              </div>

              <AnimatePresence>
                {isSelected && entry && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">{config.paramLabel}</span>
                        <span className="font-mono font-medium">
                          {formatParamValue(config, entry.paramValue)}
                        </span>
                      </div>
                      <Slider
                        value={[entry.paramValue]}
                        min={config.min}
                        max={config.max}
                        step={config.step}
                        onValueChange={([v]) => updateParam(config.type, v)}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}

        <Button
          className="w-full mt-4"
          disabled={selectedInterventions.size === 0}
          onClick={runScenario}
        >
          Evaluate Scenario ({selectedInterventions.size} intervention{selectedInterventions.size !== 1 ? 's' : ''})
        </Button>
      </div>

      {/* Results */}
      <AnimatePresence>
        {scenarioResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
              {[
                {
                  label: 'EMISSION REDUCTION',
                  value: `-${scenarioResult.totalReduction.toFixed(1)}`,
                  sub: `tCO2e/yr (${(scenarioResult.reductionPct * 100).toFixed(0)}%)`,
                },
                {
                  label: 'TOTAL CAPEX',
                  value: `$${(scenarioResult.totalCapex / 1000).toFixed(0)}k`,
                  sub: 'upfront investment',
                },
                {
                  label: 'SIMPLE PAYBACK',
                  value: scenarioResult.simplePaybackYears === Infinity
                    ? 'N/A'
                    : `${scenarioResult.simplePaybackYears.toFixed(1)} yr`,
                  sub: 'break-even period',
                },
                {
                  label: '10-YR CO2 AVOIDED',
                  value: `${scenarioResult.cumulativeCO2Avoided10yr.toFixed(0)}`,
                  sub: 'tCO2e cumulative',
                },
              ].map((card) => (
                <div key={card.label} className="relative border border-border p-4">
                  <span className="absolute -top-1.5 -left-1.5 text-muted-foreground text-[10px] leading-none">&#x250C;</span>
                  <span className="absolute -bottom-1.5 -right-1.5 text-muted-foreground text-[10px] leading-none">&#x2518;</span>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">{card.label}</p>
                  <p className="text-2xl font-bold">{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="border border-border px-6 py-4">
              <div className="flex justify-center gap-6 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs uppercase tracking-wider">NPV (8%): </span>
                  <span className="font-bold">
                    ${(scenarioResult.npv / 1000).toFixed(0)}k
                  </span>
                </div>
                <Separator orientation="vertical" className="h-5" />
                <div>
                  <span className="text-muted-foreground text-xs uppercase tracking-wider">IRR: </span>
                  <span className="font-bold">
                    {scenarioResult.irr !== null ? `${(scenarioResult.irr * 100).toFixed(1)}%` : 'N/A'}
                  </span>
                </div>
                <Separator orientation="vertical" className="h-5" />
                <div>
                  <span className="text-muted-foreground text-xs uppercase tracking-wider">Annual Savings: </span>
                  <span className="font-bold">
                    ${(scenarioResult.annualSavings / 1000).toFixed(1)}k/yr
                  </span>
                </div>
              </div>
            </div>

            {/* Intervention Breakdown */}
            <div className="border border-border">
              <div className="px-6 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-[10px]">&#x251C;</span>
                  <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Intervention Breakdown</span>
                </div>
              </div>
              <div className="px-6 py-4 space-y-3">
                {scenarioResult.interventions
                  .sort((a, b) => b.annualEmissionReduction - a.annualEmissionReduction)
                  .map((int) => (
                    <div key={int.type} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span>{AVAILABLE_INTERVENTIONS.find((c) => c.type === int.type)?.name ?? int.type}</span>
                        {int.annualOpexChange < 0 && (
                          <Badge variant="outline" className="text-xs">
                            saves ${Math.abs(int.annualOpexChange).toFixed(0)}/yr
                          </Badge>
                        )}
                      </div>
                      <span className="font-mono font-bold">
                        -{int.annualEmissionReduction.toFixed(1)} tCO2e
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* MACC Chart */}
            <div className="border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-muted-foreground text-[10px]">&#x251C;</span>
                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Marginal Abatement Cost Curve</span>
              </div>
              <MaccChart interventions={scenarioResult.interventions} />
              <p className="text-xs text-muted-foreground text-center mt-2">
                Dark bars = net savings | Gray = low cost | Light = high cost per tCO2e abated
              </p>
            </div>

            {/* 10-Year Projection */}
            <div className="border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-muted-foreground text-[10px]">&#x251C;</span>
                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">10-Year Emission Trajectory</span>
              </div>
              <ProjectionChart trajectory={scenarioResult.projectedTrajectory} />
              <p className="text-xs text-muted-foreground text-center mt-2">
                Baseline declines with projected grid decarbonization (EIA AEO 2025)
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
