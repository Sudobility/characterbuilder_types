import { z } from 'zod';

/**
 * The comprehensive FaceSpec: every major dial AND sub-dial from
 * `writings-chimps/prompts/face-variation-reference.md`, modeled as independent,
 * optional fields so a caller can specify as much or as little as they like.
 *
 * Behavior contract (see characterbuilder_api):
 *  - Every field is OPTIONAL on input.
 *  - Before an image is generated the API CASTS a value for every unset field
 *    (coherent, demographic-weighted) so the spec passed downstream is COMPLETE —
 *    this is what defeats the "every AI face looks the same" collapse: unset
 *    fields are never left to the model's attractive mean, they are drawn.
 *  - Every enum therefore carries a neutral/"none" member where a feature may not
 *    apply (facial hair on a child, teeth when the mouth is closed), so a complete
 *    spec is always expressible without nonsense.
 *
 * Each feature is exported BOTH as a `readonly string[]` (so the UI can render a
 * menu without reaching into Zod internals) AND as a `z.enum` (for validation).
 * Keep the two in sync — the enum is always built from the array.
 */

const enumOf = <T extends readonly [string, ...string[]]>(values: T) =>
  z.enum(values);

/* ─────────────────────────── Bone / cranial structure ─────────────────────── */

export const CRANIAL_SHAPES = [
  'dolichocephalic', // long, narrow head
  'mesocephalic', // medium
  'brachycephalic', // short, broad, rounder head
  'hyperbrachycephalic', // very broad / round
] as const;
export const cranialShapeSchema = enumOf(CRANIAL_SHAPES);
export type CranialShape = z.infer<typeof cranialShapeSchema>;

export const SKULL_HEIGHTS = ['low', 'medium', 'tall'] as const;
export const skullHeightSchema = enumOf(SKULL_HEIGHTS);
export type SkullHeight = z.infer<typeof skullHeightSchema>;

export const TEMPORAL_WIDTHS = ['narrow', 'average', 'wide'] as const;
export const temporalWidthSchema = enumOf(TEMPORAL_WIDTHS);
export type TemporalWidth = z.infer<typeof temporalWidthSchema>;

export const HEAD_SIZES = ['small', 'average', 'large'] as const;
export const headSizeSchema = enumOf(HEAD_SIZES);
export type HeadSize = z.infer<typeof headSizeSchema>;

export const FACE_SHAPES = [
  'oval',
  'round',
  'square',
  'rectangular',
  'heart',
  'diamond',
  'triangle',
  'trapezoid',
] as const;
export const faceShapeSchema = enumOf(FACE_SHAPES);
export type FaceShape = z.infer<typeof faceShapeSchema>;

export const FACIAL_PROPORTIONS = [
  'euryprosopic', // broad, short face
  'mesoprosopic', // average
  'leptoprosopic', // long, narrow face
] as const;
export const facialProportionSchema = enumOf(FACIAL_PROPORTIONS);
export type FacialProportion = z.infer<typeof facialProportionSchema>;

export const DOMINANT_THIRDS = [
  'upper',
  'middle',
  'lower',
  'balanced',
] as const;
export const dominantThirdSchema = enumOf(DOMINANT_THIRDS);
export type DominantThird = z.infer<typeof dominantThirdSchema>;

export const FOREHEAD_HEIGHTS = ['low', 'medium', 'tall'] as const;
export const foreheadHeightSchema = enumOf(FOREHEAD_HEIGHTS);
export type ForeheadHeight = z.infer<typeof foreheadHeightSchema>;

export const FOREHEAD_SLOPES = ['vertical', 'slight', 'sloping'] as const;
export const foreheadSlopeSchema = enumOf(FOREHEAD_SLOPES);
export type ForeheadSlope = z.infer<typeof foreheadSlopeSchema>;

export const FOREHEAD_BREADTHS = ['narrow', 'medium', 'broad'] as const;
export const foreheadBreadthSchema = enumOf(FOREHEAD_BREADTHS);
export type ForeheadBreadth = z.infer<typeof foreheadBreadthSchema>;

export const FRONTAL_BOSSINGS = ['flat', 'slight', 'rounded'] as const;
export const frontalBossingSchema = enumOf(FRONTAL_BOSSINGS);
export type FrontalBossing = z.infer<typeof frontalBossingSchema>;

export const BROW_RIDGES = ['flat', 'moderate', 'heavy'] as const;
export const browRidgeSchema = enumOf(BROW_RIDGES);
export type BrowRidge = z.infer<typeof browRidgeSchema>;

export const GLABELLAS = ['flat', 'prominent'] as const;
export const glabellaSchema = enumOf(GLABELLAS);
export type Glabella = z.infer<typeof glabellaSchema>;

/* ───────────────────────────────── Eyes ───────────────────────────────────── */

export const EYE_SIZES = ['small', 'medium', 'large'] as const;
export const eyeSizeSchema = enumOf(EYE_SIZES);
export type EyeSize = z.infer<typeof eyeSizeSchema>;

export const EYE_SPACINGS = ['close-set', 'average', 'wide-set'] as const;
export const eyeSpacingSchema = enumOf(EYE_SPACINGS);
export type EyeSpacing = z.infer<typeof eyeSpacingSchema>;

/** Bony orbital depth — how recessed the eyes sit under the brow. */
export const ORBITAL_DEPTHS = ['shallow', 'average', 'deep'] as const;
export const orbitalDepthSchema = enumOf(ORBITAL_DEPTHS);
export type OrbitalDepth = z.infer<typeof orbitalDepthSchema>;

export const EYE_SHAPES = [
  'almond',
  'round',
  'upturned',
  'downturned',
  'hooded',
] as const;
export const eyeShapeSchema = enumOf(EYE_SHAPES);
export type EyeShape = z.infer<typeof eyeShapeSchema>;

export const CANTHAL_TILTS = ['negative', 'neutral', 'positive'] as const;
export const canthalTiltSchema = enumOf(CANTHAL_TILTS);
export type CanthalTilt = z.infer<typeof canthalTiltSchema>;

