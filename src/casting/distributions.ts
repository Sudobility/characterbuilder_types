/**
 * buildDistributions: Demographics -> per-trait probability maps (the hybrid
 * STATIC base). The API may pass `overrides` (an LLM-refined distribution for a
 * named sub-population / health nuance) to replace specific traits' odds — that
 * is the "hybrid" half; this file is the deterministic half.
 */
import { FACE_FEATURE_VALUES, type FaceFeatureKey } from '../face/index.js';
import type { Demographics } from '../demographics/index.js';
import type {
  FaceDistributions,
  TraitDistribution,
} from '../distribution/index.js';
import { normalize } from './rng.js';
import { NEUTRAL_DEFAULTS } from './attractiveness.js';
import {
  AGE_MULTIPLIERS,
  ANCESTRY_MULTIPLIERS,
  BUILD_MULTIPLIERS,
  GLOBAL_PRIORS,
  HEALTH_MULTIPLIERS,
  SEX_MULTIPLIERS,
  type Multipliers,
} from './weights.js';

/** Map a concrete age in years to its band (used when only `ageYears` is given). */
export function ageBandForYears(years: number): string {
  if (years < 13) return 'child';
  if (years < 20) return 'teen';
  if (years < 30) return 'twenties';
  if (years < 40) return 'thirties';
  if (years < 50) return 'forties';
  if (years < 60) return 'fifties';
  if (years < 70) return 'sixties';
  return 'seventies-plus';
}

/** The age band implied by a demographics object, if any. */
export function resolveAgeBand(demo: Demographics): string | undefined {
  if (demo.ageBand) return demo.ageBand;
  if (demo.ageYears != null) return ageBandForYears(demo.ageYears);
  return undefined;
}

/** Multiply listed (value -> factor) entries into a weight map in place. */
function applyMultiplier(
  weights: Record<string, number>,
  mult?: Record<string, number>
): void {
  if (!mult) return;
  for (const [value, factor] of Object.entries(mult)) {
    if (value in weights) weights[value]! *= factor;
  }
}

/**
 * Build the full per-trait distribution for a demographic. Every enum FaceSpec
 * feature gets a normalized probability map; `overrides` (if given) replaces the
 * odds for any trait it names.
 */
export function buildDistributions(
  demo: Demographics = {},
  overrides?: FaceDistributions
): FaceDistributions {
  const band = resolveAgeBand(demo);
  const ancestry = demo.ancestry
    ? ANCESTRY_MULTIPLIERS[demo.ancestry]
    : undefined;
  const age = band ? AGE_MULTIPLIERS[band] : undefined;
  const health = demo.health ? HEALTH_MULTIPLIERS[demo.health] : undefined;
  const sex = demo.sex ? SEX_MULTIPLIERS[demo.sex] : undefined;
  const build = demo.build ? BUILD_MULTIPLIERS[demo.build] : undefined;

  const out: Record<string, TraitDistribution> = {};
  for (const [key, values] of Object.entries(FACE_FEATURE_VALUES)) {
    const k = key as FaceFeatureKey;
    const override = overrides?.[k];
    if (override) {
      out[key] = normalize(override);
      continue;
    }
    const prior = GLOBAL_PRIORS[k];
    // Traits with no curated prior would otherwise be uniform — and a uniform prior
    // makes an unflattering enum[0] (e.g. interBrowDistance "unibrow",
    // mouthCorners "downturned") as likely as any other value. When we have a
    // sensible neutral default for such a trait, peak the prior there so the
    // common/plausible value dominates while still leaving variety.
    const favored = prior ? undefined : NEUTRAL_DEFAULTS[k];
    const weights: Record<string, number> = {};
    for (const value of values)
      weights[value] = prior?.[value] ?? (value === favored ? 8 : 1);
    for (const table of [ancestry, age, health, sex, build] as (
      Multipliers | undefined
    )[]) {
      applyMultiplier(weights, table?.[k]);
    }
    out[key] = normalize(weights);
  }
  return out as FaceDistributions;
}
