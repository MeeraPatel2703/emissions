'use client'

import { MiniSparkline } from './mini-sparkline'

interface Props {
  title: string
  subtitle: string
  value: number
  total: number
  color?: string
  detail?: string
}

function fakeSparkline(base: number): number[] {
  return Array.from({ length: 8 }, (_, i) => base * (0.7 + Math.sin(i * 0.8) * 0.3 + i * 0.04))
}

function formatNumber(n: number): string {
  if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 0 })
  if (n >= 10) return n.toFixed(1)
  return n.toFixed(2)
}

export function ScopeCard({ title, subtitle, value, total, detail }: Props) {
  const pct = total > 0 ? (value / total) * 100 : 0

  return (
    <div className="relative border border-border p-5">
      <span className="absolute -top-1.5 -left-1.5 text-muted-foreground text-[10px] leading-none">&#x250C;</span>
      <span className="absolute -bottom-1.5 -right-1.5 text-muted-foreground text-[10px] leading-none">&#x2518;</span>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{title}</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground opacity-60">{subtitle}</span>
      </div>

      <p className="text-3xl font-bold tracking-tight">
        {formatNumber(value)}
        <span className="text-xs font-normal text-muted-foreground ml-1">t</span>
      </p>

      <div className="mt-2 flex items-center gap-3">
        <div className="flex-1 h-px bg-border relative">
          <div className="absolute top-0 left-0 h-px bg-foreground" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs text-muted-foreground">{pct.toFixed(1)}%</span>
      </div>

      {detail && (
        <p className="text-xs text-muted-foreground mt-2">{detail}</p>
      )}

      <div className="mt-3">
        <MiniSparkline values={fakeSparkline(value)} />
      </div>
    </div>
  )
}
