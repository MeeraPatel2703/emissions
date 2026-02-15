'use client'

import type { BenchmarkComparison } from '@/domain/types/emissions'

interface Props {
  benchmark: BenchmarkComparison
}

export function BenchmarkGauge({ benchmark }: Props) {
  const pct = Math.min(100, Math.max(0, benchmark.percentile))

  return (
    <div className="space-y-4">
      <div className="flex justify-between text-xs uppercase tracking-[0.15em] text-muted-foreground">
        <span>Lower than industry</span>
        <span>Higher than industry</span>
      </div>

      {/* Gauge bar — monochrome gradient */}
      <div className="relative h-3 bg-gradient-to-r from-[#dafbe1] via-[#56d364] to-[#22863a]">
        {/* Marker for facility position */}
        <div
          className="absolute top-1/2 w-3 h-5 bg-foreground border border-background"
          style={{ left: `${pct}%`, transform: 'translate(-50%, -50%)' }}
        />
        {/* Percentile markers */}
        <div className="absolute top-full mt-2 text-[10px] text-muted-foreground" style={{ left: '25%', transform: 'translateX(-50%)' }}>
          P25: {benchmark.industryP25.toFixed(1)}
        </div>
        <div className="absolute top-full mt-2 text-[10px] text-muted-foreground" style={{ left: '50%', transform: 'translateX(-50%)' }}>
          Median: {benchmark.industryMedian.toFixed(1)}
        </div>
        <div className="absolute top-full mt-2 text-[10px] text-muted-foreground" style={{ left: '75%', transform: 'translateX(-50%)' }}>
          P75: {benchmark.industryP75.toFixed(1)}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-8 pt-2">
        <span className="text-xs uppercase tracking-wider font-bold border border-foreground px-2 py-1">
          {pct.toFixed(0)}th percentile
        </span>
        <span className="text-xs text-muted-foreground">
          Your facility: {benchmark.facilityIntensity.toFixed(1)} kg CO2e/sqft vs. industry median {benchmark.industryMedian.toFixed(1)} kg CO2e/sqft
          ({benchmark.buildingType})
        </span>
      </div>
    </div>
  )
}
