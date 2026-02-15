'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import type { MethodologyRecord } from '@/domain/types/emissions'

interface Props {
  methodology: MethodologyRecord
}

export function MethodologyPanel({ methodology }: Props) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border border-border">
      <button
        className="w-full px-6 py-4 flex items-center justify-between text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-[10px]">&#x251C;</span>
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Methodology &amp; Citations
          </span>
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          {expanded ? '[-]' : '[+]'}
        </span>
      </button>

      {expanded && (
        <div className="px-6 pb-6 space-y-4 text-sm border-t border-border pt-4">
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-1">Protocol Alignment</p>
            <p>{methodology.ghgProtocolAlignment}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-1">Engine Version</p>
            <p>{methodology.engineVersion} / Factors: {methodology.factorSetVersion}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-1">Factor Sources</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {[...new Set(methodology.factorSources.map(s => s.source))].map(s => (
                <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
              ))}
            </div>
          </div>
          {methodology.assumptions.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-1">Assumptions</p>
              <ul className="list-disc list-inside text-muted-foreground">
                {methodology.assumptions.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}
          {methodology.dataGaps.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-1">Data Gaps</p>
              <ul className="list-disc list-inside text-muted-foreground">
                {methodology.dataGaps.map((g, i) => <li key={i}>{g}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
