# Carbon OS Demo Script

## Setup
- Open the app in your browser
- Make sure you're on the landing page (/)
- Have the browser at a reasonable width so the full nav is visible

---

## 1. Landing Page (30 seconds)

> "This is Carbon OS, a facility-level carbon intelligence platform. It lets building operators and portfolio managers estimate greenhouse gas emissions across all three scopes of the GHG Protocol."

- Point out the **emissions slider** below the heading
- Drag it from 100% down to ~20%: *"The core idea is simple: measure what you emit, then reduce it."*
- Drag it back to 100%
- Point out the **factory animation** with smoke rising from the smokestacks

> "The platform supports Scope 1 through 3 analysis, facility benchmarking against CBECS data, Monte Carlo uncertainty simulation, and decarbonization scenario modeling."

- Scroll briefly to show the **capabilities grid**, then scroll back up

---

## 2. Enter the Dashboard (10 seconds)

- Click **"Start Estimating"**

> "The input wizard supports three modes."

- Point to the **mode selector** at the top: Basic, Advanced, Expert
- *"Basic mode estimates emissions from just building type, size, and location. Advanced adds actual utility data, fleet, waste, and Scope 3. Expert gives full control over emission factors and building physics."*

---

## 3. Facility Info (30 seconds)

> "Let's walk through a calculation. I'll enter a sample office building."

Fill in:
| Field | Value |
|-------|-------|
| Facility Name | **One Federal Plaza** |
| Building Type | **Office** |
| Square Footage | **75000** |
| State | **NY** |
| ZIP Code | **10007** |
| Year Built | **2003** |
| Employees | **320** |

- Click **Next**

---

## 4. Energy Inputs (20 seconds)

> "Now we enter the actual energy consumption data. These come from utility bills."

Fill in:
| Field | Value |
|-------|-------|
| Electricity | **1200000** kWh |
| Data Quality | **Utility Bill** |
| Natural Gas | **35000** therms |
| Data Quality | **Utility Bill** |

> "If you don't have exact numbers, you can leave these blank and the system estimates from CBECS benchmarks for your building type and climate zone."

- Click **Next**

---

## 5. Review and Calculate (20 seconds)

> "The review screen summarizes all inputs before calculation."

- Point to the **input summary cards** showing facility details and energy data
- Click **"Calculate Emissions"**

> "The engine runs EPA emission factors, eGRID subregion data, and IPCC AR6 GWP values to compute emissions across all three scopes. It then runs a 500-iteration Monte Carlo simulation for uncertainty quantification."

---

## 6. Results Dashboard (60 seconds)

Wait for results to load, then walk through each section:

### Top Metrics
> "The dashboard gives four key metrics at the top: total CO2 equivalent, carbon intensity per square foot, percentile ranking against the national building stock, and a data quality score."

### Scope Breakdown
> "Below that, emissions are broken down by scope. Scope 1 is direct emissions from natural gas combustion. Scope 2 is indirect from grid electricity. Scope 3 covers the upstream value chain."

### Emissions Table
> "The source table ranks each emission category with its scope, absolute emissions, intensity, and a trend sparkline."

### Charts
> "The donut chart shows the scope split. The waterfall chart decomposes each source. The benchmark gauge shows where this facility sits relative to the national median for office buildings."

### Uncertainty Analysis
> "The uncertainty section shows the 95% confidence interval from analytical propagation, and below it the Monte Carlo distribution from 500 simulated runs. Each scope gets its own confidence interval."

---

## 7. Scenario Builder (30 seconds)

- Scroll down to **Decarbonization Scenarios**

> "The scenario builder lets you model interventions and see their impact."

- Click **"Add Intervention"** and select **Renewable Energy PPA**
- Adjust the slider to ~80% renewable share
- Click **"Evaluate Scenario"**

> "The system recalculates emissions with the intervention applied and shows the reduction, cost projections, and payback period. The MACC curve ranks interventions by cost-effectiveness, and the projection chart shows the emissions trajectory over time."

---

## 8. Export (10 seconds)

- Scroll to the top info bar
- Point to the **[PDF] [CSV] [JSON]** export buttons

> "Results can be exported as PDF for reporting, CSV for analysis, or JSON for API integration. The PDF includes the full methodology disclosure and factor citations."

---

## 9. Methodology (15 seconds)

- Click back to the landing page, then click **Methodology** in the nav

> "The methodology page documents every calculation, every emission factor source, and every assumption. This is aligned with GHG Protocol Corporate Standard, EPA GHG Emission Factors Hub 2025, eGRID 2023, IPCC AR6 GWP-100 values, and CBECS 2018 benchmarks."

---

## Closing (15 seconds)

> "Carbon OS is a full-stack carbon accounting platform: from raw utility data to GHG Protocol-aligned emissions, Monte Carlo uncertainty, decarbonization scenario modeling, and regulatory-ready exports. All running client-side with no backend dependency for the core calculation engine."

---

## Sample Data Cheat Sheet

If you need to demo Advanced mode with more inputs:

| Input | Value |
|-------|-------|
| Refrigerant Type | R-410A |
| Charge (kg) | 15 |
| Leak Rate | 5% |
| Fleet: Vehicle Type | Light-duty truck |
| Fuel Type | Diesel |
| Annual Miles | 25000 |
| Count | 3 |
| Waste: Landfill (tons) | 120 |
| Waste: Recycled (tons) | 45 |
| Water (gallons) | 500000 |
| Scope 3: Purchased Goods ($) | 2000000 |
| Scope 3: Business Travel ($) | 150000 |

---

## Timing

| Section | Duration |
|---------|----------|
| Landing page | 30s |
| Enter dashboard | 10s |
| Facility info | 30s |
| Energy inputs | 20s |
| Review + calculate | 20s |
| Results walkthrough | 60s |
| Scenario builder | 30s |
| Export | 10s |
| Methodology | 15s |
| Closing | 15s |
| **Total** | **~3.5 minutes** |