/** Structural upper-lid type (independent of crease count below). */
export const LID_TYPES = [
  'double',
  'monolid',
  'hooded',
  'deep-set',
  'prominent',
] as const;
export const lidTypeSchema = enumOf(LID_TYPES);
export type LidType = z.infer<typeof lidTypeSchema>;

/** Upper-eyelid crease configuration: none (monolid) → single → double → triple. */
export const LID_CREASES = ['none', 'single', 'double', 'triple'] as const;
export const lidCreaseSchema = enumOf(LID_CREASES);
export type LidCrease = z.infer<typeof lidCreaseSchema>;

export const LID_FOLD_HEIGHTS = ['low', 'medium', 'high'] as const;
export const lidFoldHeightSchema = enumOf(LID_FOLD_HEIGHTS);
export type LidFoldHeight = z.infer<typeof lidFoldHeightSchema>;

export const EPICANTHIC_FOLDS = ['none', 'slight', 'pronounced'] as const;
export const epicanthicFoldSchema = enumOf(EPICANTHIC_FOLDS);
export type EpicanthicFold = z.infer<typeof epicanthicFoldSchema>;

export const TEAR_TROUGHS = ['smooth', 'hollow', 'puffy'] as const;
export const tearTroughSchema = enumOf(TEAR_TROUGHS);
export type TearTrough = z.infer<typeof tearTroughSchema>;

export const SCLERAL_SHOWS = ['none', 'lower', 'upper-and-lower'] as const;
export const scleralShowSchema = enumOf(SCLERAL_SHOWS);
export type ScleralShow = z.infer<typeof scleralShowSchema>;

export const LASH_LENGTHS = ['short', 'medium', 'long'] as const;
export const lashLengthSchema = enumOf(LASH_LENGTHS);
export type LashLength = z.infer<typeof lashLengthSchema>;

export const LASH_DENSITIES = ['sparse', 'medium', 'dense'] as const;
export const lashDensitySchema = enumOf(LASH_DENSITIES);
export type LashDensity = z.infer<typeof lashDensitySchema>;

export const IRIS_COLORS = [
  'dark-brown',
  'brown',
  'amber',
  'hazel',
  'green',
  'grey',
  'blue',
] as const;
export const irisColorSchema = enumOf(IRIS_COLORS);
export type IrisColor = z.infer<typeof irisColorSchema>;

export const HETEROCHROMIAS = ['none', 'partial', 'complete'] as const;
export const heterochromiaSchema = enumOf(HETEROCHROMIAS);
export type Heterochromia = z.infer<typeof heterochromiaSchema>;

export const LIMBAL_RINGS = ['faint', 'medium', 'strong'] as const;
export const limbalRingSchema = enumOf(LIMBAL_RINGS);
export type LimbalRing = z.infer<typeof limbalRingSchema>;

/* ──────────────────────────────── Eyebrows ────────────────────────────────── */

export const BROW_THICKNESSES = ['thin', 'medium', 'thick'] as const;
export const browThicknessSchema = enumOf(BROW_THICKNESSES);
export type BrowThickness = z.infer<typeof browThicknessSchema>;

export const BROW_SHAPES = ['straight', 'curved', 'angled', 'rounded'] as const;
export const browShapeSchema = enumOf(BROW_SHAPES);
export type BrowShape = z.infer<typeof browShapeSchema>;

export const BROW_ARCHES = ['flat', 'low', 'medium', 'high'] as const;
export const browArchSchema = enumOf(BROW_ARCHES);
export type BrowArch = z.infer<typeof browArchSchema>;

export const BROW_HEIGHTS = ['low', 'medium', 'high'] as const;
export const browHeightSchema = enumOf(BROW_HEIGHTS);
export type BrowHeight = z.infer<typeof browHeightSchema>;

export const BROW_DENSITIES = ['sparse', 'medium', 'full'] as const;
export const browDensitySchema = enumOf(BROW_DENSITIES);
export type BrowDensity = z.infer<typeof browDensitySchema>;

export const INTER_BROW_DISTANCES = [
  'unibrow',
  'narrow',
  'average',
  'wide',
] as const;
export const interBrowDistanceSchema = enumOf(INTER_BROW_DISTANCES);
export type InterBrowDistance = z.infer<typeof interBrowDistanceSchema>;

/* ───────────────────────────────── Nose ───────────────────────────────────── */

export const NOSE_SIZES = ['small', 'medium', 'large'] as const;
export const noseSizeSchema = enumOf(NOSE_SIZES);
export type NoseSize = z.infer<typeof noseSizeSchema>;

export const NOSE_LENGTHS = ['short', 'medium', 'long'] as const;
export const noseLengthSchema = enumOf(NOSE_LENGTHS);
export type NoseLength = z.infer<typeof noseLengthSchema>;

/** Bony radix depth at the nasal root (how deep the scoop between the brows). */
export const NASAL_ROOTS = ['shallow', 'medium', 'deep'] as const;
export const nasalRootSchema = enumOf(NASAL_ROOTS);
export type NasalRoot = z.infer<typeof nasalRootSchema>;

export const NOSE_BRIDGES = [
  'straight',
  'convex',
  'concave',
  'humped',
] as const;
export const noseBridgeSchema = enumOf(NOSE_BRIDGES);
export type NoseBridge = z.infer<typeof noseBridgeSchema>;

export const NOSE_BRIDGE_HEIGHTS = ['low', 'medium', 'high'] as const;
export const noseBridgeHeightSchema = enumOf(NOSE_BRIDGE_HEIGHTS);
export type NoseBridgeHeight = z.infer<typeof noseBridgeHeightSchema>;

export const NOSE_BRIDGE_WIDTHS = ['narrow', 'medium', 'wide'] as const;
export const noseBridgeWidthSchema = enumOf(NOSE_BRIDGE_WIDTHS);
export type NoseBridgeWidth = z.infer<typeof noseBridgeWidthSchema>;

export const NOSE_WIDTHS = ['narrow', 'medium', 'wide'] as const;
export const noseWidthSchema = enumOf(NOSE_WIDTHS);
export type NoseWidth = z.infer<typeof noseWidthSchema>;

