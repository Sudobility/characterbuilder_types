/**
 * First-party "attractiveness" data.
 *
 * This is CharacterBuilder's OWN internal model of which end of each facial trait
 * reads, within a demographic, as healthy / harmonious / well-groomed — the signal
 * the "Look" (1–10) knob dials toward. It is a hand-curated static table, NOT an
 * LLM call, so the result is deterministic and reviewable.
 *
 * ── Scope & ethics ─────────────────────────────────────────────────────────────
 * The table encodes ONLY cross-cultural, ancestry-neutral signals:
 *   • symmetry & proportion harmony,
 *   • skin / dental health,
 *   • grooming (tidy brows, no unibrow),
 *   • sexual dimorphism (jaw/brow/lip shape, read against the subject's own sex),
 *   • structural definition (cheekbones, jawline, defined mouth).
 *
 * It deliberately expresses NO opinion on identity- or ancestry-marking features —
 * skin tone & undertone, iris & hair colour, hair texture, eye shape, lid type,
 * epicanthic fold, and the entire NOSE (bridge, width, nasal index, root, tip…).
 * Those keys are simply absent here, so the caster keeps the demographic
 * population distribution for them at every Look level. "Attractive" must never
 * come to mean "more European"; omission is how we guarantee that.
 *
 * Weights are RELATIVE (they need not sum to 1 — `normalize` handles that) and are
 * kept intentionally spread, not spiked to a single value: attractiveness is a
 * tendency, so even at Look 10 a trait is SAMPLED from this distribution, giving
 * attractive-but-varied faces rather than one cloned "ideal".
 */
import type { FaceFeatureKey } from '../face/index.js';
import type { Demographics } from '../demographics/index.js';
import type {
  FaceDistributions,
  TraitDistribution,
} from '../distribution/index.js';
import { normalize, type Weights } from './rng.js';

type Table = Partial<Record<FaceFeatureKey, Weights>>;

/**
 * Sex-neutral baseline. Traits whose attractive profile differs by sex (jaw, brow,
 * lips, chin, neck…) are overridden wholesale in {@link FEMALE}/{@link MALE} below.
 */
const BASE: Table = {
  // ── Symmetry & overall harmony ──
  asymmetry: { none: 80, subtle: 20 },
  // Balanced, harmonious outlines over elongated/angular ones. These are shape
  // descriptors, not ancestry markers, so a mild lean is ancestry-neutral.
  faceShape: {
    oval: 32,
    heart: 16,
    round: 16,
    square: 14,
    diamond: 12,
    rectangular: 5,
    triangle: 3,
    trapezoid: 2,
  },
  facialProportion: { mesoprosopic: 55, leptoprosopic: 28, euryprosopic: 17 },
  dominantThird: { balanced: 70, middle: 18, lower: 7, upper: 5 },
  foreheadHeight: { medium: 65, tall: 25, low: 10 },
  foreheadBreadth: { medium: 65, narrow: 20, broad: 15 },
  foreheadSlope: { slight: 50, vertical: 45, sloping: 5 },
  skullHeight: { medium: 60, tall: 32, low: 8 },
  headSize: { average: 80, small: 10, large: 10 },
  temporalWidth: { average: 70, narrow: 18, wide: 12 },
  midfaceLength: { medium: 75, short: 15, long: 10 },
  midfaceProjection: { forward: 42, medium: 52, flat: 6 },

  // ── Eyes (non-ancestry aspects only) ──
  // Almond / gently upturned reads as attractive across cultures; this says nothing
  // about lid type, epicanthic fold or monolid — those stay population ancestry
  // markers, so an almond-eyed attractive face can still be monolid.
  eyeShape: { almond: 46, upturned: 30, round: 16, hooded: 4, downturned: 4 },
  canthalTilt: { positive: 48, neutral: 47, negative: 5 },
  eyeSpacing: { average: 65, 'wide-set': 25, 'close-set': 10 },
  orbitalDepth: { average: 62, deep: 28, shallow: 10 },
  limbalRing: { strong: 42, medium: 45, faint: 13 },
  lashLength: { long: 45, medium: 47, short: 8 },
  lashDensity: { dense: 45, medium: 47, sparse: 8 },
  tearTrough: { smooth: 86, puffy: 8, hollow: 6 },
  scleralShow: { none: 85, lower: 12, 'upper-and-lower': 3 },

  // ── Brows (grooming; shape is sex-split below) ──
  interBrowDistance: { average: 50, wide: 40, narrow: 10 }, // never a unibrow
  browDensity: { medium: 46, full: 40, sparse: 14 },
  browHeight: { medium: 62, high: 25, low: 13 },

  // ── Cheeks & structure ──
  cheekFullness: { full: 52, flat: 42, gaunt: 6 },
  cheekboneHeight: { high: 55, medium: 40, low: 5 },
  cheekboneWidth: { medium: 62, wide: 30, narrow: 8 },
  cheekboneProjection: { prominent: 45, moderate: 50, flat: 5 },
  submalarHollow: { moderate: 55, filled: 36, hollow: 9 },

  // ── Mouth & lips (fullness is sex-split below) ──
  mouthWidth: { medium: 62, wide: 30, narrow: 8 },
  mouthCorners: { neutral: 50, upturned: 45, downturned: 5 },
  cupidsBow: { sharp: 45, rounded: 45, flat: 10 },
  lipRatio: { balanced: 62, 'fuller-lower': 24, 'fuller-upper': 14 },
  lipProjection: { medium: 70, protruding: 16, flat: 14 },
  vermilionHeight: { medium: 55, tall: 35, thin: 10 },
  philtrumLength: { medium: 58, short: 37, long: 5 },
  philtrumDepth: { medium: 64, deep: 26, shallow: 10 },

  // ── Teeth & bite (health) ──
  teeth: { even: 92, gapped: 4, prominent: 4 },
  biteClass: { 'class-i': 90, 'class-ii': 7, 'class-iii': 3 },
  toothSize: { medium: 66, small: 24, large: 10 },
  toothShow: { slight: 60, none: 30, prominent: 10 },
  gumDisplay: { normal: 75, low: 22, gummy: 3 },
  teethColor: { bright: 55, natural: 45 },

  // ── Skin (health; even tone, clear surface — NOT tone/colour) ──
  skinTexture: { smooth: 60, normal: 38, coarse: 2 },
  poreVisibility: { fine: 55, moderate: 42, large: 3 },
  skinSurface: { normal: 55, matte: 40, oily: 3, dry: 2 },
  pigmentation: { even: 88, freckled: 10, uneven: 2 },

  // ── Jaw / chin (strongly sex-split below; base is a middle ground) ──
  jawDefinition: { defined: 60, soft: 40 },
  jawAngle: { moderate: 52, sharp: 38, soft: 10 },
  jawWidth: { medium: 70, wide: 18, narrow: 12 },
  jawLength: { medium: 76, long: 14, short: 10 },
  submentalFullness: { clean: 90, slight: 9, 'double-chin': 1 },
  jowls: { none: 90, slight: 9, developed: 1 },
  chinProjection: { neutral: 64, prominent: 31, receding: 5 },
  chinShape: { round: 32, square: 28, pointed: 24, broad: 16 },
  chinHeight: { medium: 72, short: 14, long: 14 },
  chinCleft: { none: 80, slight: 18, pronounced: 2 },
  profile: { orthognathic: 80, 'mild-prognathic': 17, prognathic: 3 },
  neckThickness: { average: 70, slender: 18, thick: 12 },

  // ── Ears (tidy, close-set) ──
  earSize: { medium: 60, small: 35, large: 5 },
  earProtrusion: { flat: 70, moderate: 27, protruding: 3 },

  // ── Charm feature ──
  dimples: { none: 56, cheek: 34, chin: 5, both: 5 },
};

