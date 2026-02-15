'use client'

import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  Legend,
  CartesianGrid,
  ComposedChart,
  Line,
} from 'recharts'
import type { YearlyProjection } from '@/domain/types/scenario'

interface Props {
  trajectory: YearlyProjection[]
  uncertaintyBand?: number
}

export function ProjectionChart({ trajectory, uncertaintyBand = 0.15 }: Props) {
  const data = trajectory.map((p) => ({
    year: p.year,
    baseline: Math.round(p.baselineEmissions * 10) / 10,
    scenario: Math.round(p.scenarioEmissions * 10) / 10,
    ciUpper: Math.round(p.scenarioEmissions * (1 + uncertaintyBand) * 10) / 10,
    ciLower: Math.round(p.scenarioEmissions * (1 - uncertaintyBand) * 10) / 10,
  }))

  return (
    <ResponsiveContainer width="100%" height={350}>
      <ComposedChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
        <XAxis dataKey="year" tick={{ fontSize: 12 }} />
        <YAxis
          tick={{ fontSize: 12 }}
          label={{ value: 'tCO2e', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
        />
        <Tooltip
          formatter={(value: any, name: any) => {
            const labels: Record<string, string> = {
              baseline: 'Baseline (grid decarb)',
              scenario: 'With interventions',
              ciUpper: '95% CI upper',
              ciLower: '95% CI lower',
            }
            return [`${Number(value).toFixed(1)} tCO2e`, labels[name] ?? name]
          }}
          contentStyle={{ background: '#fff', border: '1px solid #c8e6cc', borderRadius: 0, fontSize: 12, color: '#14532d' }}
        />
        <Legend
          formatter={(value: string) => {
            const labels: Record<string, string> = {
              baseline: 'Baseline (grid decarb)',
              scenario: 'With interventions',
              ciUpper: '95% CI',
            }
            return <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{labels[value] ?? value}</span>
          }}
        />

        {/* CI shading */}
        <Area
          dataKey="ciUpper"
          stroke="none"
          fill="#a7f0b5"
          fillOpacity={0.08}
          legendType="none"
        />
        <Area
          dataKey="ciLower"
          stroke="none"
          fill="#ffffff"
          fillOpacity={1}
          legendType="none"
        />

        <Line
          type="monotone"
          dataKey="baseline"
          stroke="#22863a"
          strokeWidth={2}
          strokeDasharray="6 3"
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="scenario"
          stroke="#56d364"
          strokeWidth={2.5}
          dot={{ fill: '#56d364', r: 3 }}
        />
        <Line
          type="monotone"
          dataKey="ciUpper"
          stroke="#a7f0b5"
          strokeWidth={1}
          strokeDasharray="3 3"
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="ciLower"
          stroke="#a7f0b5"
          strokeWidth={1}
          strokeDasharray="3 3"
          dot={false}
          legendType="none"
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