export const NOSE_TIPS = [
  'pointed',
  'rounded',
  'bulbous',
  'boxy',
  'upturned',
  'drooping',
] as const;
export const noseTipSchema = enumOf(NOSE_TIPS);
export type NoseTip = z.infer<typeof noseTipSchema>;

export const NOSE_TIP_PROJECTIONS = [
  'shallow',
  'medium',
  'projecting',
] as const;
export const noseTipProjectionSchema = enumOf(NOSE_TIP_PROJECTIONS);
export type NoseTipProjection = z.infer<typeof noseTipProjectionSchema>;

export const NOSE_TIP_ROTATIONS = [
  'upturned',
  'neutral',
  'downturned',
] as const;
export const noseTipRotationSchema = enumOf(NOSE_TIP_ROTATIONS);
export type NoseTipRotation = z.infer<typeof noseTipRotationSchema>;

export const NOSTRIL_SHAPES = ['narrow', 'medium', 'flared'] as const;
export const nostrilShapeSchema = enumOf(NOSTRIL_SHAPES);
export type NostrilShape = z.infer<typeof nostrilShapeSchema>;

export const ALAR_BASE_WIDTHS = ['narrow', 'medium', 'wide'] as const;
export const alarBaseWidthSchema = enumOf(ALAR_BASE_WIDTHS);
export type AlarBaseWidth = z.infer<typeof alarBaseWidthSchema>;

export const COLUMELLAS = ['retracted', 'neutral', 'hanging'] as const;
export const columellaSchema = enumOf(COLUMELLAS);
export type Columella = z.infer<typeof columellaSchema>;

export const NASAL_INDICES = [
  'leptorrhine', // long, narrow
  'mesorrhine', // medium
  'platyrrhine', // short, broad
] as const;
export const nasalIndexSchema = enumOf(NASAL_INDICES);
export type NasalIndex = z.infer<typeof nasalIndexSchema>;

/* ──────────────────────────── Mouth & lips ────────────────────────────────── */

export const LIP_FULLNESSES = ['thin', 'medium', 'full'] as const;
export const lipFullnessSchema = enumOf(LIP_FULLNESSES);
export type LipFullness = z.infer<typeof lipFullnessSchema>;

export const LIP_RATIOS = ['balanced', 'fuller-upper', 'fuller-lower'] as const;
export const lipRatioSchema = enumOf(LIP_RATIOS);
export type LipRatio = z.infer<typeof lipRatioSchema>;

export const MOUTH_WIDTHS = ['narrow', 'medium', 'wide'] as const;
export const mouthWidthSchema = enumOf(MOUTH_WIDTHS);
export type MouthWidth = z.infer<typeof mouthWidthSchema>;

export const VERMILION_HEIGHTS = ['thin', 'medium', 'tall'] as const;
export const vermilionHeightSchema = enumOf(VERMILION_HEIGHTS);
export type VermilionHeight = z.infer<typeof vermilionHeightSchema>;

export const PHILTRUM_LENGTHS = ['short', 'medium', 'long'] as const;
export const philtrumLengthSchema = enumOf(PHILTRUM_LENGTHS);
export type PhiltrumLength = z.infer<typeof philtrumLengthSchema>;

export const PHILTRUM_DEPTHS = ['shallow', 'medium', 'deep'] as const;
export const philtrumDepthSchema = enumOf(PHILTRUM_DEPTHS);
export type PhiltrumDepth = z.infer<typeof philtrumDepthSchema>;

export const CUPIDS_BOWS = ['sharp', 'rounded', 'flat'] as const;
export const cupidsBowSchema = enumOf(CUPIDS_BOWS);
export type CupidsBow = z.infer<typeof cupidsBowSchema>;

export const MOUTH_CORNERS = ['downturned', 'neutral', 'upturned'] as const;
export const mouthCornersSchema = enumOf(MOUTH_CORNERS);
export type MouthCorners = z.infer<typeof mouthCornersSchema>;

export const LIP_PROJECTIONS = ['flat', 'medium', 'protruding'] as const;
export const lipProjectionSchema = enumOf(LIP_PROJECTIONS);
export type LipProjection = z.infer<typeof lipProjectionSchema>;

export const RESTING_MOUTHS = ['closed', 'slightly-parted', 'open'] as const;
export const restingMouthSchema = enumOf(RESTING_MOUTHS);
export type RestingMouth = z.infer<typeof restingMouthSchema>;

/* ───────────────────────────── Cheeks & midface ───────────────────────────── */

export const CHEEK_FULLNESSES = ['gaunt', 'flat', 'full'] as const;
export const cheekFullnessSchema = enumOf(CHEEK_FULLNESSES);
export type CheekFullness = z.infer<typeof cheekFullnessSchema>;

export const CHEEKBONE_HEIGHTS = ['low', 'medium', 'high'] as const;
export const cheekboneHeightSchema = enumOf(CHEEKBONE_HEIGHTS);
export type CheekboneHeight = z.infer<typeof cheekboneHeightSchema>;

export const CHEEKBONE_WIDTHS = ['narrow', 'medium', 'wide'] as const;
export const cheekboneWidthSchema = enumOf(CHEEKBONE_WIDTHS);
export type CheekboneWidth = z.infer<typeof cheekboneWidthSchema>;

export const CHEEKBONE_PROJECTIONS = ['flat', 'moderate', 'prominent'] as const;
export const cheekboneProjectionSchema = enumOf(CHEEKBONE_PROJECTIONS);
export type CheekboneProjection = z.infer<typeof cheekboneProjectionSchema>;

export const SUBMALAR_HOLLOWS = ['filled', 'moderate', 'hollow'] as const;
export const submalarHollowSchema = enumOf(SUBMALAR_HOLLOWS);
export type SubmalarHollow = z.infer<typeof submalarHollowSchema>;

export const NASOLABIAL_FOLDS = ['faint', 'moderate', 'deep'] as const;
export const nasolabialFoldSchema = enumOf(NASOLABIAL_FOLDS);
export type NasolabialFold = z.infer<typeof nasolabialFoldSchema>;

export const MIDFACE_PROJECTIONS = ['flat', 'medium', 'forward'] as const;
export const midfaceProjectionSchema = enumOf(MIDFACE_PROJECTIONS);
export type MidfaceProjection = z.infer<typeof midfaceProjectionSchema>;