/** Female-read dimorphism: softer jaw/brow, fuller lips, higher arch. */
const FEMALE: Table = {
  jawDefinition: { defined: 35, soft: 65 },
  jawAngle: { soft: 35, moderate: 50, sharp: 15 },
  jawWidth: { narrow: 35, medium: 55, wide: 10 },
  chinShape: { round: 40, pointed: 35, square: 15, broad: 10 },
  chinProjection: { neutral: 72, prominent: 23, receding: 5 },
  browRidge: { flat: 76, moderate: 22, heavy: 2 },
  browThickness: { medium: 55, thin: 25, thick: 20 },
  browShape: { curved: 46, rounded: 24, angled: 20, straight: 10 },
  browArch: { high: 40, medium: 45, low: 12, flat: 3 },
  frontalBossing: { flat: 70, slight: 28, rounded: 2 },
  glabella: { flat: 72, prominent: 28 },
  lipFullness: { full: 50, medium: 42, thin: 8 },
  vermilionHeight: { tall: 40, medium: 50, thin: 10 },
  cheekFullness: { full: 60, flat: 35, gaunt: 5 },
  neckThickness: { slender: 46, average: 49, thick: 5 },
  adamsApple: { flat: 95, slight: 5 },
};

/** Male-read dimorphism: stronger jaw/brow, squarer chin, balanced lips. */
const MALE: Table = {
  jawDefinition: { defined: 75, soft: 25 },
  jawAngle: { sharp: 55, moderate: 40, soft: 5 },
  jawWidth: { wide: 40, medium: 55, narrow: 5 },
  chinShape: { square: 40, broad: 30, round: 20, pointed: 10 },
  chinProjection: { prominent: 40, neutral: 55, receding: 5 },
  chinCleft: { none: 64, slight: 33, pronounced: 3 },
  browRidge: { moderate: 55, heavy: 25, flat: 20 },
  browThickness: { medium: 50, thick: 40, thin: 10 },
  browShape: { straight: 46, angled: 35, curved: 14, rounded: 5 },
  browArch: { low: 32, medium: 45, flat: 14, high: 9 },
  frontalBossing: { slight: 50, flat: 45, rounded: 5 },
  lipFullness: { medium: 60, full: 25, thin: 15 },
  cheekFullness: { flat: 46, full: 49, gaunt: 5 },
  neckThickness: { average: 55, thick: 35, slender: 10 },
  adamsApple: { slight: 55, prominent: 30, flat: 15 },
};

