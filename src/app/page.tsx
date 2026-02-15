import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { SmokeAnimation } from '@/components/smoke-animation'

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* ===== NAV ===== */}
      <nav className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-sm">&#x250C;</span>
            <span className="font-bold text-sm uppercase tracking-[0.2em]">Carbon OS</span>
          </div>
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors">
              Platform
            </Link>
            <Link href="/methodology" className="text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors">
              Methodology
            </Link>
            <Link href="/methodology" className="text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors">
              Documentation
            </Link>
            <ThemeToggle />
            <Link
              href="/dashboard"
              className="border border-foreground px-4 py-2 text-xs uppercase tracking-[0.15em] hover:bg-foreground hover:text-background transition-colors"
            >
              Open Dashboard &rarr;
            </Link>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="max-w-3xl mx-auto px-6 pt-8 pb-6 text-center">
        <div className="w-16 h-px bg-border mx-auto mb-4" />
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-6">
          Facility Carbon Intelligence
        </p>
        <h1 className="text-6xl font-light tracking-tight leading-[1.1] mb-8">
          Estimate<br />Emissions
        </h1>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-8 leading-relaxed">
          Precision carbon accounting for commercial portfolios.
          Measure, model, and reduce. With architectural clarity.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/dashboard"
            className="bg-foreground text-background px-8 py-3.5 text-xs uppercase tracking-[0.15em] font-medium hover:opacity-90 transition-opacity"
          >
            Start Estimating &rarr;
          </Link>
          <Link
            href="/methodology"
            className="border border-foreground px-8 py-3.5 text-xs uppercase tracking-[0.15em] font-medium hover:bg-foreground hover:text-background transition-colors"
          >
            View Methodology
          </Link>
        </div>
      </section>

      {/* ===== FACTORY SMOKE ===== */}
      <SmokeAnimation />

      {/* ===== CAPABILITIES GRID ===== */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="flex items-center gap-3 mb-10">
          <span className="text-muted-foreground">&#x251C;</span>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">System Capabilities</p>
        </div>
        <div className="grid grid-cols-2 border border-border">
          {[
            {
              title: 'Scope 1\u20133 Analysis',
              desc: 'Direct, indirect, and value chain emissions mapped to your operations.',
            },
            {
              title: 'Facility Benchmarks',
              desc: 'Compare performance across portfolio with industry percentiles.',
            },
            {
              title: 'Scenario Modeling',
              desc: 'Simulate decarbonization pathways with CapEx and payback projections.',
            },
            {
              title: 'Regulatory Reporting',
              desc: 'CSRD, SEC, ISSB-aligned outputs generated automatically.',
            },
          ].map((cap, i) => (
            <div
              key={cap.title}
              className={`p-10 ${i % 2 === 0 ? 'border-r border-border' : ''} ${i < 2 ? 'border-b border-border' : ''}`}
            >
              <div className="flex items-start gap-2">
                <span className="text-muted-foreground mt-0.5">&middot;</span>
                <div>
                  <p className="font-bold text-sm mb-3">{cap.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{cap.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">&#x2514;</span>
            <span className="text-xs text-muted-foreground">
              Carbon OS v2.4.1 / Precision Carbon Intelligence
            </span>
          </div>
          <span className="text-muted-foreground text-sm">&#x2518;</span>
        </div>
      </footer>
    </main>
  )
}