export const MIDFACE_LENGTHS = ['short', 'medium', 'long'] as const;
export const midfaceLengthSchema = enumOf(MIDFACE_LENGTHS);
export type MidfaceLength = z.infer<typeof midfaceLengthSchema>;

/* ────────────────────────────────── Ears ──────────────────────────────────── */

export const EAR_SIZES = ['small', 'medium', 'large'] as const;
export const earSizeSchema = enumOf(EAR_SIZES);
export type EarSize = z.infer<typeof earSizeSchema>;

export const EAR_PROTRUSIONS = ['flat', 'moderate', 'protruding'] as const;
export const earProtrusionSchema = enumOf(EAR_PROTRUSIONS);
export type EarProtrusion = z.infer<typeof earProtrusionSchema>;

export const EARLOBE_TYPES = ['attached', 'free'] as const;
export const earlobeTypeSchema = enumOf(EARLOBE_TYPES);
export type EarlobeType = z.infer<typeof earlobeTypeSchema>;

export const EAR_SHAPES = ['round', 'oval', 'square', 'pointed'] as const;
export const earShapeSchema = enumOf(EAR_SHAPES);
export type EarShape = z.infer<typeof earShapeSchema>;

export const DARWINS_TUBERCLES = ['absent', 'present'] as const;
export const darwinsTubercleSchema = enumOf(DARWINS_TUBERCLES);
export type DarwinsTubercle = z.infer<typeof darwinsTubercleSchema>;

/* ───────────────────────────── Jaw, chin & neck ───────────────────────────── */

export const JAW_WIDTHS = ['narrow', 'medium', 'wide'] as const;
export const jawWidthSchema = enumOf(JAW_WIDTHS);
export type JawWidth = z.infer<typeof jawWidthSchema>;

export const JAW_ANGLES = ['soft', 'moderate', 'sharp'] as const;
export const jawAngleSchema = enumOf(JAW_ANGLES);
export type JawAngle = z.infer<typeof jawAngleSchema>;

export const JAW_LENGTHS = ['short', 'medium', 'long'] as const;
export const jawLengthSchema = enumOf(JAW_LENGTHS);
export type JawLength = z.infer<typeof jawLengthSchema>;

export const JAW_DEFINITIONS = ['soft', 'defined'] as const;
export const jawDefinitionSchema = enumOf(JAW_DEFINITIONS);
export type JawDefinition = z.infer<typeof jawDefinitionSchema>;

export const SUBMENTAL_FULLNESSES = ['clean', 'slight', 'double-chin'] as const;
export const submentalFullnessSchema = enumOf(SUBMENTAL_FULLNESSES);
export type SubmentalFullness = z.infer<typeof submentalFullnessSchema>;

export const JOWLS = ['none', 'slight', 'developed'] as const;
export const jowlsSchema = enumOf(JOWLS);
export type Jowls = z.infer<typeof jowlsSchema>;

export const CHIN_PROJECTIONS = ['receding', 'neutral', 'prominent'] as const;
export const chinProjectionSchema = enumOf(CHIN_PROJECTIONS);
export type ChinProjection = z.infer<typeof chinProjectionSchema>;

export const CHIN_SHAPES = ['pointed', 'round', 'square', 'broad'] as const;
export const chinShapeSchema = enumOf(CHIN_SHAPES);
export type ChinShape = z.infer<typeof chinShapeSchema>;

export const CHIN_HEIGHTS = ['short', 'medium', 'long'] as const;
export const chinHeightSchema = enumOf(CHIN_HEIGHTS);
export type ChinHeight = z.infer<typeof chinHeightSchema>;

export const CHIN_CLEFTS = ['none', 'slight', 'pronounced'] as const;
export const chinCleftSchema = enumOf(CHIN_CLEFTS);
export type ChinCleft = z.infer<typeof chinCleftSchema>;

export const PROFILES = [
  'orthognathic', // flat, vertical
  'mild-prognathic',
  'prognathic', // jaws/teeth project forward
] as const;
export const profileSchema = enumOf(PROFILES);
export type Profile = z.infer<typeof profileSchema>;

export const NECK_THICKNESSES = ['slender', 'average', 'thick'] as const;
export const neckThicknessSchema = enumOf(NECK_THICKNESSES);
export type NeckThickness = z.infer<typeof neckThicknessSchema>;

export const ADAMS_APPLES = ['flat', 'slight', 'prominent'] as const;
export const adamsAppleSchema = enumOf(ADAMS_APPLES);
export type AdamsApple = z.infer<typeof adamsAppleSchema>;

/* ─────────────────────────── Teeth (if visible) ───────────────────────────── */

export const BITE_CLASSES = ['class-i', 'class-ii', 'class-iii'] as const;
export const biteClassSchema = enumOf(BITE_CLASSES);
export type BiteClass = z.infer<typeof biteClassSchema>;

export const TEETH_APPEARANCES = [
  'even',
  'gapped',
  'crowded',
  'prominent',
] as const;
export const teethAppearanceSchema = enumOf(TEETH_APPEARANCES);
export type TeethAppearance = z.infer<typeof teethAppearanceSchema>;

export const TOOTH_SIZES = ['small', 'medium', 'large'] as const;
export const toothSizeSchema = enumOf(TOOTH_SIZES);
export type ToothSize = z.infer<typeof toothSizeSchema>;

export const TOOTH_SHOWS = ['none', 'slight', 'prominent'] as const;
export const toothShowSchema = enumOf(TOOTH_SHOWS);
export type ToothShow = z.infer<typeof toothShowSchema>;

export const GUM_DISPLAYS = ['low', 'normal', 'gummy'] as const;
export const gumDisplaySchema = enumOf(GUM_DISPLAYS);
export type GumDisplay = z.infer<typeof gumDisplaySchema>;

export const TEETH_COLORS = ['bright', 'natural', 'yellowed'] as const;
export const teethColorSchema = enumOf(TEETH_COLORS);
export type TeethColor = z.infer<typeof teethColorSchema>;

/* ───────────────────────────────── Skin ───────────────────────────────────── */

