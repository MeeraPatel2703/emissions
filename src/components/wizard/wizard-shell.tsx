'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useWizardStore } from '@/stores/wizard-store'
import { StepIndicator } from './step-indicator'
import { ModeSelector } from './mode-selector'
import { FacilityInfoStep } from './steps/facility-info'
import { EnergyInputsStep } from './steps/energy-inputs'
import { RefrigerantsStep } from './steps/refrigerants-step'
import { FleetStep } from './steps/fleet-step'
import { WasteWaterStep } from './steps/waste-water-step'
import { Scope3InputsStep } from './steps/scope3-inputs'
import { ReviewStep } from './steps/review-step'
import { Button } from '@/components/ui/button'

const BASIC_STEPS = [
  { id: 'facility', label: 'Facility Info', component: FacilityInfoStep },
  { id: 'energy', label: 'Energy', component: EnergyInputsStep },
  { id: 'review', label: 'Review', component: ReviewStep },
]

const ADVANCED_STEPS = [
  { id: 'facility', label: 'Facility Info', component: FacilityInfoStep },
  { id: 'energy', label: 'Energy', component: EnergyInputsStep },
  { id: 'refrigerants', label: 'Refrigerants', component: RefrigerantsStep },
  { id: 'fleet', label: 'Fleet', component: FleetStep },
  { id: 'waste', label: 'Waste & Water', component: WasteWaterStep },
  { id: 'scope3', label: 'Scope 3', component: Scope3InputsStep },
  { id: 'review', label: 'Review', component: ReviewStep },
]

export function WizardShell() {
  const { currentStep, inputMode, nextStep, prevStep, setStep } = useWizardStore()

  const steps = inputMode === 'basic' ? BASIC_STEPS : ADVANCED_STEPS
  const safeStep = Math.min(currentStep, steps.length - 1)
  const CurrentComponent = steps[safeStep].component

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <ModeSelector />
      <StepIndicator steps={steps.map(s => s.label)} currentStep={safeStep} onStepClick={setStep} />

      <div className="border border-border">
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">&#x251C;</span>
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {steps[safeStep].label}
            </span>
          </div>
        </div>
        <div className="px-6 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={safeStep}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <CurrentComponent />
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between mt-8 pt-6 border-t border-border">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={safeStep === 0}
            >
              &larr; Previous
            </Button>
            {safeStep < steps.length - 1 ? (
              <Button onClick={nextStep}>
                Next &rarr;
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
