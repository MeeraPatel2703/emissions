/**
 * Physical constants and unit conversion factors used throughout the emissions engine.
 * All conversions are exact or derived from standard references.
 */

// ═══════════════════════════════════════════════════
// UNIT CONVERSIONS
// ═══════════════════════════════════════════════════

/** 1 therm = 0.1 MMBtu (exact) */
export const MMBTU_PER_THERM = 0.1

/** 1 ccf of natural gas ≈ 0.1036 MMBtu (EPA default) */
export const MMBTU_PER_CCF = 0.1036

/** 1 scf of natural gas ≈ 0.001036 MMBtu */
export const MMBTU_PER_SCF = 0.001036

/** 1 short ton = 2000 lbs */
export const LBS_PER_SHORT_TON = 2000

/** 1 metric tonne = 2204.62 lbs */
export const LBS_PER_METRIC_TONNE = 2204.62

/** 1 metric tonne = 1000 kg */
export const KG_PER_METRIC_TONNE = 1000

/** 1 short ton ≈ 0.9072 metric tonnes */
export const METRIC_TONNES_PER_SHORT_TON = 0.9072

/** 1 gallon = 3.78541 liters */
export const LITERS_PER_GALLON = 3.78541

/** 1 kWh = 0.003412 MMBtu */
export const MMBTU_PER_KWH = 0.003412

/** 1 kBtu = 0.001 MMBtu */
export const MMBTU_PER_KBTU = 0.001

/** 1 lb = 0.453592 kg */
export const KG_PER_LB = 0.453592

/** 1 mile = 1.60934 km */
export const KM_PER_MILE = 1.60934

/** 1 m3 = 264.172 US gallons */
export const GALLONS_PER_M3 = 264.172

/** 1 sqft = 0.0929 m2 */
export const M2_PER_SQFT = 0.0929

// ═══════════════════════════════════════════════════
// GWP VALUES (IPCC AR6)
// ═══════════════════════════════════════════════════

/** AR6 100-year GWP for fossil CH4 */
export const GWP_CH4_FOSSIL = 29.8

/** AR6 100-year GWP for biogenic CH4 */
export const GWP_CH4_BIOGENIC = 27.9

/** AR6 100-year GWP for N2O */
export const GWP_N2O = 273

// ═══════════════════════════════════════════════════
// DEFAULTS
// ═══════════════════════════════════════════════════

/** Default working days per year for commuting calculations */
export const DEFAULT_WORKING_DAYS_PER_YEAR = 250

/** Default T&D loss percentage for US grid (if subregion-specific not available) */
export const DEFAULT_TND_LOSS_PCT = 0.05

/** Engine version string */
export const ENGINE_VERSION = '1.0.0'

/** Factor set version string */
export const FACTOR_SET_VERSION = 'epa-2025_egrid-2023_defra-2025_ar6'