export const SKIN_TONES = [
  'very-fair',
  'fair',
  'light',
  'medium',
  'tan',
  'brown',
  'dark-brown',
  'deep',
] as const;
export const skinToneSchema = enumOf(SKIN_TONES);
export type SkinTone = z.infer<typeof skinToneSchema>;

export const SKIN_UNDERTONES = ['cool', 'neutral', 'warm', 'olive'] as const;
export const skinUndertoneSchema = enumOf(SKIN_UNDERTONES);
export type SkinUndertone = z.infer<typeof skinUndertoneSchema>;

export const SKIN_TEXTURES = ['smooth', 'normal', 'coarse', 'porous'] as const;
export const skinTextureSchema = enumOf(SKIN_TEXTURES);
export type SkinTexture = z.infer<typeof skinTextureSchema>;

export const PORE_VISIBILITIES = ['fine', 'moderate', 'large'] as const;
export const poreVisibilitySchema = enumOf(PORE_VISIBILITIES);
export type PoreVisibility = z.infer<typeof poreVisibilitySchema>;

export const SKIN_SURFACES = ['matte', 'normal', 'oily', 'dry'] as const;
export const skinSurfaceSchema = enumOf(SKIN_SURFACES);
export type SkinSurface = z.infer<typeof skinSurfaceSchema>;

export const PIGMENTATION_VARIATIONS = [
  'even',
  'freckled',
  'vitiligo',
  'melasma',
  'uneven',
] as const;
export const pigmentationVariationSchema = enumOf(PIGMENTATION_VARIATIONS);
export type PigmentationVariation = z.infer<typeof pigmentationVariationSchema>;

/** Overall degree of skin aging; `wrinkleAreas` says where it concentrates. */
export const WRINKLE_LEVELS = [
  'none',
  'fine-lines',
  'moderate',
  'deep',
] as const;
export const wrinkleLevelSchema = enumOf(WRINKLE_LEVELS);
export type WrinkleLevel = z.infer<typeof wrinkleLevelSchema>;

export const WRINKLE_AREAS = [
  'forehead',
  'glabella', // frown lines between the brows
  'crows-feet',
  'nasolabial',
  'marionette',
  'under-eye',
  'neck',
] as const;
export const wrinkleAreaSchema = enumOf(WRINKLE_AREAS);
export type WrinkleArea = z.infer<typeof wrinkleAreaSchema>;

export const SKIN_MARKS = [
  'freckles',
  'moles',
  'beauty-mark',
  'birthmark',
  'age-spots',
  'scars',
  'acne-scarring',
  'dimples',
  'rosacea',
  'visible-capillaries',
] as const;
export const skinMarkSchema = enumOf(SKIN_MARKS);
export type SkinMark = z.infer<typeof skinMarkSchema>;

/* ───────────────────────────────── Hair ───────────────────────────────────── */

export const HAIR_TEXTURES = ['straight', 'wavy', 'curly', 'coily'] as const;
export const hairTextureSchema = enumOf(HAIR_TEXTURES);
export type HairTexture = z.infer<typeof hairTextureSchema>;

export const HAIR_COLORS = [
  'black',
  'dark-brown',
  'brown',
  'light-brown',
  'blonde',
  'red',
  'auburn',
  'grey',
  'white',
  'salt-and-pepper',
] as const;
export const hairColorSchema = enumOf(HAIR_COLORS);
export type HairColor = z.infer<typeof hairColorSchema>;

export const HAIR_DENSITIES = ['thin', 'medium', 'thick'] as const;
export const hairDensitySchema = enumOf(HAIR_DENSITIES);
export type HairDensity = z.infer<typeof hairDensitySchema>;

export const STRAND_THICKNESSES = ['fine', 'medium', 'coarse'] as const;
export const strandThicknessSchema = enumOf(STRAND_THICKNESSES);
export type StrandThickness = z.infer<typeof strandThicknessSchema>;

export const HAIRLINES = [
  'straight',
  'rounded',
  'widows-peak',
  'm-shaped',
  'receding',
] as const;
export const hairlineSchema = enumOf(HAIRLINES);
export type Hairline = z.infer<typeof hairlineSchema>;

export const BALDING_PATTERNS = [
  'none',
  'temple-recession',
  'crown-thinning',
  'norwood-advanced',
  'diffuse-thinning',
] as const;
export const baldingPatternSchema = enumOf(BALDING_PATTERNS);
export type BaldingPattern = z.infer<typeof baldingPatternSchema>;

export const GREYING_LEVELS = [
  'none',
  'temples',
  'salt-and-pepper',
  'full',
] as const;
export const greyingLevelSchema = enumOf(GREYING_LEVELS);
export type GreyingLevel = z.infer<typeof greyingLevelSchema>;

export const FACIAL_HAIR_STYLES = [
  'clean-shaven',
  'stubble',
  'moustache',
  'goatee',
  'short-beard',
  'full-beard',
] as const;
export const facialHairStyleSchema = enumOf(FACIAL_HAIR_STYLES);
export type FacialHairStyle = z.infer<typeof facialHairStyleSchema>;

export const FACIAL_HAIR_DENSITIES = ['patchy', 'medium', 'full'] as const;
export const facialHairDensitySchema = enumOf(FACIAL_HAIR_DENSITIES);
export type FacialHairDensity = z.infer<typeof facialHairDensitySchema>;

/* ──────────────────────── Demographics & framing ──────────────────────────── */

export const SEXES = ['female', 'male', 'androgynous'] as const;
export const sexSchema = enumOf(SEXES);
export type Sex = z.infer<typeof sexSchema>;

export const AGE_BANDS = [
  'child',
  'teen',
  'twenties',
  'thirties',
  'forties',
  'fifties',
  'sixties',
  'seventies-plus',
] as const;
export const ageBandSchema = enumOf(AGE_BANDS);
export type AgeBand = z.infer<typeof ageBandSchema>;

/**
 * Broad geographic-ancestry pools, used ONLY to steer the casting range — a
 * tendency, never a rule (see `face-variation-reference.md`, Part 8). Any feature
 * above can appear with any ancestry; `mixed` is first-class. A finer
 * sub-population (e.g. "Korean", "Southern Chinese") goes in `ancestryNote`.
 */
