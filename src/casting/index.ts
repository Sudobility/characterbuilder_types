/**
 * The casting engine: Demographics -> per-trait distributions -> a complete,
 * coherent FaceSpec. Pure and deterministic under a seed, shared by the backend
 * (authoritative casting before generation) and the frontend (preview/odds).
 */
export {
  mulberry32,
  hashSeed,
  weightedPick,
  mostLikely,
  chance,
  normalize,
  type Rng,
  type Weights,
} from './rng.js';
export {
  buildDistributions,
  ageBandForYears,
  resolveAgeBand,
} from './distributions.js';
export {
  castFaceSpec,
  resolveDemographics,
  type CastOptions,
  type CastResult,
} from './cast.js';
export {
  GLOBAL_PRIORS,
  ANCESTRY_MULTIPLIERS,
  AGE_MULTIPLIERS,
  HEALTH_MULTIPLIERS,
  SEX_MULTIPLIERS,
  BUILD_MULTIPLIERS,
  type Multipliers,
} from './weights.js';
export {
  attractivenessDistributions,
  NEUTRAL_DEFAULTS,
} from './attractiveness.js';
export {
  ANCESTRY_FOREST,
  resolveAncestry,
  sampleAncestryFraction,
  blendByFraction,
  mixDistributions,
  BLEND_CONCENTRATION,
  type AncestryNode,
  type AncestryBlendRef,
  type AncestryOverlay,
  type AncestryRef,
  type AncestryResolution,
  type ResolvedComponent,
} from './ancestry.js';
