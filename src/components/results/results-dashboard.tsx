'use client'

import { motion } from 'framer-motion'
import type { EmissionResult } from '@/domain/types/emissions'
import type { EmissionFactorSet } from '@/domain/types/factors'
import type { FacilityProfile } from '@/domain/types/facility'
import type { SimulationResult } from '@/domain/types/simulation'
import { ScopeCard } from './scope-card'
import { MiniSparkline } from './mini-sparkline'
import { ExportToolbar } from './export-toolbar'
import { ScopeDonut } from '@/components/charts/scope-donut'
import { WaterfallChart } from '@/components/charts/waterfall-chart'
import { BenchmarkGauge } from '@/components/charts/benchmark-gauge'
import { McHistogram } from '@/components/charts/mc-histogram'
import { ScenarioBuilder } from '@/components/scenarios/scenario-builder'
import { MethodologyPanel } from './methodology-panel'
import { Separator } from '@/components/ui/separator'

interface Props {
  result: EmissionResult
  facilityName: string
  facility?: FacilityProfile
  factors?: EmissionFactorSet
  mcResult?: SimulationResult | null
  runningMC?: boolean
}

const CATEGORY_LABELS: Record<string, string> = {
  stationary_combustion: 'Natural Gas',
  mobile_combustion: 'Fleet Diesel',
  fugitive_emissions: 'Refrigerants',
  grid_electricity_location: 'Electricity',
  scope3_cat1: 'Purchased Goods',
  scope3_cat3: 'Fuel & Energy (WTT)',
  scope3_cat5: 'Waste',
  scope3_cat6: 'Business Travel',
  scope3_cat7: 'Commuting',
}

const SCOPE_LABELS: Record<number, string> = { 1: 'Scope 1', 2: 'Scope 2', 3: 'Scope 3' }

function fakeSparkline(base: number): number[] {
  return Array.from({ length: 8 }, (_, i) => base * (0.7 + Math.sin(i * 0.8) * 0.3 + i * 0.04))
}

function formatNumber(n: number): string {
  if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 0 })
  if (n >= 10) return n.toFixed(1)
  return n.toFixed(2)
}

const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const item = {
  hidden: { opacity: 0 },
  show: { opacity: 1 },
}

