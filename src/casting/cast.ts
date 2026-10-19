/**
 * castFaceSpec: fill every unset enum trait of a (partial) FaceSpec by sampling
 * the demographic distribution, then enforce the hard biological constraints.
 * The result is a COMPLETE spec (every enum feature set) ready for the two-stage
 * ShapeShyft pipeline. Generation is ephemeral: call once per image with a fresh
 * seed to get a different, coherent person each time.
 */
import {
  FACE_FEATURE_VALUES,
  type FaceSpec,
  type SkinMark,
  type WrinkleArea,
} from '../face/index.js';
import type { Demographics } from '../demographics/index.js';
import type { FaceDistributions } from '../distribution/index.js';
import { buildDistributions } from './distributions.js';
import { chance, hashSeed, mulberry32, weightedPick, type Rng } from './rng.js';

export interface CastOptions {
  /** Deterministic seed; omit for fresh randomness each call. */
  seed?: number;
  /** Pre-built distributions (e.g. with LLM overrides merged); built if absent. */
  distributions?: FaceDistributions;
}

export interface CastResult {
  /** The complete FaceSpec (every enum feature set). */
  spec: FaceSpec;
  /** The distributions sampled from (for display / debugging). */
  distributions: FaceDistributions;
  /** The demographics the cast was resolved against. */
  demographics: Demographics;
}

const MALE_PATTERN_BALDING = new Set([
  'temple-recession',
  'crown-thinning',
  'norwood-advanced',
]);
const GREY_HAIR_COLORS = new Set(['grey', 'white', 'salt-and-pepper']);

/** Merge the demographics object with any demographic fields set in the spec. */
function resolveDemographics(
  partial: FaceSpec,
  demo: Demographics
): Demographics {
  return {
    ancestry: partial.ancestry ?? demo.ancestry,
    subPopulation: demo.subPopulation,
    sex: partial.sex ?? demo.sex,
    ageBand: partial.ageBand ?? demo.ageBand,
    ageYears: partial.ageYears ?? demo.ageYears,
    health: demo.health,
    build: partial.build ?? demo.build,
  };
}

function castSkinMarks(
  spec: Record<string, unknown>,
  isOld: boolean,
  rng: Rng
): SkinMark[] {
  const marks: SkinMark[] = [];
  const maybe = (m: SkinMark, p: number) => {
    if (marks.length < 4 && chance(p, rng)) marks.push(m);
  };
  maybe('moles', 0.35);
  maybe('beauty-mark', 0.12);
  maybe('birthmark', 0.06);
  maybe('scars', 0.1);
  maybe('acne-scarring', 0.1);
  maybe('age-spots', isOld ? 0.45 : 0.04);
  maybe('visible-capillaries', isOld ? 0.15 : 0.05);
  maybe('rosacea', 0.05);
  return marks;
}

const WRINKLE_AREA_POOL: Record<string, WrinkleArea[]> = {
  'fine-lines': ['crows-feet', 'forehead'],
  moderate: ['crows-feet', 'forehead', 'nasolabial', 'glabella'],
  deep: [
    'crows-feet',
    'forehead',
    'nasolabial',
    'glabella',
    'marionette',
    'under-eye',
    'neck',
  ],
};

function castWrinkleAreas(level: string, rng: Rng): WrinkleArea[] {
  const pool = WRINKLE_AREA_POOL[level];
  if (!pool) return [];
  const min = level === 'deep' ? 3 : level === 'moderate' ? 2 : 1;
  const picked = pool.filter(() => chance(0.6, rng));
  // Guarantee a floor so a non-"none" level always shows somewhere, adding
  // pool entries in order until the minimum is met (no duplicates, terminates).
  for (const area of pool) {
    if (picked.length >= min) break;
    if (!picked.includes(area)) picked.push(area);
  }
  return picked;
}

/**
 * Cast a complete FaceSpec. `partial` fields are always kept; everything unset is
 * drawn from the demographic distribution. Hard constraints then fix any
 * biologically impossible combination the independent draws produced.
 */
