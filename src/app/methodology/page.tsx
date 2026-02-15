import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/theme-toggle'

const sections = [
  {
    title: 'Overview',
    content:
      'The platform computes facility-level greenhouse gas (GHG) emissions following the GHG Protocol Corporate Standard (WRI/WBCSD, 2004; amended 2015) and the Scope 2 Guidance (WRI, 2015).',
  },
  {
    title: 'Scope 1 \u2014 Direct Emissions',
    items: [
      {
        subtitle: 'Stationary Combustion',
        text: 'EPA GHG Emission Factors Hub 2025, Table 1. CO2e = Fuel Quantity \u00d7 EF + CH4/N2O components with IPCC AR6 GWP-100 (CH4: 29.8, N2O: 273).',
      },
      {
        subtitle: 'Mobile Combustion',
        text: 'EPA GHG EF Hub 2025, Tables 2\u20135. CO2 via fuel-based, CH4/N2O via distance-based calculation.',
      },
      {
        subtitle: 'Fugitive Emissions',
        text: 'IPCC AR6 WG1, Table 7.SM.7. CO2e = charge_kg \u00d7 annual_leak_rate \u00d7 GWP / 1,000. Default leak rates from EPA Vintaging Model.',
      },
    ],
  },
  {
    title: 'Scope 2 \u2014 Indirect Emissions',
    items: [
      {
        subtitle: 'Location-Based',
        text: 'EPA eGRID2023 subregion emission factors with T&D loss adjustment (4\u20137%).',
      },
      {
        subtitle: 'Market-Based',
        text: 'Hierarchy: supplier-specific EF \u2192 REC-adjusted \u2192 residual mix \u2192 eGRID fallback.',
      },
    ],
  },
  {
    title: 'Scope 3 \u2014 Value Chain',
    items: [
      { subtitle: 'Cat 1\u20132: Purchased Goods', text: 'EPA USEEIO v2.0 spend-based factors across 18 sectors.' },
      { subtitle: 'Cat 3: Fuel & Energy', text: 'Well-to-tank + T&D loss emissions.' },
      { subtitle: 'Cat 5: Waste', text: 'EPA EF Hub Table 12 by waste type and disposal method.' },
      { subtitle: 'Cat 6: Business Travel', text: 'Mode-specific EFs: air (haul-distance), rail, car rental.' },
      { subtitle: 'Cat 7: Commuting', text: 'Employee count \u00d7 distance \u00d7 mode EF \u00d7 working days.' },
    ],
  },
  {
    title: 'Uncertainty Quantification',
    items: [
      {
        subtitle: 'Analytical',
        text: '95% CI via error propagation: CI = total \u00d7 \u221a\u03a3(relative_uncertainty\u00b2).',
      },
      {
        subtitle: 'Monte Carlo',
        text: 'IPCC Tier 2: 1,000 runs, seeded PRNG (Mulberry32), normal/lognormal parameter distributions.',
      },
    ],
  },
  {
    title: 'Data Sources',
    content:
      'EPA GHG EF Hub 2025 \u2022 eGRID 2023 \u2022 IPCC AR6 GWP-100 (2021) \u2022 DEFRA/DESNZ 2025 \u2022 CBECS 2018 \u2022 ASHRAE 169-2020 \u2022 EPA USEEIO v2.0 \u2022 EIA AEO 2025',
  },
]

export default function MethodologyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <nav className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-sm">&#x250C;</span>
              <span className="font-bold text-sm uppercase tracking-[0.2em]">Carbon OS</span>
            </Link>
            <span className="text-muted-foreground text-xs">/</span>
            <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Methodology</span>
          </div>
          <div className="flex items-center gap-6">
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

      {/* CONTENT */}
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-12">
        <div>
          <div className="w-12 h-px bg-border mb-6" />
          <h1 className="text-4xl font-bold tracking-tight mb-4">Methodology</h1>
          <p className="text-sm text-muted-foreground">
            GHG Protocol Corporate Standard: calculation methodology and emission factor sources.
          </p>
        </div>

        {sections.map((section) => (
          <div key={section.title} className="border border-border">
            <div className="px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-[10px]">&#x251C;</span>
                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{section.title}</span>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4 text-sm leading-relaxed">
              {section.content && <p>{section.content}</p>}
              {section.items?.map((item) => (
                <div key={item.subtitle}>
                  <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-1">{item.subtitle}</p>
                  <p className="text-muted-foreground">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="text-xs text-muted-foreground pt-4 border-t border-border">
          Full technical documentation available in <code className="text-foreground">docs/methodology.md</code>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">&#x2514;</span>
            <span className="text-xs text-muted-foreground">Carbon OS / Precision Carbon Intelligence</span>
          </div>
          <span className="text-muted-foreground text-sm">&#x2518;</span>
        </div>
      </footer>
    </main>
  )
}
