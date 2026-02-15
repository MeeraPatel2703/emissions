'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'
import type { InterventionResult } from '@/domain/types/scenario'

const INTERVENTION_LABELS: Record<string, string> = {
  renewable_switch: 'Renewable PPA',
  fleet_electrification: 'Fleet EV',
  hvac_upgrade: 'HVAC Upgrade',
  solar_onsite: 'On-site Solar',
  building_envelope: 'Envelope',
  waste_reduction: 'Waste Diversion',
}

interface Props {
  interventions: InterventionResult[]
}

export function MaccChart({ interventions }: Props) {
  const valid = interventions.filter((i) => i.annualEmissionReduction > 0.01)

  const withCost = valid.map((i) => {
    const annualizedCapex = i.capex / Math.max(i.implementationYears || 10, 1) / 10
    const netAnnualCost = annualizedCapex + i.annualOpexChange
    const costPerTonne = i.annualEmissionReduction > 0
      ? netAnnualCost / i.annualEmissionReduction
      : 0

    return {
      ...i,
      costPerTonne: Math.round(costPerTonne),
      label: INTERVENTION_LABELS[i.type] ?? i.type,
    }
  })

  withCost.sort((a, b) => a.costPerTonne - b.costPerTonne)

  let cumulative = 0
  const data = withCost.map((item) => {
    const start = cumulative
    cumulative += item.annualEmissionReduction
    return {
      name: item.label,
      reduction: Math.round(item.annualEmissionReduction * 10) / 10,
      costPerTonne: item.costPerTonne,
      start,
      width: item.annualEmissionReduction,
    }
  })

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} margin={{ top: 10, right: 20, bottom: 5, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11 }}
          interval={0}
          angle={-20}
          textAnchor="end"
          height={60}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          label={{ value: '$/tCO2e', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
        />
        <Tooltip
          formatter={(value: any, name: any) => {
            if (name === 'costPerTonne') return [`$${Number(value).toFixed(0)}/tCO2e`, 'Abatement cost']
            if (name === 'reduction') return [`${Number(value).toFixed(1)} tCO2e/yr`, 'Reduction']
            return [value, name]
          }}
          contentStyle={{ background: '#fff', border: '1px solid #c8e6cc', borderRadius: 0, fontSize: 12, color: '#14532d' }}
        />
        <ReferenceLine y={0} stroke="#22c55e" strokeWidth={1.5} />
        <Bar dataKey="costPerTonne" name="costPerTonne" radius={[0, 0, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={index}
              fill={entry.costPerTonne < 0 ? '#22863a' : entry.costPerTonne < 50 ? '#56d364' : entry.costPerTonne < 100 ? '#a7f0b5' : '#dafbe1'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