export const ANCESTRIES = [
  'sub-saharan-african',
  'north-african',
  'middle-eastern',
  'european',
  'east-asian',
  'southeast-asian',
  'south-asian',
  'central-asian',
  'indigenous-american',
  'pacific-islander',
  'mixed',
] as const;
export const ancestrySchema = enumOf(ANCESTRIES);
export type Ancestry = z.infer<typeof ancestrySchema>;

export const BUILDS = ['slim', 'average', 'athletic', 'heavy'] as const;
export const buildSchema = enumOf(BUILDS);
export type Build = z.infer<typeof buildSchema>;

export const ASYMMETRY_LEVELS = ['none', 'subtle', 'moderate'] as const;
export const asymmetryLevelSchema = enumOf(ASYMMETRY_LEVELS);
export type AsymmetryLevel = z.infer<typeof asymmetryLevelSchema>;

/** Which feature carries the face's signature asymmetry. */
export const ASYMMETRY_FEATURES = [
  'eyes',
  'brows',
  'nose',
  'mouth',
  'jaw',
  'ears',
] as const;
export const asymmetryFeatureSchema = enumOf(ASYMMETRY_FEATURES);
export type AsymmetryFeature = z.infer<typeof asymmetryFeatureSchema>;

export const DIMPLES = ['none', 'cheek', 'chin', 'both'] as const;
export const dimpleSchema = enumOf(DIMPLES);
export type Dimple = z.infer<typeof dimpleSchema>;

/* ──────────────────────────────── FaceSpec ────────────────────────────────── */

/**
 * The full, comprehensive FaceSpec. Every field is optional: specify what you
 * care about and leave the rest to be cast by the API. `ageYears` and `ageBand`
 * may both be set; `ageYears` wins when they conflict.
 */
export const faceSpecSchema = z
  .object({
    // Bone / cranial structure
    cranialShape: cranialShapeSchema.optional(),
    skullHeight: skullHeightSchema.optional(),
    temporalWidth: temporalWidthSchema.optional(),
    headSize: headSizeSchema.optional(),
    faceShape: faceShapeSchema.optional(),
    facialProportion: facialProportionSchema.optional(),
    dominantThird: dominantThirdSchema.optional(),
    foreheadHeight: foreheadHeightSchema.optional(),
    foreheadSlope: foreheadSlopeSchema.optional(),
    foreheadBreadth: foreheadBreadthSchema.optional(),
    frontalBossing: frontalBossingSchema.optional(),
    browRidge: browRidgeSchema.optional(),
    glabella: glabellaSchema.optional(),

    // Eyes
    eyeSize: eyeSizeSchema.optional(),
    eyeSpacing: eyeSpacingSchema.optional(),
    orbitalDepth: orbitalDepthSchema.optional(),
    eyeShape: eyeShapeSchema.optional(),
    canthalTilt: canthalTiltSchema.optional(),
    lidType: lidTypeSchema.optional(),
    lidCrease: lidCreaseSchema.optional(),
    lidFoldHeight: lidFoldHeightSchema.optional(),
    epicanthicFold: epicanthicFoldSchema.optional(),
    tearTrough: tearTroughSchema.optional(),
    scleralShow: scleralShowSchema.optional(),
    lashLength: lashLengthSchema.optional(),
    lashDensity: lashDensitySchema.optional(),
    irisColor: irisColorSchema.optional(),
    heterochromia: heterochromiaSchema.optional(),
    limbalRing: limbalRingSchema.optional(),

    // Eyebrows
    browThickness: browThicknessSchema.optional(),
    browShape: browShapeSchema.optional(),
    browArch: browArchSchema.optional(),
    browHeight: browHeightSchema.optional(),
    browDensity: browDensitySchema.optional(),
    interBrowDistance: interBrowDistanceSchema.optional(),
    browColor: hairColorSchema.optional(),

    // Nose
    noseSize: noseSizeSchema.optional(),
    noseLength: noseLengthSchema.optional(),
    nasalRoot: nasalRootSchema.optional(),
    noseBridge: noseBridgeSchema.optional(),
    noseBridgeHeight: noseBridgeHeightSchema.optional(),
    noseBridgeWidth: noseBridgeWidthSchema.optional(),
    noseWidth: noseWidthSchema.optional(),
    noseTip: noseTipSchema.optional(),
    noseTipProjection: noseTipProjectionSchema.optional(),
    noseTipRotation: noseTipRotationSchema.optional(),
    nostrils: nostrilShapeSchema.optional(),
    alarBaseWidth: alarBaseWidthSchema.optional(),
    columella: columellaSchema.optional(),
    nasalIndex: nasalIndexSchema.optional(),

    // Mouth & lips
    lipFullness: lipFullnessSchema.optional(),
    lipRatio: lipRatioSchema.optional(),
    mouthWidth: mouthWidthSchema.optional(),
    vermilionHeight: vermilionHeightSchema.optional(),
    philtrumLength: philtrumLengthSchema.optional(),
    philtrumDepth: philtrumDepthSchema.optional(),
    cupidsBow: cupidsBowSchema.optional(),
    mouthCorners: mouthCornersSchema.optional(),
    lipProjection: lipProjectionSchema.optional(),
    restingMouth: restingMouthSchema.optional(),

    // Cheeks & midface
    cheekFullness: cheekFullnessSchema.optional(),
    cheekboneHeight: cheekboneHeightSchema.optional(),
    cheekboneWidth: cheekboneWidthSchema.optional(),
    cheekboneProjection: cheekboneProjectionSchema.optional(),
    submalarHollow: submalarHollowSchema.optional(),
    nasolabialFold: nasolabialFoldSchema.optional(),
    midfaceProjection: midfaceProjectionSchema.optional(),
    midfaceLength: midfaceLengthSchema.optional(),

    // Ears
    earSize: earSizeSchema.optional(),
    earProtrusion: earProtrusionSchema.optional(),
    earlobe: earlobeTypeSchema.optional(),
    earShape: earShapeSchema.optional(),
    darwinsTubercle: darwinsTubercleSchema.optional(),

    // Jaw, chin & neck
    jawWidth: jawWidthSchema.optional(),
    jawAngle: jawAngleSchema.optional(),
    jawLength: jawLengthSchema.optional(),
    jawDefinition: jawDefinitionSchema.optional(),
    submentalFullness: submentalFullnessSchema.optional(),
    jowls: jowlsSchema.optional(),
    chinProjection: chinProjectionSchema.optional(),
    chinShape: chinShapeSchema.optional(),
    chinHeight: chinHeightSchema.optional(),
    chinCleft: chinCleftSchema.optional(),
    profile: profileSchema.optional(),
    neckThickness: neckThicknessSchema.optional(),
    adamsApple: adamsAppleSchema.optional(),

    // Teeth
    biteClass: biteClassSchema.optional(),
    teeth: teethAppearanceSchema.optional(),
    toothSize: toothSizeSchema.optional(),
    toothShow: toothShowSchema.optional(),
    gumDisplay: gumDisplaySchema.optional(),
    teethColor: teethColorSchema.optional(),

    // Skin
    skinTone: skinToneSchema.optional(),
    skinUndertone: skinUndertoneSchema.optional(),
    skinTexture: skinTextureSchema.optional(),
    poreVisibility: poreVisibilitySchema.optional(),
    skinSurface: skinSurfaceSchema.optional(),
    pigmentation: pigmentationVariationSchema.optional(),
    wrinkleLevel: wrinkleLevelSchema.optional(),
    wrinkleAreas: z.array(wrinkleAreaSchema).max(7).optional(),
    skinMarks: z.array(skinMarkSchema).max(10).optional(),

    // Hair
    hairTexture: hairTextureSchema.optional(),
    hairColor: hairColorSchema.optional(),
    hairDensity: hairDensitySchema.optional(),
    strandThickness: strandThicknessSchema.optional(),
    hairline: hairlineSchema.optional(),
    balding: baldingPatternSchema.optional(),
    greying: greyingLevelSchema.optional(),
    hairStyle: z.string().trim().max(200).optional(),
    facialHair: facialHairStyleSchema.optional(),
    facialHairDensity: facialHairDensitySchema.optional(),
    facialHairColor: hairColorSchema.optional(),

    // Demographics & framing
    sex: sexSchema.optional(),
    ageBand: ageBandSchema.optional(),
    ageYears: z.number().int().min(1).max(120).optional(),
    ancestry: ancestrySchema.optional(),
    ancestryNote: z.string().trim().max(200).optional(),
    build: buildSchema.optional(),

    // Individuating detail
    asymmetry: asymmetryLevelSchema.optional(),
    asymmetryFeature: asymmetryFeatureSchema.optional(),
    dimples: dimpleSchema.optional(),
    distinguishingMark: z.string().trim().max(300).optional(),

    // Anything the menus don't cover
    extraNotes: z.string().trim().max(2000).optional(),
  })
  .strict();

