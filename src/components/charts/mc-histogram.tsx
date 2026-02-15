'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
  Cell,
} from 'recharts'
import type { DistributionSummary } from '@/domain/types/simulation'

interface Props {
  distribution: DistributionSummary
  label?: string
}

export function McHistogram({ distribution, label = 'Total Emissions' }: Props) {
  const { histogram, mean, median, ci95Lower, ci95Upper } = distribution

  const data = histogram.counts.map((count, i) => {
    const binStart = histogram.binEdges[i]
    const binEnd = histogram.binEdges[i + 1] ?? binStart
    const binMid = (binStart + binEnd) / 2
    return {
      bin: Math.round(binMid * 10) / 10,
      count,
      binStart,
      binEnd,
    }
  })

  const isInCI = (binStart: number, binEnd: number) =>
    binEnd >= ci95Lower && binStart <= ci95Upper

  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 10, right: 20, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
          <XAxis
            dataKey="bin"
            tick={{ fontSize: 11 }}
            label={{ value: `${label} (tCO2e)`, position: 'insideBottom', offset: -2, style: { fontSize: 11 } }}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            label={{ value: 'Frequency', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
          />
          <Tooltip
            formatter={(value: any) => [`${Number(value)} runs`, 'Count']}
            labelFormatter={(label: any) => `${Number(label).toFixed(1)} tCO2e`}
            contentStyle={{ background: '#fff', border: '1px solid #c8e6cc', borderRadius: 0, fontSize: 12, color: '#14532d' }}
          />

          {/* CI boundary lines */}
          <ReferenceLine
            x={Math.round(ci95Lower * 10) / 10}
            stroke="#22863a"
            strokeWidth={2}
            strokeDasharray="6 3"
            label={{ value: 'P2.5', position: 'top', fill: '#22863a', fontSize: 10 }}
          />
          <ReferenceLine
            x={Math.round(ci95Upper * 10) / 10}
            stroke="#22863a"
            strokeWidth={2}
            strokeDasharray="6 3"
            label={{ value: 'P97.5', position: 'top', fill: '#22863a', fontSize: 10 }}
          />

          {/* Mean line */}
          <ReferenceLine
            x={Math.round(mean * 10) / 10}
            stroke="#22863a"
            strokeWidth={2}
            label={{ value: 'Mean', position: 'top', fill: '#22863a', fontSize: 10 }}
          />

          <Bar dataKey="count" radius={[0, 0, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={isInCI(entry.binStart, entry.binEnd) ? '#56d364' : '#a7f0b5'}
                fillOpacity={isInCI(entry.binStart, entry.binEnd) ? 0.7 : 0.4}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex justify-center gap-6 mt-2 text-xs text-muted-foreground">
        <span>Mean: <strong>{mean.toFixed(1)}</strong></span>
        <span>Median: <strong>{median.toFixed(1)}</strong></span>
        <span>95% CI: <strong>{ci95Lower.toFixed(1)} &ndash; {ci95Upper.toFixed(1)}</strong></span>
        <span>Std Dev: <strong>{distribution.stdDev.toFixed(1)}</strong></span>
      </div>
    </div>
  )
}