export function ResultsDashboard({ result, facilityName, facility, factors, mcResult, runningMC }: Props) {
  const sqft = facility?.dimensions.squareFeet ?? 1
  const scope3CatCount = result.scope3.categories.filter(c => c.value > 0.01).length

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="show" className="space-y-6">

      {/* ===== TOP INFO BAR ===== */}
      <motion.div variants={item} className="border border-border bg-foreground text-background px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="text-xs uppercase tracking-[0.2em] font-bold">
            Facility Carbon Intelligence System
          </span>
          <span className="text-xs opacity-60">
            Region: {facility?.location.state ?? facility?.location.country ?? 'US'}
          </span>
          <span className="text-xs opacity-60">
            Type: {facility?.buildingType ?? 'office'}
          </span>
          <span className="text-xs opacity-60">
            Period: FY{new Date().getFullYear()}
          </span>
        </div>
        <ExportToolbar result={result} facilityName={facilityName} simulation={mcResult} />
      </motion.div>

      {/* ===== 4 METRIC CARDS ===== */}
      <motion.div variants={item} className="grid grid-cols-4 gap-4">
        {[
          {
            label: 'TOTAL CO\u2082E',
            value: formatNumber(result.total),
            unit: 't',
            sub: `\u2193 ${((result.uncertainty.totalUpperBound - result.total) / result.total * 100).toFixed(1)}% uncertainty`,
          },
          {
            label: 'CARBON INTENSITY',
            value: ((result.total * 1000) / sqft).toFixed(2),
            unit: 'kg / sq ft',
            sub: `${result.benchmarkComparison.classification} vs benchmark`,
          },
          {
            label: 'BENCHMARK',
            value: `${result.benchmarkComparison.percentile.toFixed(0)}%`,
            unit: 'ile',
            sub: `${result.benchmarkComparison.buildingType} median: ${result.benchmarkComparison.industryMedian.toFixed(1)}`,
          },
          {
            label: 'DATA QUALITY',
            value: `${result.dataQualityScore}`,
            unit: '/ 100',
            sub: `Overall: ${result.uncertainty.overallDataQuality}`,
          },
        ].map((card) => (
          <div key={card.label} className="relative border border-border p-5">
            <span className="absolute -top-1.5 -left-1.5 text-muted-foreground text-[10px] leading-none">&#x250C;</span>
            <span className="absolute -bottom-1.5 -right-1.5 text-muted-foreground text-[10px] leading-none">&#x2518;</span>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">{card.label}</p>
            <p className="text-3xl font-bold tracking-tight">
              {card.value}
              <span className="text-xs font-normal text-muted-foreground ml-1">{card.unit}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
            <div className="mt-3">
              <MiniSparkline values={fakeSparkline(parseFloat(card.value.replace(/,/g, '')) || 10)} />
            </div>
          </div>
        ))}
      </motion.div>

      {/* ===== 3 SCOPE CARDS ===== */}
      <motion.div variants={item} className="grid grid-cols-3 gap-4">
        <ScopeCard
          title="Scope 1"
          subtitle="Direct"
          value={result.scope1.total}
          total={result.total}
          detail={`Intensity: ${((result.scope1.total * 1000) / sqft).toFixed(1)} kg/sqft`}
        />
        <ScopeCard
          title="Scope 2"
          subtitle="Indirect"
          value={result.scope2Location.total}
          total={result.total}
          detail={`Grid factor: ${result.methodology.factorSources.find(s => s.category.includes('grid'))?.version ?? 'eGRID 2023'}`}
        />
        <ScopeCard
          title="Scope 3"
          subtitle="Value Chain"
          value={result.scope3.total}
          total={result.total}
          detail={`Categories: ${scope3CatCount} of 15 reported`}
        />
      </motion.div>

      {/* ===== EMISSIONS BY SOURCE TABLE ===== */}
      <motion.div variants={item} className="border border-border">
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-[10px]">&#x2502;</span>
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Emissions by Source</span>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-6 py-3 text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium">Source</th>
              <th className="text-left px-4 py-3 text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium">Scope</th>
              <th className="text-right px-4 py-3 text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium">Emissions</th>
              <th className="text-right px-4 py-3 text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium">Intensity</th>
              <th className="text-right px-6 py-3 text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium">Trend</th>
            </tr>
          </thead>
          <tbody>
            {result.breakdown
              .filter(cat => cat.value > 0.01 && cat.category !== 'grid_electricity_market')
              .sort((a, b) => b.value - a.value)
              .slice(0, 10)
              .map((cat, i) => (
                <tr key={`${cat.category}-${cat.subcategory}-${i}`} className="border-b border-border last:border-b-0">
                  <td className="px-6 py-3 font-medium">{CATEGORY_LABELS[cat.category] ?? cat.subcategory ?? cat.category.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-muted-foreground">{SCOPE_LABELS[cat.scope]}</td>
                  <td className="px-4 py-3 text-right font-bold">{formatNumber(cat.value)} t</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{((cat.value * 1000) / sqft).toFixed(1)} kg/sqft</td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex justify-end">
                      <MiniSparkline values={fakeSparkline(cat.value)} height={16} />
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </motion.div>

      {/* ===== CHARTS ===== */}
      <motion.div variants={item} className="grid grid-cols-2 gap-4">
        <div className="border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-muted-foreground text-[10px]">&#x251C;</span>
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Emissions by Scope</span>
          </div>
          <ScopeDonut result={result} />
        </div>
        <div className="border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-muted-foreground text-[10px]">&#x251C;</span>
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Emissions by Source</span>
          </div>
          <WaterfallChart result={result} />
        </div>
      </motion.div>

      {/* ===== BENCHMARK ===== */}
      <motion.div variants={item} className="border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-muted-foreground text-[10px]">&#x251C;</span>
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Industry Benchmark</span>
        </div>
        <BenchmarkGauge benchmark={result.benchmarkComparison} />
      </motion.div>

      {/* ===== UNCERTAINTY & MC ===== */}
      <motion.div variants={item} className="border border-border p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-muted-foreground text-[10px]">&#x251C;</span>
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Uncertainty Analysis</span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">95% Confidence Interval</p>
            <p className="text-lg font-bold mt-1">
              {result.uncertainty.totalLowerBound.toFixed(1)} to {result.uncertainty.totalUpperBound.toFixed(1)} tCO2e
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Overall Data Quality</p>
            <p className="text-lg font-bold mt-1 capitalize">{result.uncertainty.overallDataQuality}</p>
          </div>
        </div>

        {runningMC && (
          <div className="text-xs text-muted-foreground animate-pulse">
            Running Monte Carlo simulation (500 iterations)...
          </div>
        )}

        {mcResult && (
          <>
            <Separator />
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3">
                Monte Carlo Distribution ({mcResult.runs} runs, seed={mcResult.seed})
              </p>
              <McHistogram distribution={mcResult.totalEmissions} />
              <div className="grid grid-cols-3 gap-4 mt-4 text-xs">
                <div>
                  <p className="text-muted-foreground uppercase tracking-wider">Scope 1 (95% CI)</p>
                  <p className="font-bold">{mcResult.scope1.ci95Lower.toFixed(1)} &ndash; {mcResult.scope1.ci95Upper.toFixed(1)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground uppercase tracking-wider">Scope 2 (95% CI)</p>
                  <p className="font-bold">{mcResult.scope2Location.ci95Lower.toFixed(1)} &ndash; {mcResult.scope2Location.ci95Upper.toFixed(1)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground uppercase tracking-wider">Scope 3 (95% CI)</p>
                  <p className="font-bold">{mcResult.scope3.ci95Lower.toFixed(1)} &ndash; {mcResult.scope3.ci95Upper.toFixed(1)}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </motion.div>

      {/* ===== SCENARIO BUILDER ===== */}
      {facility && factors && (
        <motion.div variants={item} className="border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-muted-foreground text-[10px]">&#x251C;</span>
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Decarbonization Scenarios</span>
          </div>
          <ScenarioBuilder facility={facility} factors={factors} baselineResult={result} />
        </motion.div>
      )}

      {/* ===== METHODOLOGY ===== */}
      <motion.div variants={item}>
        <MethodologyPanel methodology={result.methodology} />
      </motion.div>
    </motion.div>
  )
}