export type FaceSpec = z.infer<typeof faceSpecSchema>;

/** A completely empty spec is valid (the API casts everything). */
export const EMPTY_FACE_SPEC: FaceSpec = {};

/**
 * The enum-valued FaceSpec fields that the casting engine draws from, each paired
 * with its allowed values. Free-text and numeric fields (`hairStyle`, `ageYears`,
 * `ancestryNote`, `distinguishingMark`, `extraNotes`) and multi-select arrays
 * (`skinMarks`, `wrinkleAreas`) are handled separately by the caster.
 */
export const FACE_FEATURE_VALUES = {
  cranialShape: CRANIAL_SHAPES,
  skullHeight: SKULL_HEIGHTS,
  temporalWidth: TEMPORAL_WIDTHS,
  headSize: HEAD_SIZES,
  faceShape: FACE_SHAPES,
  facialProportion: FACIAL_PROPORTIONS,
  dominantThird: DOMINANT_THIRDS,
  foreheadHeight: FOREHEAD_HEIGHTS,
  foreheadSlope: FOREHEAD_SLOPES,
  foreheadBreadth: FOREHEAD_BREADTHS,
  frontalBossing: FRONTAL_BOSSINGS,
  browRidge: BROW_RIDGES,
  glabella: GLABELLAS,
  eyeSize: EYE_SIZES,
  eyeSpacing: EYE_SPACINGS,
  orbitalDepth: ORBITAL_DEPTHS,
  eyeShape: EYE_SHAPES,
  canthalTilt: CANTHAL_TILTS,
  lidType: LID_TYPES,
  lidCrease: LID_CREASES,
  lidFoldHeight: LID_FOLD_HEIGHTS,
  epicanthicFold: EPICANTHIC_FOLDS,
  tearTrough: TEAR_TROUGHS,
  scleralShow: SCLERAL_SHOWS,
  lashLength: LASH_LENGTHS,
  lashDensity: LASH_DENSITIES,
  irisColor: IRIS_COLORS,
  heterochromia: HETEROCHROMIAS,
  limbalRing: LIMBAL_RINGS,
  browThickness: BROW_THICKNESSES,
  browShape: BROW_SHAPES,
  browArch: BROW_ARCHES,
  browHeight: BROW_HEIGHTS,
  browDensity: BROW_DENSITIES,
  interBrowDistance: INTER_BROW_DISTANCES,
  browColor: HAIR_COLORS,
  noseSize: NOSE_SIZES,
  noseLength: NOSE_LENGTHS,
  nasalRoot: NASAL_ROOTS,
  noseBridge: NOSE_BRIDGES,
  noseBridgeHeight: NOSE_BRIDGE_HEIGHTS,
  noseBridgeWidth: NOSE_BRIDGE_WIDTHS,
  noseWidth: NOSE_WIDTHS,
  noseTip: NOSE_TIPS,
  noseTipProjection: NOSE_TIP_PROJECTIONS,
  noseTipRotation: NOSE_TIP_ROTATIONS,
  nostrils: NOSTRIL_SHAPES,
  alarBaseWidth: ALAR_BASE_WIDTHS,
  columella: COLUMELLAS,
  nasalIndex: NASAL_INDICES,
  lipFullness: LIP_FULLNESSES,
  lipRatio: LIP_RATIOS,
  mouthWidth: MOUTH_WIDTHS,
  vermilionHeight: VERMILION_HEIGHTS,
  philtrumLength: PHILTRUM_LENGTHS,
  philtrumDepth: PHILTRUM_DEPTHS,
  cupidsBow: CUPIDS_BOWS,
  mouthCorners: MOUTH_CORNERS,
  lipProjection: LIP_PROJECTIONS,
  restingMouth: RESTING_MOUTHS,
  cheekFullness: CHEEK_FULLNESSES,
  cheekboneHeight: CHEEKBONE_HEIGHTS,
  cheekboneWidth: CHEEKBONE_WIDTHS,
  cheekboneProjection: CHEEKBONE_PROJECTIONS,
  submalarHollow: SUBMALAR_HOLLOWS,
  nasolabialFold: NASOLABIAL_FOLDS,
  midfaceProjection: MIDFACE_PROJECTIONS,
  midfaceLength: MIDFACE_LENGTHS,
  earSize: EAR_SIZES,
  earProtrusion: EAR_PROTRUSIONS,
  earlobe: EARLOBE_TYPES,
  earShape: EAR_SHAPES,
  darwinsTubercle: DARWINS_TUBERCLES,
  jawWidth: JAW_WIDTHS,
  jawAngle: JAW_ANGLES,
  jawLength: JAW_LENGTHS,
  jawDefinition: JAW_DEFINITIONS,
  submentalFullness: SUBMENTAL_FULLNESSES,
  jowls: JOWLS,
  chinProjection: CHIN_PROJECTIONS,
  chinShape: CHIN_SHAPES,
  chinHeight: CHIN_HEIGHTS,
  chinCleft: CHIN_CLEFTS,
  profile: PROFILES,
  neckThickness: NECK_THICKNESSES,
  adamsApple: ADAMS_APPLES,
  biteClass: BITE_CLASSES,
  teeth: TEETH_APPEARANCES,
  toothSize: TOOTH_SIZES,
  toothShow: TOOTH_SHOWS,
  gumDisplay: GUM_DISPLAYS,
  teethColor: TEETH_COLORS,
  skinTone: SKIN_TONES,
  skinUndertone: SKIN_UNDERTONES,
  skinTexture: SKIN_TEXTURES,
  poreVisibility: PORE_VISIBILITIES,
  skinSurface: SKIN_SURFACES,
  pigmentation: PIGMENTATION_VARIATIONS,
  wrinkleLevel: WRINKLE_LEVELS,
  hairTexture: HAIR_TEXTURES,
  hairColor: HAIR_COLORS,
  hairDensity: HAIR_DENSITIES,
  strandThickness: STRAND_THICKNESSES,
  hairline: HAIRLINES,
  balding: BALDING_PATTERNS,
  greying: GREYING_LEVELS,
  facialHair: FACIAL_HAIR_STYLES,
  facialHairDensity: FACIAL_HAIR_DENSITIES,
  facialHairColor: HAIR_COLORS,
  sex: SEXES,
  ageBand: AGE_BANDS,
  ancestry: ANCESTRIES,
  build: BUILDS,
  asymmetry: ASYMMETRY_LEVELS,
  asymmetryFeature: ASYMMETRY_FEATURES,
  dimples: DIMPLES,
} as const satisfies Partial<Record<keyof FaceSpec, readonly string[]>>;

