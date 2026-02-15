# Carbon Intelligence Platform — Methodology Documentation

## Overview

This document describes the emission calculation methodology implemented in the Carbon Intelligence Platform. The platform computes facility-level greenhouse gas (GHG) emissions following the **GHG Protocol Corporate Standard** (WRI/WBCSD, 2004; amended 2015) and the **Scope 2 Guidance** (WRI, 2015).

---

## Scope 1 — Direct Emissions

### Stationary Combustion

**Methodology:** EPA GHG Emission Factors Hub 2025, Table 1

For each fuel type consumed on-site:

```
CO2 (tonnes) = Fuel Quantity × CO2 Emission Factor
CH4 CO2e (tonnes) = Fuel Quantity × CH4 EF (g/unit) × GWP_CH4 / 1,000,000
N2O CO2e (tonnes) = Fuel Quantity × N2O EF (g/unit) × GWP_N2O / 1,000,000
Total CO2e = CO2 + CH4_CO2e + N2O_CO2e
```

GWP values from IPCC AR6 (2021):
- CH4 (fossil): 29.8
- N2O: 273

Supported fuels: natural gas (therms → MMBtu), diesel (#2), residual fuel oil (#6), propane, kerosene.

### Mobile Combustion

**Methodology:** EPA GHG EF Hub 2025, Tables 2-5

Two-component calculation:
1. **CO2** — fuel-based: `gallons × CO2_kg_per_gallon`
2. **CH4/N2O** — distance-based: `miles × g_per_mile × GWP / 1,000,000`

Fuel consumption derived from:
```
gallons = (vehicles × annual_miles) / fuel_economy_mpg
```

Default fuel economies from EPA Table 4 when not provided.

### Fugitive Emissions (Refrigerants)

**Methodology:** IPCC AR6 WG1, Table 7.SM.7; EPA Vintaging Model

```
CO2e (tonnes) = charge_kg × annual_leak_rate × GWP_100 / 1,000
```

Default leak rates by equipment type from EPA Vintaging Model (e.g., commercial AC: 10%, industrial refrigeration: 15%, residential AC: 4%).

---

## Scope 2 — Indirect Emissions from Electricity

Both methods always computed per GHG Protocol Scope 2 Guidance.

### Location-Based Method

**Source:** EPA eGRID2023

```
CO2e (tonnes) = kWh × subregion_EF (kg/kWh) × (1 + T&D_loss_pct) / 1,000
```

State-to-subregion mapping applied automatically. Transmission and distribution losses from eGRID subregion data (typically 4-7%).

### Market-Based Method

Hierarchy per Scope 2 Guidance:
1. Supplier-specific emission factor (if provided)
2. Renewable Energy Certificate (REC) adjusted: `(1 - REC%) × grid_EF`
3. Residual mix factor (if available)
4. eGRID fallback (same as location-based)

---

## Scope 3 — Value Chain Emissions

### Category 1-2: Purchased/Capital Goods (Spend-Based)

**Source:** EPA USEEIO v2.0

```
CO2e = spend_USD × sector_EF (kg CO2e/USD)
```

18 economic sectors mapped to EEIO factors.

### Category 3: Fuel & Energy Activities

**Source:** EPA GHG EF Hub 2025, Table 8; eGRID2023

Well-to-tank (WTT):
```
CO2e = fuel_quantity × WTT_EF
```

Transmission & distribution losses:
```
CO2e = kWh × grid_EF × T&D_loss_pct / 1,000
```

### Category 4: Upstream Transportation

**Source:** EPA GHG EF Hub 2025, Table 10

```
CO2e = tonnes × miles × EF (kg CO2e/ton-mile) / 1,000
```

### Category 5: Waste in Operations

**Source:** EPA GHG EF Hub 2025, Table 12

```
CO2e = short_tons × disposal_EF (tCO2e/short_ton)
```

Factors vary by waste type and disposal method (landfill, recycled, composted, incinerated).

### Category 6: Business Travel

**Source:** EPA GHG EF Hub 2025, Table 9

```
CO2e = passenger_miles × EF (kg CO2e/passenger-mile) / 1,000
```

By mode: air (short/medium/long-haul), rail, car rental.

### Category 7: Employee Commuting

**Source:** EPA GHG EF Hub 2025, Table 11

```
CO2e = employees × one_way_distance × 2 × working_days × mode_EF / 1,000
```

### Categories 8-15

Simplified implementations with documented assumptions. Category 13 (downstream leased assets) and Category 15 (investments) included when data provided.

---

## Estimation Fallback

When actual utility data is unavailable (Basic mode), the platform estimates energy consumption:

**Source:** EIA CBECS 2018; ASHRAE 169-2020

1. Look up EUI benchmark for building type (kBtu/sqft)
2. Apply climate zone adjustment (HDD/CDD multipliers from ASHRAE)
3. Split by fuel type using CBECS fuel split percentages
4. Convert to electricity (kWh) and natural gas (therms)
5. Apply standard emission factors

Estimated data tagged `dataQuality: 'estimated'` with ±15% uncertainty.

---

## Uncertainty Quantification

### Analytical Method

95% confidence intervals computed using error propagation:
```
CI = total × sqrt(sum of (relative_uncertainty²) per parameter)
```

### Monte Carlo Simulation

**Methodology:** IPCC Tier 2 uncertainty analysis

- 1,000 runs (configurable)
- Seeded PRNG (Mulberry32) for reproducibility
- Parameter distributions:
  | Parameter Type | Distribution | Uncertainty |
  |---|---|---|
  | Measured energy | Normal | ±2.5% |
  | Estimated energy | Normal | ±15% |
  | Grid emission factor | Normal | ±5% |
  | Refrigerant charge | Normal | ±20% |
  | Leak rate | Lognormal | ±50% |
  | EEIO spend factors | Lognormal | ±30% |
  | Waste quantity | Normal | ±10% |
  | Fleet mileage | Normal | ±10% |

- Convergence diagnostic: coefficient of variation of running mean
- Output: mean, median, std dev, percentiles (P5-P95), 95% CI, histogram

---

## Decarbonization Scenarios

### Intervention Types

1. **Renewable PPA** — reduces Scope 2 (market-based) by renewable %
2. **Fleet Electrification** — replaces ICE → EV, net of charging emissions
3. **HVAC Upgrade** — COP improvement reduces heating/cooling energy
4. **On-site Solar** — offsets grid electricity
5. **Building Envelope** — reduces heating/cooling loads
6. **Waste Diversion** — redirects from landfill

### Financial Analysis

- **NPV** at 8% discount rate over 10 years
- **IRR** via Newton-Raphson iteration
- **Simple Payback** = CapEx / annual savings
- **Cumulative CO2 Avoided** over projection period

### Grid Decarbonization Projection

**Source:** EIA Annual Energy Outlook 2025

10-year grid emission factor trajectory applied to baseline Scope 2 emissions.

---

## Data Sources

| Dataset | Version | Source | Application |
|---------|---------|--------|-------------|
| EPA GHG EF Hub | 2025 | US EPA | Scope 1, 3 combustion/travel/waste |
| eGRID | 2023 | US EPA | Scope 2 grid electricity |
| IPCC AR6 GWP-100 | 2021 | IPCC | Refrigerant CO2e conversion |
| DEFRA/DESNZ | 2025 | UK Gov | International factors, water, freight |
| CBECS | 2018 | US EIA | Building energy benchmarks |
| ASHRAE 169 | 2020 | ASHRAE | Climate zone HDD/CDD |
| USEEIO | v2.0 | US EPA | Scope 3 spend-based factors |
| EIA AEO | 2025 | US EIA | Grid decarbonization projections |

---

## Limitations

1. Scope 3 Categories 8-15 use simplified methodologies
2. Spend-based EEIO factors have high uncertainty (±30%)
3. Climate adjustment uses national averages, not micro-climate data
4. Building physics estimation does not account for operational schedules
5. Default leak rates are industry averages; facility-specific rates preferred
6. Grid projections assume national average trends

## References

1. GHG Protocol Corporate Accounting and Reporting Standard (Revised Edition), WRI/WBCSD, 2004
2. GHG Protocol Scope 2 Guidance, WRI, 2015
3. IPCC AR6 WG1 Chapter 7, Supplementary Material Table 7.SM.7, 2021
4. EPA eGRID2023 Technical Support Document, 2024
5. EPA GHG Emission Factors Hub, April 2025
6. EIA Commercial Buildings Energy Consumption Survey (CBECS) 2018
7. ASHRAE Standard 169-2020: Climatic Data for Building Design Standards
8. EPA USEEIO v2.0 Technical Documentation, 2022
9. EIA Annual Energy Outlook 2025
