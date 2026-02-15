'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { EmissionResult } from '@/domain/types/emissions'

const CATEGORY_LABELS: Record<string, string> = {
  stationary_combustion: 'Stationary Fuel',
  mobile_combustion: 'Fleet',
  fugitive_emissions: 'Refrigerants',
  grid_electricity_location: 'Grid Electricity',
  scope3_cat1: 'Purchased Goods',
  scope3_cat3: 'Fuel & Energy (WTT)',
  scope3_cat5: 'Waste',
  scope3_cat6: 'Business Travel',
  scope3_cat7: 'Commuting',
}

const SCOPE_COLORS: Record<number, string> = {
  1: '#22863a',
  2: '#56d364',
  3: '#a7f0b5',
}

interface Props {
  result: EmissionResult
}

export function WaterfallChart({ result }: Props) {
  const categoryTotals: Record<string, { value: number; scope: number }> = {}

  for (const cat of result.breakdown) {
    if (cat.category === 'grid_electricity_market') continue
    const key = cat.category
    if (!categoryTotals[key]) {
      categoryTotals[key] = { value: 0, scope: cat.scope }
    }
    categoryTotals[key].value += cat.value
  }

  const data = Object.entries(categoryTotals)
    .filter(([, v]) => v.value > 0.01)
    .sort((a, b) => b[1].value - a[1].value)
    .map(([key, val]) => ({
      name: CATEGORY_LABELS[key] ?? key,
      value: Math.round(val.value * 10) / 10,
      scope: val.scope,
    }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
        <XAxis type="number" tickFormatter={(v) => `${v}`} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
        <Tooltip
          formatter={(value: any) => [`${Number(value).toFixed(1)} tCO2e`, '']}
          contentStyle={{ background: '#fff', border: '1px solid #c8e6cc', borderRadius: 0, fontSize: 12, color: '#14532d' }}
        />
        <Bar dataKey="value" radius={[0, 0, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={index} fill={SCOPE_COLORS[entry.scope] ?? '#22c55e'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