/** The enum FaceSpec fields the caster fills (keys of {@link FACE_FEATURE_VALUES}). */
export type FaceFeatureKey = keyof typeof FACE_FEATURE_VALUES;

/**
 * The non-enum FaceSpec fields (free text, numbers, multi-select arrays) that the
 * {@link FACE_FEATURE_VALUES} map doesn't cover. Kept alongside it so a sanitizer
 * knows which extra keys are legitimate.
 */
const FACE_FREEFORM_KEYS = [
  'hairStyle',
  'ageYears',
  'ancestryNote',
  'distinguishingMark',
  'extraNotes',
  'wrinkleAreas',
  'skinMarks',
] as const satisfies readonly (keyof FaceSpec)[];

/**
 * Coerce an untrusted object (e.g. an LLM's "describe → spec" output) into a VALID
 * partial FaceSpec. Enum traits are kept only when their value is in the allowed
 * vocabulary; free-text / numeric / array traits are passed through to the strict
 * schema (which drops them if malformed). Anything else is discarded. Never throws —
 * returns `{}` when nothing usable survives.
 */
export function sanitizeFaceSpec(raw: unknown): FaceSpec {
  if (!raw || typeof raw !== 'object') return {};
  const input = raw as Record<string, unknown>;
  const candidate: Record<string, unknown> = {};

  // Enum traits: keep only values the vocabulary allows.
  for (const [trait, allowed] of Object.entries(FACE_FEATURE_VALUES)) {
    const v = input[trait];
    if (typeof v === 'string' && (allowed as readonly string[]).includes(v)) {
      candidate[trait] = v;
    }
  }
  // Free-form traits: validate each one on its own so a single malformed field
  // (e.g. an out-of-range ageYears) never discards the otherwise-good spec.
  for (const key of FACE_FREEFORM_KEYS) {
    if (input[key] === undefined) continue;
    if (faceSpecSchema.safeParse({ [key]: input[key] }).success) {
      candidate[key] = input[key];
    }
  }

  const parsed = faceSpecSchema.safeParse(candidate);
  return parsed.success ? parsed.data : {};
}

/**
 * Apply the female → no-facial-hair rule to a PARTIAL spec, so the editor and the
 * describe-to-spec result stay consistent with the caster (which already forces
 * `clean-shaven` for females at generation time). When `sex` is female, facial
 * hair is set to `clean-shaven` and its density is cleared. Returns a new object;
 * a non-female (or unset) sex is left untouched.
 */
export function applyFemaleFacialHairRule(spec: FaceSpec): FaceSpec {
  if (spec.sex !== 'female') return spec;
  const next: FaceSpec = { ...spec, facialHair: 'clean-shaven' };
  delete next.facialHairDensity;
  return next;
}
