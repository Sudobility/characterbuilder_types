import { z } from 'zod';

/**
 * The comprehensive FaceSpec: every major dial from `face-variation-reference.md`,
 * modeled as an independent, optional field so a user can specify as much or as
 * little as they like. `characterbuilder_lib`'s `composePrompt()` maps each set
 * field to a natural-language phrase; unset fields are simply left for the model
 * to decide (and are good candidates for randomization / casting variety).
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

export const BROW_RIDGES = ['flat', 'moderate', 'heavy'] as const;
export const browRidgeSchema = enumOf(BROW_RIDGES);
export type BrowRidge = z.infer<typeof browRidgeSchema>;

/* ───────────────────────────────── Eyes ───────────────────────────────────── */

export const EYE_SIZES = ['small', 'medium', 'large'] as const;
export const eyeSizeSchema = enumOf(EYE_SIZES);
export type EyeSize = z.infer<typeof eyeSizeSchema>;

export const EYE_SPACINGS = ['close-set', 'average', 'wide-set'] as const;
export const eyeSpacingSchema = enumOf(EYE_SPACINGS);
export type EyeSpacing = z.infer<typeof eyeSpacingSchema>;

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

export const LID_TYPES = [
  'double',
  'monolid',
  'hooded',
  'deep-set',
  'prominent',
] as const;
export const lidTypeSchema = enumOf(LID_TYPES);
export type LidType = z.infer<typeof lidTypeSchema>;

export const EPICANTHIC_FOLDS = ['none', 'slight', 'pronounced'] as const;
export const epicanthicFoldSchema = enumOf(EPICANTHIC_FOLDS);
export type EpicanthicFold = z.infer<typeof epicanthicFoldSchema>;

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

/* ───────────────────────────────── Nose ───────────────────────────────────── */

export const NOSE_SIZES = ['small', 'medium', 'large'] as const;
export const noseSizeSchema = enumOf(NOSE_SIZES);
export type NoseSize = z.infer<typeof noseSizeSchema>;

export const NOSE_LENGTHS = ['short', 'medium', 'long'] as const;
export const noseLengthSchema = enumOf(NOSE_LENGTHS);
export type NoseLength = z.infer<typeof noseLengthSchema>;

export const NOSE_BRIDGES = [
  'straight',
  'convex',
  'concave',
  'humped',
] as const;
export const noseBridgeSchema = enumOf(NOSE_BRIDGES);
export type NoseBridge = z.infer<typeof noseBridgeSchema>;

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

export const NOSTRIL_SHAPES = ['narrow', 'medium', 'flared'] as const;
export const nostrilShapeSchema = enumOf(NOSTRIL_SHAPES);
export type NostrilShape = z.infer<typeof nostrilShapeSchema>;

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

export const PHILTRUM_LENGTHS = ['short', 'medium', 'long'] as const;
export const philtrumLengthSchema = enumOf(PHILTRUM_LENGTHS);
export type PhiltrumLength = z.infer<typeof philtrumLengthSchema>;

export const CUPIDS_BOWS = ['sharp', 'rounded', 'flat'] as const;
export const cupidsBowSchema = enumOf(CUPIDS_BOWS);
export type CupidsBow = z.infer<typeof cupidsBowSchema>;

export const MOUTH_CORNERS = ['downturned', 'neutral', 'upturned'] as const;
export const mouthCornersSchema = enumOf(MOUTH_CORNERS);
export type MouthCorners = z.infer<typeof mouthCornersSchema>;

/* ───────────────────────────── Cheeks & ears ──────────────────────────────── */

export const CHEEK_FULLNESSES = ['gaunt', 'flat', 'full'] as const;
export const cheekFullnessSchema = enumOf(CHEEK_FULLNESSES);
export type CheekFullness = z.infer<typeof cheekFullnessSchema>;

export const CHEEKBONE_HEIGHTS = ['low', 'medium', 'high'] as const;
export const cheekboneHeightSchema = enumOf(CHEEKBONE_HEIGHTS);
export type CheekboneHeight = z.infer<typeof cheekboneHeightSchema>;

export const CHEEKBONE_PROJECTIONS = ['flat', 'moderate', 'prominent'] as const;
export const cheekboneProjectionSchema = enumOf(CHEEKBONE_PROJECTIONS);
export type CheekboneProjection = z.infer<typeof cheekboneProjectionSchema>;

export const EAR_SIZES = ['small', 'medium', 'large'] as const;
export const earSizeSchema = enumOf(EAR_SIZES);
export type EarSize = z.infer<typeof earSizeSchema>;

export const EAR_PROTRUSIONS = ['flat', 'moderate', 'protruding'] as const;
export const earProtrusionSchema = enumOf(EAR_PROTRUSIONS);
export type EarProtrusion = z.infer<typeof earProtrusionSchema>;

export const EARLOBE_TYPES = ['attached', 'free'] as const;
export const earlobeTypeSchema = enumOf(EARLOBE_TYPES);
export type EarlobeType = z.infer<typeof earlobeTypeSchema>;

/* ───────────────────────────── Jaw & chin ─────────────────────────────────── */

export const JAW_WIDTHS = ['narrow', 'medium', 'wide'] as const;
export const jawWidthSchema = enumOf(JAW_WIDTHS);
export type JawWidth = z.infer<typeof jawWidthSchema>;

export const JAW_ANGLES = ['soft', 'moderate', 'sharp'] as const;
export const jawAngleSchema = enumOf(JAW_ANGLES);
export type JawAngle = z.infer<typeof jawAngleSchema>;

