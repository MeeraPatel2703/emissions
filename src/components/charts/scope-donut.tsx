'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import type { EmissionResult } from '@/domain/types/emissions'

const COLORS = ['#22863a', '#56d364', '#a7f0b5']

interface Props {
  result: EmissionResult
}

export function ScopeDonut({ result }: Props) {
  const data = [
    { name: 'Scope 1', value: Math.round(result.scope1.total * 10) / 10 },
    { name: 'Scope 2', value: Math.round(result.scope2Location.total * 10) / 10 },
    { name: 'Scope 3', value: Math.round(result.scope3.total * 10) / 10 },
  ].filter(d => d.value > 0)

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={110}
          paddingAngle={2}
          dataKey="value"
          label={({ name, percent }: any) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
          stroke="none"
        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: any) => [`${Number(value).toFixed(1)} tCO2e`, '']}
          contentStyle={{ background: '#fff', border: '1px solid #c8e6cc', borderRadius: 0, fontSize: 12, color: '#14532d' }}
        />
        <Legend
          formatter={(value: string) => <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
