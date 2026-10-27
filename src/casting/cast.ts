/**
 * castFaceSpec: fill every unset enum trait of a (partial) FaceSpec by sampling
 * the demographic distribution, then enforce the hard biological constraints.
 * The result is a COMPLETE spec (every enum feature set) ready for the two-stage
 * ShapeShyft pipeline. Generation is ephemeral: call once per image with a fresh
 * seed to get a different, coherent person each time.
 */
import {
  FACE_FEATURE_VALUES,
  HAIR_FEATURE_KEYS,
  type FaceSpec,
  type SkinMark,
  type WrinkleArea,
} from '../face/index.js';
import type { Demographics } from '../demographics/index.js';
import type { FaceDistributions } from '../distribution/index.js';
import { buildDistributions } from './distributions.js';
import {
  NEUTRAL_DEFAULTS,
  attractivenessDistributions,
} from './attractiveness.js';
import {
  resolveAncestry,
  sampleAncestryFraction,
  blendByFraction,
  type AncestryRef,
} from './ancestry.js';
import {
  chance,
  hashSeed,
  mulberry32,
  sharpen,
  weightedPick,
  type Rng,
} from './rng.js';

/**
 * How hard to peak an "ideal" (Look-selected) trait toward its best attractive
 * value. 3 crushes a ≤10% unattractive tail to <1% while leaving the top one or
 * two near-equal values in play — "mostly ideal, slight variety".
 */
const IDEAL_SHARPEN = 3;

export interface CastOptions {
  /** Deterministic seed; omit for fresh randomness each call. */
  seed?: number;
  /** Pre-built distributions (e.g. with LLM overrides merged); built if absent. */
  distributions?: FaceDistributions;
  /**
   * "Look" level, 0..1: the fraction of unset, attractiveness-relevant traits
   * sampled from good-looking odds instead of population odds. Hair traits are
   * excluded. At 0 all traits use population odds; at 0.9 about 90% of eligible
   * traits use good-looking odds.
   */
  conformity?: number;
  /**
   * Per-trait odds among GOOD-LOOKING people of the demographic (from the
   * `character-attractive` endpoint). Eligible traits are sampled from these
   * odds when selected by Look; absent traits use population odds.
   */
  attractiveness?: FaceDistributions;
  /** Coordinate the Look selection across images in one generation batch. */
  lookBatch?: { index: number; seed: number };
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

/**
 * Merge the demographics object with any demographic fields set in the spec (the
 * spec wins). Exported so callers that pre-build distributions/attractiveness
 * (e.g. the job runner) resolve the SAME effective demographics the caster uses —
 * otherwise sex/ancestry/age set only in the spec would leave those tables neutral.
 */
export function resolveDemographics(
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
    // Carry a mixed-ancestry spec through so the caster can resolve both parents.
    ...(demo.mix ? { mix: demo.mix } : {}),
  };
}

/**
 * `look` (conformity, 0..1) suppresses UNFLATTERING marks — at Look 10 a good-looking
 * face is essentially clear, at Look 0 the natural rates apply. A single beauty mark
 * is left alone (it reads as attractive, not a blemish).
 */
