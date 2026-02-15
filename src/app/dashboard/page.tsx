'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { WizardShell } from '@/components/wizard/wizard-shell'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { ErrorBoundary } from '@/components/ui/error-boundary'

export default function DashboardPage() {
  useEffect(() => {
    fetch('/api/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: '/dashboard' }),
    }).catch(() => {})
  }, [])

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-1.5 hover:opacity-70 transition-opacity">
              <span className="text-muted-foreground text-sm">&#x250C;</span>
              <span className="font-bold text-sm uppercase tracking-[0.2em]">Carbon OS</span>
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Dashboard</span>
          </div>
          <ThemeToggle />
        </div>
      </header>
      <div className="px-4 sm:px-6 py-8">
        <ErrorBoundary>
          <WizardShell />
        </ErrorBoundary>
      </div>
    </main>
  )
}
