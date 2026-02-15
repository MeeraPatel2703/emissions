'use client'

import { useWizardStore } from '@/stores/wizard-store'
import { cn } from '@/lib/utils'
import type { InputMode } from '@/domain/types/facility'

const MODES: { value: InputMode; label: string; tag?: string; description: string }[] = [
  { value: 'basic', label: 'Basic', tag: 'FAST', description: 'Quick estimate from building type + size + location' },
  { value: 'advanced', label: 'Advanced', description: 'Actual utility data, fleet, waste, Scope 3' },
  { value: 'expert', label: 'Expert', tag: 'THESIS', description: 'Full control: building physics, custom factors' },
]

export function ModeSelector() {
  const { inputMode, setInputMode, setStep } = useWizardStore()

  return (
    <div className="flex gap-0 border border-border">
      {MODES.map((mode, i) => (
        <button
          key={mode.value}
          onClick={() => {
            setInputMode(mode.value)
            setStep(0)
          }}
          className={cn(
            'flex-1 p-4 text-left transition-all',
            i < MODES.length - 1 && 'border-r border-border',
            inputMode === mode.value
              ? 'bg-foreground text-background'
              : 'bg-background text-foreground hover:bg-muted',
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-xs uppercase tracking-[0.15em]">{mode.label}</span>
            {mode.tag && (
              <span className="text-[10px] uppercase tracking-wider opacity-60">[{mode.tag}]</span>
            )}
          </div>
          <p className="text-xs opacity-60">{mode.description}</p>
        </button>
      ))}
    </div>
  )
}
