'use client'

import { cn } from '@/lib/utils'

interface StepIndicatorProps {
  steps: string[]
  currentStep: number
  onStepClick: (step: number) => void
}

export function StepIndicator({ steps, currentStep, onStepClick }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto">
      {steps.map((label, idx) => (
        <div key={label} className="flex items-center flex-shrink-0">
          <button
            onClick={() => onStepClick(idx)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.12em] transition-colors border whitespace-nowrap',
              idx === currentStep
                ? 'border-foreground text-foreground font-bold'
                : idx < currentStep
                  ? 'border-border text-foreground cursor-pointer hover:border-foreground'
                  : 'border-border text-muted-foreground',
            )}
          >
            <span className="font-mono">
              {idx < currentStep ? '[x]' : `[${idx + 1}]`}
            </span>
            {label}
          </button>
          {idx < steps.length - 1 && (
            <div className={cn(
              'w-3 h-px flex-shrink-0',
              idx < currentStep ? 'bg-foreground' : 'bg-border',
            )} />
          )}
        </div>
      ))}
    </div>
  )
}