/**
 * The ancestry-specific ATTRACTIVE structure (face outline, cheekbones, nose judged
 * on each region's own aesthetic) now lives in the ancestry TAXONOMY as per-node
 * overlays — see `ancestry.ts`. The caller resolves a node and passes its
 * accumulated overlay here as `ancestryAttr`.
 */

function isMinor(demo: Demographics): boolean {
  const { ageBand, ageYears } = demo;
  return (
    ageBand === 'child' ||
    ageBand === 'teen' ||
    (ageYears != null && ageYears < 18)
  );
}

function isOld(demo: Demographics): boolean {
  const { ageBand, ageYears } = demo;
  return (
    ageBand === 'sixties' ||
    ageBand === 'seventies-plus' ||
    (ageYears != null && ageYears >= 60)
  );
}

/**
 * Soften the youth-only pushes for an older subject so "attractive" means
 * well-aged and distinguished, not implausibly youthful. Symmetry, even skin,
 * healthy teeth and good structure stay ideal at any age.
 */
function matureOverrides(): Table {
  return {
    jowls: { none: 55, slight: 40, developed: 5 },
    submentalFullness: { clean: 68, slight: 30, 'double-chin': 2 },
    cheekFullness: { full: 40, flat: 52, gaunt: 8 },
  };
}

/**
 * CharacterBuilder's attractiveness distributions for a demographic — the data the
 * "Look" knob biases toward. Sex selects the dimorphism overrides; age softens the
 * youth-only traits. Minors get NO attractiveness shaping (returns empty) so the
 * knob never sexualizes or ages a child; the caster's hard constraints already
 * keep a minor's face age-appropriate.
 *
 * Keys absent from the result keep their population distribution at every Look
 * level (see the ethics note at the top of this file).
 */
export function attractivenessDistributions(
  demo: Demographics = {},
  ancestryAttr?: Partial<Record<FaceFeatureKey, Weights>>
): FaceDistributions {
  if (isMinor(demo)) return {};

  const merged: Table = { ...BASE };
  // Ancestry first (face/cheek/nose structure, from the resolved taxonomy node)…
  if (ancestryAttr) Object.assign(merged, ancestryAttr);
  // …then sex, so dimorphism (jaw/brow/lip/chin/neck) wins on the traits it owns…
  const sexOverrides =
    demo.sex === 'female' ? FEMALE : demo.sex === 'male' ? MALE : undefined;
  if (sexOverrides) Object.assign(merged, sexOverrides);
  // …then age softening.
  if (isOld(demo)) Object.assign(merged, matureOverrides());

  const out: FaceDistributions = {};
  for (const [key, weights] of Object.entries(merged)) {
    if (!weights || Object.keys(weights).length === 0) continue; // {} = defer to population
    out[key as FaceFeatureKey] = normalize(
      weights as Weights
    ) as TraitDistribution;
  }
  return out;
}

/**
 * Neutral baseline for the enum traits that have NO population distribution (the
 * caster would otherwise fall back to the enum's first value — several of which
 * are unflattering extremes, e.g. interBrowDistance → "unibrow", facialHairDensity
 * → "patchy", mouthCorners → "downturned"). These are plain middle-of-the-road
 * values used whenever such a trait is neither sampled nor pulled toward the Look
 * ideal, so an un-dialed face is still coherent rather than defective.
 */
export const NEUTRAL_DEFAULTS: Partial<Record<FaceFeatureKey, string>> = {
  asymmetry: 'none',
  chinHeight: 'medium',
  columella: 'neutral',
  dominantThird: 'balanced',
  earShape: 'oval',
  eyeSpacing: 'average',
  facialHairDensity: 'medium',
  facialProportion: 'mesoprosopic',
  foreheadBreadth: 'medium',
  gumDisplay: 'normal',
  headSize: 'average',
  interBrowDistance: 'average',
  jawLength: 'medium',
  lidFoldHeight: 'medium',
  limbalRing: 'medium',
  lipProjection: 'medium',
  midfaceLength: 'medium',
  mouthCorners: 'neutral',
  mouthWidth: 'medium',
  nasalRoot: 'medium',
  noseBridge: 'straight', // modal cross-ancestry bridge; keeps convex/humped as variety, not 25%
  noseBridgeHeight: 'medium',
  noseBridgeWidth: 'medium',
  noseTip: 'rounded',
  noseTipProjection: 'medium',
  noseTipRotation: 'neutral',
  nostrils: 'medium',
  orbitalDepth: 'average',
  philtrumDepth: 'medium',
  philtrumLength: 'medium',
  skullHeight: 'medium',
  temporalWidth: 'average',
  toothShow: 'slight',
  toothSize: 'medium',
  vermilionHeight: 'medium',
};