export function castFaceSpec(
  partial: FaceSpec = {},
  demographics: Demographics = {},
  opts: CastOptions = {}
): CastResult {
  const demo = resolveDemographics(partial, demographics);
  const distributions = opts.distributions ?? buildDistributions(demo);
  const seed =
    opts.seed ??
    (hashSeed(JSON.stringify(demo)) ^ ((Math.random() * 0xffffffff) | 0)) >>> 0;
  const rng = mulberry32(seed);

  const spec: Record<string, unknown> = { ...partial };

  // Seed the demographic fields from the resolved demographics.
  if (demo.sex != null) spec.sex ??= demo.sex;
  if (demo.ageBand != null) spec.ageBand ??= demo.ageBand;
  if (demo.ageYears != null) spec.ageYears ??= demo.ageYears;
  if (demo.ancestry != null) spec.ancestry ??= demo.ancestry;
  if (demo.build != null) spec.build ??= demo.build;
  // A named sub-population (e.g. "Korean") steers the prose: thread it through
  // ancestryNote so both the preview and the remote composer honor it. (The
  // static distribution tables only know the broad ancestry; finer weighting is
  // the deferred LLM-refine layer's job.)
  if (demo.subPopulation && spec.ancestryNote == null) {
    spec.ancestryNote = demo.subPopulation;
  }

  // Sample every unset enum feature.
  for (const key of Object.keys(FACE_FEATURE_VALUES)) {
    if (spec[key] == null) {
      const dist = distributions[key as keyof FaceDistributions];
      spec[key] = dist
        ? weightedPick(dist, rng)
        : FACE_FEATURE_VALUES[key as keyof typeof FACE_FEATURE_VALUES][0];
    }
  }

  // ── Hard constraints ──────────────────────────────────────────────────────
  const years = spec.ageYears as number | undefined;
  const band = spec.ageBand as string | undefined;
  const isChild = band === 'child' || (years != null && years < 13);
  const isMinor = isChild || band === 'teen' || (years != null && years < 18);
  const isOld =
    band === 'sixties' ||
    band === 'seventies-plus' ||
    (years != null && years >= 60);

  // Facial hair only on non-female adults.
  if (spec.sex === 'female' || isMinor) spec.facialHair = 'clean-shaven';

  // Monolids have no crease; a double lid implies one.
  if (spec.lidType === 'monolid') spec.lidCrease = 'none';
  else if (spec.lidType === 'double' && spec.lidCrease === 'none')
    spec.lidCrease = 'double';

  // An upper-third-dominant face can't also have a low forehead.
  if (spec.dominantThird === 'upper' && spec.foreheadHeight === 'low')
    spec.foreheadHeight = 'tall';

  // Greying and hair color must agree.
  if (
    spec.greying === 'full' &&
    !GREY_HAIR_COLORS.has(spec.hairColor as string)
  )
    spec.hairColor = chance(0.5, rng) ? 'grey' : 'white';
  if (GREY_HAIR_COLORS.has(spec.hairColor as string) && spec.greying === 'none')
    spec.greying =
      spec.hairColor === 'salt-and-pepper' ? 'salt-and-pepper' : 'full';

  // Female balding follows a diffuse (not male) pattern.
  if (spec.sex === 'female' && MALE_PATTERN_BALDING.has(spec.balding as string))
    spec.balding = 'diffuse-thinning';

  // Children/teens: strip every aging cue. Runs AFTER the greying/hair-color
  // rules so nothing re-ages them, and re-rolls grey scalp hair to a young color.
  if (isMinor) {
    spec.greying = 'none';
    spec.balding = 'none';
    if (GREY_HAIR_COLORS.has(spec.hairColor as string)) {
      const hd: Record<string, number> = { ...(distributions.hairColor ?? {}) };
      for (const g of GREY_HAIR_COLORS) delete hd[g];
      spec.hairColor = weightedPick(hd, rng);
    }
    if (spec.jowls === 'developed' || spec.jowls === 'slight')
      spec.jowls = 'none';
    if (spec.submentalFullness === 'double-chin')
      spec.submentalFullness = 'clean';
    if (spec.nasolabialFold === 'deep') spec.nasolabialFold = 'faint';
    if (spec.tearTrough === 'hollow') spec.tearTrough = 'smooth';
    if (spec.teethColor === 'yellowed') spec.teethColor = 'natural';
    if (isChild) spec.wrinkleLevel = 'none';
    else if (spec.wrinkleLevel === 'moderate' || spec.wrinkleLevel === 'deep')
      spec.wrinkleLevel = 'fine-lines';
  }

  // Brow and facial-hair color track the scalp unless the caller set them
  // (after any hair-color change above).
  if (partial.browColor == null) spec.browColor = spec.hairColor;
  if (partial.facialHairColor == null) spec.facialHairColor = spec.hairColor;

  // ── Derived multi-selects (depend on the now-final scalar values) ──────────
  if (partial.wrinkleAreas == null)
    spec.wrinkleAreas = castWrinkleAreas(spec.wrinkleLevel as string, rng);
  if (partial.skinMarks == null)
    spec.skinMarks = castSkinMarks(spec, isOld, rng);

  return { spec: spec as FaceSpec, distributions, demographics: demo };
}