export const JAW_DEFINITIONS = ['soft', 'defined'] as const;
export const jawDefinitionSchema = enumOf(JAW_DEFINITIONS);
export type JawDefinition = z.infer<typeof jawDefinitionSchema>;

export const CHIN_PROJECTIONS = ['receding', 'neutral', 'prominent'] as const;
export const chinProjectionSchema = enumOf(CHIN_PROJECTIONS);
export type ChinProjection = z.infer<typeof chinProjectionSchema>;

export const CHIN_SHAPES = ['pointed', 'round', 'square', 'broad'] as const;
export const chinShapeSchema = enumOf(CHIN_SHAPES);
export type ChinShape = z.infer<typeof chinShapeSchema>;

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

/* ─────────────────────────── Teeth (if smiling) ───────────────────────────── */

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

export const SKIN_MARKS = [
  'freckles',
  'moles',
  'beauty-mark',
  'birthmark',
  'age-spots',
  'scars',
  'acne-scarring',
  'dimples',
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

export const HAIRLINES = [
  'straight',
  'rounded',
  'widows-peak',
  'm-shaped',
  'receding',
] as const;
export const hairlineSchema = enumOf(HAIRLINES);
export type Hairline = z.infer<typeof hairlineSchema>;

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
 * above can appear with any ancestry; `mixed` is first-class.
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

/* ──────────────────────────────── FaceSpec ────────────────────────────────── */

/**
 * The full, comprehensive FaceSpec. Every field is optional: specify what you
 * care about and leave the rest for the model (or for randomization). `ageYears`
 * and `ageBand` may both be set; `ageYears` wins when they conflict.
 */
export const faceSpecSchema = z
  .object({
    // Bone / cranial structure
    cranialShape: cranialShapeSchema.optional(),
    faceShape: faceShapeSchema.optional(),
    facialProportion: facialProportionSchema.optional(),
    dominantThird: dominantThirdSchema.optional(),
    foreheadHeight: foreheadHeightSchema.optional(),
    foreheadSlope: foreheadSlopeSchema.optional(),
    browRidge: browRidgeSchema.optional(),

    // Eyes
    eyeSize: eyeSizeSchema.optional(),
    eyeSpacing: eyeSpacingSchema.optional(),
    eyeShape: eyeShapeSchema.optional(),
    canthalTilt: canthalTiltSchema.optional(),
    lidType: lidTypeSchema.optional(),
    epicanthicFold: epicanthicFoldSchema.optional(),
    irisColor: irisColorSchema.optional(),

    // Eyebrows
    browThickness: browThicknessSchema.optional(),
    browShape: browShapeSchema.optional(),
    browArch: browArchSchema.optional(),

    // Nose
    noseSize: noseSizeSchema.optional(),
    noseLength: noseLengthSchema.optional(),
    noseBridge: noseBridgeSchema.optional(),
    noseWidth: noseWidthSchema.optional(),
    noseTip: noseTipSchema.optional(),
    nostrils: nostrilShapeSchema.optional(),
    nasalIndex: nasalIndexSchema.optional(),

    // Mouth & lips
    lipFullness: lipFullnessSchema.optional(),
    lipRatio: lipRatioSchema.optional(),
    mouthWidth: mouthWidthSchema.optional(),
    philtrumLength: philtrumLengthSchema.optional(),
    cupidsBow: cupidsBowSchema.optional(),
    mouthCorners: mouthCornersSchema.optional(),

    // Cheeks & ears
    cheekFullness: cheekFullnessSchema.optional(),
    cheekboneHeight: cheekboneHeightSchema.optional(),
    cheekboneProjection: cheekboneProjectionSchema.optional(),
    earSize: earSizeSchema.optional(),
    earProtrusion: earProtrusionSchema.optional(),
    earlobe: earlobeTypeSchema.optional(),

    // Jaw & chin
    jawWidth: jawWidthSchema.optional(),
    jawAngle: jawAngleSchema.optional(),
    jawDefinition: jawDefinitionSchema.optional(),
    chinProjection: chinProjectionSchema.optional(),
    chinShape: chinShapeSchema.optional(),
    chinCleft: chinCleftSchema.optional(),
    profile: profileSchema.optional(),

    // Teeth
    biteClass: biteClassSchema.optional(),
    teeth: teethAppearanceSchema.optional(),

    // Skin
    skinTone: skinToneSchema.optional(),
    skinUndertone: skinUndertoneSchema.optional(),
    skinTexture: skinTextureSchema.optional(),
    skinMarks: z.array(skinMarkSchema).max(8).optional(),

    // Hair
    hairTexture: hairTextureSchema.optional(),
    hairColor: hairColorSchema.optional(),
    hairDensity: hairDensitySchema.optional(),
    hairline: hairlineSchema.optional(),
    greying: greyingLevelSchema.optional(),
    hairStyle: z.string().trim().max(200).optional(),
    facialHair: facialHairStyleSchema.optional(),

    // Demographics & framing
    sex: sexSchema.optional(),
    ageBand: ageBandSchema.optional(),
    ageYears: z.number().int().min(1).max(120).optional(),
    ancestry: ancestrySchema.optional(),
    ancestryNote: z.string().trim().max(200).optional(),
    build: buildSchema.optional(),

    // Individuating detail
    asymmetry: asymmetryLevelSchema.optional(),
    distinguishingMark: z.string().trim().max(300).optional(),

    // Anything the menus don't cover
    extraNotes: z.string().trim().max(2000).optional(),
  })
  .strict();

export type FaceSpec = z.infer<typeof faceSpecSchema>;

/** A completely empty spec is valid (the model decides everything). */
export const EMPTY_FACE_SPEC: FaceSpec = {};