function castSkinMarks(
  spec: Record<string, unknown>,
  isOld: boolean,
  rng: Rng,
  look = 0
): SkinMark[] {
  const marks: SkinMark[] = [];
  const clear = 1 - Math.min(Math.max(look, 0), 1); // 1 at Look 0 → ~0 at Look 10
  const maybe = (m: SkinMark, p: number, flattering = false) => {
    const prob = flattering ? p : p * clear;
    if (marks.length < 4 && chance(prob, rng)) marks.push(m);
  };
  maybe('moles', 0.35 * (0.3 + 0.7 * clear)); // moles partly kept; soft reduction
  maybe('beauty-mark', 0.12, true);
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
  const seed =
    opts.seed ??
    (hashSeed(JSON.stringify(demo)) ^ ((Math.random() * 0xffffffff) | 0)) >>> 0;
  const rng = mulberry32(seed);

  const spec: Record<string, unknown> = { ...partial };

  // Seed the demographic fields from the resolved demographics.
  if (demo.sex != null) spec.sex ??= demo.sex;
  if (demo.ageBand != null) spec.ageBand ??= demo.ageBand;
  if (demo.ageYears != null) spec.ageYears ??= demo.ageYears;
  if (demo.build != null) spec.build ??= demo.build;

  // Resolve the per-trait distributions + attractiveness. If the caller prebuilt
  // `distributions` (tests / a preview that wants a fixed demographic), trust those.
  // Otherwise resolve the ancestry TAXONOMY with this cast's seed: a STEM (e.g.
  // "Asian", "European") descends at random to a concrete sub-population, a leaf
  // ("Northern Chinese") is used directly, and MIXED inherits each trait from one
  // randomly-chosen parent.
  let distributions: FaceDistributions;
  let attractiveness = opts.attractiveness;
  if (opts.distributions) {
    distributions = opts.distributions;
  } else {
    const res = resolveAncestry(
      demo as Demographics & { mix?: AncestryRef[] },
      rng
    );
    if (res) {
      // Build each heritage component's population + attractiveness distributions,
      // then blend them with ONE per-person ancestry fraction (shared across both
      // tables, so the whole face leans the same way).
      const parts = res.components.map((c) => {
        const leafDemo = {
          ...demo,
          ancestry: c.enumAncestry as Demographics['ancestry'],
        };
        return {
          weight: c.weight,
          pop: buildDistributions(leafDemo, c.population),
          attr: attractivenessDistributions(leafDemo, c.attractiveness),
        };
      });
      if (parts.length === 1) {
        distributions = parts[0]!.pop;
        attractiveness = parts[0]!.attr;
      } else {
        const alpha = sampleAncestryFraction(
          parts.map((p) => p.weight),
          rng
        );
        distributions = blendByFraction(
          parts.map((p) => p.pop),
          alpha,
          rng
        );
        attractiveness = blendByFraction(
          parts.map((p) => p.attr),
          alpha,
          rng
        );
      }
      spec.ancestry ??= res.enumAncestry as FaceSpec['ancestry'];
      if (spec.ancestryNote == null) spec.ancestryNote = res.label;
    } else {
      distributions = buildDistributions(demo);
    }
  }
  // Fallbacks for the prebuilt-distributions path (and any unresolved case): keep a
  // named sub-population in the prose and the broad ancestry on the spec.
  if (demo.ancestry != null) spec.ancestry ??= demo.ancestry;
  if (demo.subPopulation && spec.ancestryNote == null)
    spec.ancestryNote = demo.subPopulation;

  // Fill every unset enum feature. `conformity` (the "Look" level / 10) is the
  // FRACTION of the ATTRACTIVENESS-relevant unset traits that are drawn from the
  // good-looking distribution instead of the general population — so Look only ever
  // moves traits our attractiveness model has an opinion on (symmetry, skin, jaw,
  // brows, lips…); pigment & ancestry-marking traits always come from the
  // population, at any Look. Both sources are SAMPLED (not forced to a single mode),
  // so Look 10 yields attractive-but-varied faces, Look 0 full natural variety.
  const conformity = Math.min(Math.max(opts.conformity ?? 0, 0), 1);
  const hasDist = (w?: Record<string, number>) =>
    !!w && Object.keys(w).length > 0;
  const unset = Object.keys(FACE_FEATURE_VALUES).filter((k) => spec[k] == null);
  // The Look budget applies only to traits the attractiveness model covers — the
  // denominator of the 1..10 scale.
  // All hair dials use population odds even when an attractiveness profile names
  // them. The Look budget is spent only on non-hair traits.
  const hairKeys = new Set<string>(HAIR_FEATURE_KEYS);
  const lookable = unset.filter(
    (k) =>
      !hairKeys.has(k) &&
      hasDist(attractiveness?.[k as keyof FaceDistributions])
  );
  // Pick exactly round(conformity · N) of them to be drawn from the attractive
  // distribution; choose which via a seeded shuffle (deterministic under a seed).
  const idealCount = Math.round(conformity * lookable.length);
  const order = [...lookable];
  // A batch shares one shuffled order. Rotate the non-ideal slice by its own
  // width for each image: at Look 9, different traits supply the ~10% of
  // natural variation, instead of coincidentally repeating the same subset.
  const selectionRng = opts.lookBatch ? mulberry32(opts.lookBatch.seed) : rng;
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(selectionRng() * (i + 1));
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  const excludedCount = order.length - idealCount;
  const start =
    opts.lookBatch && excludedCount > 0
      ? (opts.lookBatch.index * excludedCount) % order.length
      : idealCount;
  const excluded = new Set(
    Array.from(
      { length: excludedCount },
      (_, offset) => order[(start + offset) % order.length]!
    )
  );
  const ideal = new Set(order.filter((key) => !excluded.has(key)));
  for (const key of unset) {
    const attr = attractiveness?.[key as keyof FaceDistributions];
    const pop = distributions[key as keyof FaceDistributions];
    if (key === 'hairStyle' && hasDist(pop)) {
      const length = spec.hairLength;
      const texture = spec.hairTexture;
      const allowed = (style: string) =>
        !(
          length === 'very-short' &&
          [
            'center-part',
            'layered',
            'braids',
            'locs',
            'ponytail',
            'bun',
          ].includes(style)
        ) &&
        !(length === 'short' && ['ponytail', 'bun'].includes(style)) &&
        !(style === 'afro' && texture !== 'coily' && texture !== 'curly');
      const compatible = Object.fromEntries(
        Object.entries(pop!).filter(([style]) => allowed(style))
      );
      spec[key] = weightedPick(compatible, rng);
      continue;
    }
    if (ideal.has(key) && hasDist(attr)) {
      // Attractive pick, sharpened so the best value dominates (misses rare) while
      // keeping the near-best values possible — "mostly ideal" rather than a clone.
      spec[key] = weightedPick(sharpen(attr!, IDEAL_SHARPEN), rng);
    } else if (hasDist(pop)) {
      spec[key] = weightedPick(pop!, rng); // population variety
    } else {
      // No distribution at all: use a neutral default so the enum's first value
      // (often an unflattering extreme) isn't silently baked into every face.
      spec[key] =
        NEUTRAL_DEFAULTS[key as keyof FaceDistributions] ??
        FACE_FEATURE_VALUES[key as keyof typeof FACE_FEATURE_VALUES][0];
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
  // A clean-shaven face has no facial-hair density/colour to describe — drop them
  // so the prompt never mentions (e.g.) "patchy facial hair" on a woman.
  if (spec.facialHair === 'clean-shaven') {
    delete spec.facialHairDensity;
    delete spec.facialHairColor;
  }

  // Only name an asymmetric feature when the face is actually asymmetric; a "none"
  // asymmetry with a stray asymmetryFeature made the composer invent a flaw.
  if (spec.asymmetry == null || spec.asymmetry === 'none')
    delete spec.asymmetryFeature;

  // A female (or any minor) does not read with a prominent Adam's apple; a
  // population draw can still land there, so clamp it like a biology rule.
  if ((spec.sex === 'female' || isMinor) && spec.adamsApple === 'prominent')
    spec.adamsApple = 'flat';

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
  if (partial.facialHairColor == null && spec.facialHair !== 'clean-shaven')
    spec.facialHairColor = spec.hairColor;

  // ── Derived multi-selects (depend on the now-final scalar values) ──────────
  if (partial.wrinkleAreas == null)
    spec.wrinkleAreas = castWrinkleAreas(spec.wrinkleLevel as string, rng);
  if (partial.skinMarks == null)
    spec.skinMarks = castSkinMarks(spec, isOld, rng, conformity);

  return { spec: spec as FaceSpec, distributions, demographics: demo };
}
