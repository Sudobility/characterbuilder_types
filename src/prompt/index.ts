import { type FaceSpec, HAIR_COLORS } from '../face/index.js';
import type {
  Expression,
  GenerationParams,
  Shot,
} from '../generation/index.js';

/**
 * Pure prompt composition: FaceSpec (+ generation params) -> a natural-language
 * image prompt. Dependency-free and deterministic.
 *
 * NOTE: with the two-stage ShapeShyft pipeline, the AUTHORITATIVE prose prompt is
 * written by the `character-prompt` text endpoint from the complete cast spec.
 * This function is the FRONTEND's instant local PREVIEW — it approximates that
 * prose so the editor can show a prompt without a round-trip. It intentionally
 * omits unremarkable ("neutral") values to stay readable; the real pipeline sends
 * every field. The phrase tables echo the vocabulary of
 * `writings-chimps/prompts/face-variation-reference.md`.
 */

type Phrase<K extends string> = Record<K, string>;

const ANCESTRY_ADJ: Phrase<string> = {
  'sub-saharan-african': 'Sub-Saharan African',
  'north-african': 'North African',
  'middle-eastern': 'Middle Eastern',
  european: 'European',
  'east-asian': 'East Asian',
  'southeast-asian': 'Southeast Asian',
  'south-asian': 'South Asian',
  'central-asian': 'Central Asian',
  'indigenous-american': 'Indigenous American',
  'pacific-islander': 'Pacific Islander',
  mixed: 'mixed-ancestry',
};

/** Decade bands render as "<noun> in <poss> <decade>"; child/teen replace the noun. */
const AGE_DECADE: Phrase<string> = {
  twenties: 'twenties',
  thirties: 'thirties',
  forties: 'forties',
  fifties: 'fifties',
  sixties: 'sixties',
  'seventies-plus': 'seventies or older',
};

const SEX_NOUN: Phrase<string> = {
  female: 'woman',
  male: 'man',
  androgynous: 'androgynous person',
};

const SHOT_PHRASE: Record<Shot, string> = {
  headshot: 'head-and-shoulders headshot',
  bust: 'head-and-chest portrait',
  'three-quarter': 'three-quarter-length portrait',
  'full-length': 'full-length portrait',
};

const EXPRESSION_PHRASE: Record<Expression, string> = {
  neutral: 'a neutral expression',
  'slight-smile': 'a slight smile',
  smile: 'a warm smile',
  serious: 'a serious expression',
  surprised: 'a surprised expression',
  thoughtful: 'a thoughtful expression',
};

/** Build a {color: "<color> <suffix>"} phrase map from the shared hair palette. */
const colorPhrases = (suffix: string): Record<string, string> =>
  Object.fromEntries(
    HAIR_COLORS.map((c) => [c, `${c.replace(/-/g, ' ')} ${suffix}`])
  );

/**
 * Per-feature phrases. Keyed by the FaceSpec field, each a map from the enum
 * value to a clause that reads naturally after "with ...". A value mapped to the
 * empty string is treated as unremarkable and omitted from the preview.
 */
const FEATURE_PHRASES: {
  [K in keyof FaceSpec]?: Record<string, string>;
} = {
  // Bone / cranial structure
  cranialShape: {
    dolichocephalic: 'a long, narrow head',
    mesocephalic: 'a medium-proportioned head',
    brachycephalic: 'a short, broad head',
    hyperbrachycephalic: 'a very broad, round head',
  },
  skullHeight: {
    low: 'a low-vaulted skull',
    medium: '',
    tall: 'a tall, high-vaulted skull',
  },
  temporalWidth: {
    narrow: 'narrow temples',
    average: '',
    wide: 'broad temples',
  },
  headSize: {
    small: 'a small head',
    average: '',
    large: 'a large head',
  },
  faceShape: {
    oval: 'an oval face',
    round: 'a round face',
    square: 'a square face',
    rectangular: 'a long rectangular face',
    heart: 'a heart-shaped face',
    diamond: 'a diamond-shaped face',
    triangle: 'a triangular face with a wider jaw',
    trapezoid: 'a broad, strong-jawed face',
  },
  facialProportion: {
    euryprosopic: 'broad, short facial proportions',
    mesoprosopic: 'balanced facial proportions',
    leptoprosopic: 'long, narrow facial proportions',
  },
  dominantThird: {
    upper: 'a tall forehead dominating the upper face',
    middle: 'a long midface',
    lower: 'a long lower face',
    balanced: 'evenly balanced facial thirds',
  },
  foreheadHeight: {
    low: 'a low forehead',
    medium: 'a medium forehead',
    tall: 'a tall forehead',
  },
  foreheadSlope: {
    vertical: 'an upright forehead',
    slight: 'a slightly sloping forehead',
    sloping: 'a backward-sloping forehead',
  },
  foreheadBreadth: {
    narrow: 'a narrow forehead',
    medium: '',
    broad: 'a broad forehead',
  },
  frontalBossing: {
    flat: '',
    slight: 'slightly rounded frontal bossing',
    rounded: 'a rounded, protruding forehead',
  },
  browRidge: {
    flat: 'a flat, smooth brow ridge',
    moderate: 'a moderate brow ridge',
    heavy: 'a heavy, projecting brow ridge',
  },
  glabella: {
    flat: '',
    prominent: 'a prominent glabella between the brows',
  },
  // Eyebrows
  browThickness: {
    thin: 'thin eyebrows',
    medium: 'medium eyebrows',
    thick: 'thick eyebrows',
  },
  browShape: {
    straight: 'straight eyebrows',
    curved: 'softly curved eyebrows',
    angled: 'angled eyebrows',
    rounded: 'rounded eyebrows',
  },
  browArch: {
    flat: 'flat, unarched brows',
    low: 'a low brow arch',
    medium: 'a medium brow arch',
    high: 'a high brow arch',
  },
  browHeight: {
    low: 'low-set brows',
    medium: '',
    high: 'high-set brows',
  },
  browDensity: {
    sparse: 'sparse brows',
    medium: '',
    full: 'full, dense brows',
  },
  interBrowDistance: {
    unibrow: 'brows that nearly meet',
    narrow: 'closely spaced brows',
    average: '',
    wide: 'widely separated brows',
  },
  browColor: colorPhrases('eyebrows'),
  // Eyes
  eyeSize: {
    small: 'small eyes',
    medium: 'medium eyes',
    large: 'large eyes',
  },
  eyeSpacing: {
    'close-set': 'close-set eyes',
    average: 'averagely spaced eyes',
    'wide-set': 'wide-set eyes',
  },
  orbitalDepth: {
    shallow: 'shallow eye sockets with forward-sitting eyes',
    average: '',
    deep: 'deep-set eyes recessed under the brow',
  },
  eyeShape: {
    almond: 'almond-shaped eyes',
    round: 'round eyes',
    upturned: 'upturned eyes',
    downturned: 'downturned eyes',
    hooded: 'hooded eyes',
  },
  canthalTilt: {
    negative: 'a negative canthal tilt (outer corners lower)',
    neutral: 'a neutral canthal tilt',
    positive: 'a positive canthal tilt (outer corners higher)',
  },
  lidType: {
    double: 'double eyelids with a visible crease',
    monolid: 'monolids with no visible crease',
    hooded: 'hooded eyelids',
    'deep-set': 'deep-set eyes',
    prominent: 'prominent, forward-set eyes',
  },
  lidCrease: {
    none: 'no upper-lid crease',
    single: 'a single upper-lid crease',
    double: 'a double upper-lid crease',
    triple: 'a triple upper-lid crease',
  },
  lidFoldHeight: {
    low: 'a low lid fold',
    medium: '',
    high: 'a high lid fold',
  },
  epicanthicFold: {
    none: 'no epicanthic fold',
    slight: 'a slight epicanthic fold',
    pronounced: 'a pronounced epicanthic fold',
  },
  tearTrough: {
    smooth: '',
    hollow: 'hollow tear troughs',
    puffy: 'puffy under-eyes',
  },
  scleralShow: {
    none: '',
    lower: 'slight lower scleral show',
    'upper-and-lower': 'pronounced scleral show',
  },
  lashLength: {
    short: 'short lashes',
    medium: '',
    long: 'long lashes',
  },
  lashDensity: {
    sparse: 'sparse lashes',
    medium: '',
    dense: 'thick, dense lashes',
  },
  irisColor: {
    'dark-brown': 'dark brown eyes',
    brown: 'brown eyes',
    amber: 'amber eyes',
    hazel: 'hazel eyes',
    green: 'green eyes',
    grey: 'grey eyes',
    blue: 'blue eyes',
  },
  heterochromia: {
    none: '',
    partial: 'partial heterochromia',
    complete: 'complete heterochromia (two differently colored eyes)',
  },
  limbalRing: {
    faint: '',
    medium: '',
    strong: 'strong dark limbal rings',
  },
  // Nose
  noseSize: {
    small: 'a small nose',
    medium: 'a medium nose',
    large: 'a large nose',
  },
  noseLength: {
    short: 'a short nose',
    medium: 'a medium-length nose',
    long: 'a long nose',
  },
  nasalRoot: {
    shallow: 'a shallow nasal root',
    medium: '',
    deep: 'a deep nasal root scooped between the brows',
  },
  noseBridge: {
    straight: 'a straight nasal bridge',
    convex: 'a convex (Roman) nasal bridge',
    concave: 'a concave, scooped nasal bridge',
    humped: 'a humped nasal bridge',
  },
  noseBridgeHeight: {
    low: 'a low nasal bridge',
    medium: '',
    high: 'a high nasal bridge',
  },
  noseBridgeWidth: {
    narrow: 'a narrow nasal bridge',
    medium: '',
    wide: 'a wide, flat nasal bridge',
  },
  noseWidth: {
    narrow: 'a narrow nose',
    medium: 'a medium-width nose',
    wide: 'a wide nose',
  },
  noseTip: {
    pointed: 'a pointed nose tip',
    rounded: 'a rounded nose tip',
    bulbous: 'a bulbous nose tip',
    boxy: 'a boxy nose tip',
    upturned: 'an upturned nose tip',
    drooping: 'a drooping nose tip',
  },
  noseTipProjection: {
    shallow: 'a tip that sits close to the face',
    medium: '',
    projecting: 'a strongly projecting nose tip',
  },
  noseTipRotation: {
    upturned: 'an upward-rotated (snub) nose tip',
    neutral: '',
    downturned: 'a downward-rotated nose tip',
  },
  nostrils: {
    narrow: 'narrow nostrils',
    medium: 'medium nostrils',
    flared: 'flared nostrils',
  },
  alarBaseWidth: {
    narrow: 'a narrow alar base',
    medium: '',
    wide: 'a wide alar base',
  },
  columella: {
    retracted: 'a retracted columella',
    neutral: '',
    hanging: 'a hanging columella',
  },
  nasalIndex: {
    leptorrhine: 'a long, narrow nose',
    mesorrhine: 'a medium-breadth nose',
    platyrrhine: 'a short, broad nose',
  },
  // Cheeks & midface
  cheekFullness: {
    gaunt: 'gaunt, hollow cheeks',
    flat: 'flat cheeks',
    full: 'full cheeks',
  },
  cheekboneHeight: {
    low: 'low cheekbones',
    medium: 'medium cheekbones',
    high: 'high cheekbones',
  },
  cheekboneWidth: {
    narrow: 'a narrow face across the cheekbones',
    medium: '',
    wide: 'wide, broad cheekbones',
  },
  cheekboneProjection: {
    flat: 'flat cheekbones',
    moderate: 'moderately projecting cheekbones',
    prominent: 'prominent cheekbones',
  },
  submalarHollow: {
    filled: '',
    moderate: '',
    hollow: 'sculpted hollows beneath the cheekbones',
  },
  nasolabialFold: {
    faint: '',
    moderate: 'moderate nasolabial folds',
    deep: 'deep nasolabial folds',
  },
  midfaceProjection: {
    flat: 'a flat midface',
    medium: '',
    forward: 'a forward-projecting midface',
  },
  midfaceLength: {
    short: 'a short midface',
    medium: '',
    long: 'a long midface',
  },
  // Mouth & lips
  lipFullness: {
    thin: 'thin lips',
    medium: 'medium lips',
    full: 'full lips',
  },
  lipRatio: {
    balanced: 'balanced upper and lower lips',
    'fuller-upper': 'a fuller upper lip',
    'fuller-lower': 'a fuller lower lip',
  },
  mouthWidth: {
    narrow: 'a narrow mouth',
    medium: 'a medium mouth',
    wide: 'a wide mouth',
  },
  vermilionHeight: {
    thin: 'a thin vermilion margin',
    medium: '',
    tall: 'a tall, full vermilion',
  },
  philtrumLength: {
    short: 'a short philtrum',
    medium: 'a medium philtrum',
    long: 'a long philtrum',
  },
  philtrumDepth: {
    shallow: 'a shallow philtrum',
    medium: '',
    deep: 'a deeply ridged philtrum',
  },
  cupidsBow: {
    sharp: 'a sharply defined cupid’s bow',
    rounded: 'a rounded cupid’s bow',
    flat: 'a flat cupid’s bow',
  },
  mouthCorners: {
    downturned: 'downturned mouth corners',
    neutral: 'neutral mouth corners',
    upturned: 'upturned mouth corners',
  },
  lipProjection: {
    flat: '',
    medium: '',
    protruding: 'forward-projecting, pouting lips',
  },
  restingMouth: {
    closed: '',
    'slightly-parted': 'lips slightly parted at rest',
    open: 'an open resting mouth',
  },
  // Teeth
  biteClass: {
    'class-i': 'a normal bite',
    'class-ii': 'an overbite (Class II)',
    'class-iii': 'an underbite (Class III)',
  },
  teeth: {
    even: 'even teeth',
    gapped: 'gapped teeth',
    crowded: 'slightly crowded teeth',
    prominent: 'prominent front teeth',
  },
  toothSize: {
    small: 'small teeth',
    medium: '',
    large: 'large, broad teeth',
  },
  toothShow: {
    none: '',
    slight: 'a slight tooth show at rest',
    prominent: 'prominent tooth show at rest',
  },
  gumDisplay: {
    low: '',
    normal: '',
    gummy: 'a gummy smile',
  },
  teethColor: {
    bright: 'bright teeth',
    natural: '',
    yellowed: 'yellowed teeth',
  },
  // Jaw, chin & neck
  jawWidth: {
    narrow: 'a narrow jaw',
    medium: 'a medium jaw',
    wide: 'a wide jaw',
  },
  jawAngle: {
    soft: 'a soft, rounded jaw angle',
    moderate: 'a moderate jaw angle',
    sharp: 'a sharp, square jaw angle',
  },
  jawLength: {
    short: 'a short jaw',
    medium: '',
    long: 'a long jaw',
  },
  jawDefinition: {
    soft: 'a soft jawline',
    defined: 'a defined jawline',
  },
  submentalFullness: {
    clean: '',
    slight: 'slight fullness under the chin',
    'double-chin': 'a double chin',
  },
  jowls: {
    none: '',
    slight: 'slight jowls',
    developed: 'developed jowls',
  },
  chinProjection: {
    receding: 'a receding chin',
    neutral: 'a neutral chin',
    prominent: 'a prominent, projecting chin',
  },
  chinShape: {
    pointed: 'a pointed chin',
    round: 'a rounded chin',
    square: 'a square chin',
    broad: 'a broad chin',
  },
  chinHeight: {
    short: 'a short chin',
    medium: '',
    long: 'a long chin',
  },
  chinCleft: {
    none: 'no chin cleft',
    slight: 'a slight chin cleft',
    pronounced: 'a pronounced chin cleft',
  },
  profile: {
    orthognathic: 'a flat, orthognathic profile',
    'mild-prognathic': 'a mildly prognathic profile',
    prognathic: 'a prognathic profile with forward-projecting jaws',
  },
  neckThickness: {
    slender: 'a slender neck',
    average: '',
    thick: 'a thick neck',
  },
  adamsApple: {
    flat: '',
    slight: '',
    prominent: 'a prominent Adam’s apple',
  },
  // Ears
  earSize: {
    small: 'small ears',
    medium: 'medium ears',
    large: 'large ears',
  },
  earProtrusion: {
    flat: 'ears flat to the head',
    moderate: 'moderately protruding ears',
    protruding: 'protruding ears',
  },
  earlobe: {
    attached: 'attached earlobes',
    free: 'free, detached earlobes',
  },
  earShape: {
    round: 'round ears',
    oval: '',
    square: 'squarish ears',
    pointed: 'pointed ears',
  },
  darwinsTubercle: {
    absent: '',
    present: 'a Darwin’s tubercle on the ear',
  },
  // Skin
  skinTone: {
    'very-fair': 'very fair skin',
    fair: 'fair skin',
    light: 'light skin',
    medium: 'medium skin',
    tan: 'tan skin',
    brown: 'brown skin',
    'dark-brown': 'dark brown skin',
    deep: 'deep, dark skin',
  },
  skinUndertone: {
    cool: 'cool undertones',
    neutral: 'neutral undertones',
    warm: 'warm undertones',
    olive: 'olive undertones',
  },
  skinTexture: {
    smooth: 'smooth skin',
    normal: 'natural skin texture',
    coarse: 'coarse skin texture',
    porous: 'visibly porous skin',
  },
  poreVisibility: {
    fine: '',
    moderate: '',
    large: 'visibly large pores',
  },
  skinSurface: {
    matte: 'matte skin',
    normal: '',
    oily: 'oily, shiny skin',
    dry: 'dry, flaky skin',
  },
  pigmentation: {
    even: '',
    freckled: 'freckled skin',
    vitiligo: 'patches of vitiligo',
    melasma: 'melasma pigmentation',
    uneven: 'uneven skin tone',
  },
  wrinkleLevel: {
    none: '',
    'fine-lines': 'fine lines',
    moderate: 'moderate wrinkles',
    deep: 'deep wrinkles',
  },
  // Hair
  hairTexture: {
    straight: 'straight hair',
    wavy: 'wavy hair',
    curly: 'curly hair',
    coily: 'tightly coiled hair',
  },
  hairColor: {
    black: 'black hair',
    'dark-brown': 'dark brown hair',
    brown: 'brown hair',
    'light-brown': 'light brown hair',
    blonde: 'blonde hair',
    red: 'red hair',
    auburn: 'auburn hair',
    grey: 'grey hair',
    white: 'white hair',
    'salt-and-pepper': 'salt-and-pepper hair',
  },
  hairDensity: {
    thin: 'thin hair',
    medium: 'medium-density hair',
    thick: 'thick hair',
  },
  strandThickness: {
    fine: 'fine hair strands',
    medium: '',
    coarse: 'coarse hair strands',
  },
  hairline: {
    straight: 'a straight hairline',
    rounded: 'a rounded hairline',
    'widows-peak': 'a widow’s peak',
    'm-shaped': 'an M-shaped hairline',
    receding: 'a receding hairline',
  },
  balding: {
    none: '',
    'temple-recession': 'recession at the temples',
    'crown-thinning': 'thinning at the crown',
    'norwood-advanced': 'advanced male-pattern balding',
    'diffuse-thinning': 'diffuse thinning hair',
  },
  greying: {
    none: '',
    temples: 'greying at the temples',
    'salt-and-pepper': 'salt-and-pepper greying',
    full: 'fully grey hair',
  },
  facialHair: {
    'clean-shaven': 'clean-shaven',
    stubble: 'light stubble',
    moustache: 'a moustache',
    goatee: 'a goatee',
    'short-beard': 'a short beard',
    'full-beard': 'a full beard',
  },
  facialHairDensity: {
    patchy: 'patchy facial-hair growth',
    medium: '',
    full: 'dense facial-hair growth',
  },
  facialHairColor: colorPhrases('facial hair'),
  // Build & individuating
  build: {
    slim: 'a slim build',
    average: 'an average build',
    athletic: 'an athletic build',
    heavy: 'a heavier build',
  },
  asymmetry: {
    none: '',
    subtle: 'subtle, natural facial asymmetry',
    moderate: 'noticeable natural facial asymmetry',
  },
  asymmetryFeature: {
    eyes: 'most visible around the eyes',
    brows: 'most visible in the brows',
    nose: 'most visible in the nose',
    mouth: 'most visible around the mouth',
    jaw: 'most visible along the jaw',
    ears: 'most visible in the ears',
  },
  dimples: {
    none: '',
    cheek: 'cheek dimples',
    chin: 'a chin dimple',
    both: 'cheek dimples and a chin dimple',
  },
};

/** Order the clauses roughly head-to-chin for readability. */
const FEATURE_ORDER: (keyof FaceSpec)[] = [
  // Cranium
  'cranialShape',
  'skullHeight',
  'temporalWidth',
  'headSize',
  'faceShape',
  'facialProportion',
  'dominantThird',
  'foreheadHeight',
  'foreheadSlope',
  'foreheadBreadth',
  'frontalBossing',
  'browRidge',
  'glabella',
  // Eyebrows
  'browThickness',
  'browShape',
  'browArch',
  'browHeight',
  'browDensity',
  'interBrowDistance',
  'browColor',
  // Eyes
  'eyeSize',
  'eyeSpacing',
  'orbitalDepth',
  'eyeShape',
  'canthalTilt',
  'lidType',
  'lidCrease',
  'lidFoldHeight',
  'epicanthicFold',
  'tearTrough',
  'scleralShow',
  'lashLength',
  'lashDensity',
  'irisColor',
  'heterochromia',
  'limbalRing',
  // Nose
  'noseSize',
  'noseLength',
  'nasalRoot',
  'noseBridge',
  'noseBridgeHeight',
  'noseBridgeWidth',
  'noseWidth',
  'noseTip',
  'noseTipProjection',
  'noseTipRotation',
  'nostrils',
  'alarBaseWidth',
  'columella',
  'nasalIndex',
  // Cheeks & midface
  'cheekFullness',
  'cheekboneHeight',
  'cheekboneWidth',
  'cheekboneProjection',
  'submalarHollow',
  'nasolabialFold',
  'midfaceProjection',
  'midfaceLength',
  // Mouth & lips
  'lipFullness',
  'lipRatio',
  'mouthWidth',
  'vermilionHeight',
  'philtrumLength',
  'philtrumDepth',
  'cupidsBow',
  'mouthCorners',
  'lipProjection',
  'restingMouth',
  // Teeth
  'biteClass',
  'teeth',
  'toothSize',
  'toothShow',
  'gumDisplay',
  'teethColor',
  // Jaw, chin & neck
  'jawWidth',
  'jawAngle',
  'jawLength',
  'jawDefinition',
  'submentalFullness',
  'jowls',
  'chinProjection',
  'chinShape',
  'chinHeight',
  'chinCleft',
  'profile',
  'neckThickness',
  'adamsApple',
  // Ears
  'earSize',
  'earProtrusion',
  'earlobe',
  'earShape',
  'darwinsTubercle',
  // Skin
  'skinTone',
  'skinUndertone',
  'skinTexture',
  'poreVisibility',
  'skinSurface',
  'pigmentation',
  'wrinkleLevel',
  // Hair
  'hairTexture',
  'hairColor',
  'hairDensity',
  'strandThickness',
  'hairline',
  'balding',
  'greying',
  // facialHair (+ density/color) is rendered as its own sentence, and only
  // when not clean-shaven — so these are intentionally NOT in this list.
  // Build & individuating
  'build',
  'asymmetry',
  'asymmetryFeature',
  'dimples',
];

const SUBJECT_DEFAULTS = { shot: 'headshot', expression: 'neutral' } as const;

/** "a" vs "an" from the following word's sound (handles the Eu-/uni- exceptions). */
function indefinite(word: string): string {
  if (/^(eu|uni|use|one)/i.test(word)) return 'a';
  return /^[aeiou]/i.test(word) ? 'an' : 'a';
}

function subjectClause(
  spec: FaceSpec,
  shot: Shot,
  expression: Expression
): string {
  const ancestry = spec.ancestry ? ANCESTRY_ADJ[spec.ancestry] : '';
  const noun = spec.sex ? SEX_NOUN[spec.sex] : 'person';
  let who: string;
  if (spec.ageYears) {
    who = [`${spec.ageYears}-year-old`, ancestry, noun]
      .filter(Boolean)
      .join(' ');
  } else if (spec.ageBand === 'child') {
    who = [ancestry, 'child'].filter(Boolean).join(' ');
  } else if (spec.ageBand === 'teen') {
    who = [ancestry, 'teenager'].filter(Boolean).join(' ');
  } else if (spec.ageBand) {
    const poss =
      spec.sex === 'female' ? 'her' : spec.sex === 'male' ? 'his' : 'their';
    who =
      [ancestry, noun].filter(Boolean).join(' ') +
      ` in ${poss} ${AGE_DECADE[spec.ageBand]}`;
  } else {
    who = [ancestry, noun].filter(Boolean).join(' ');
  }
  const art = indefinite(who);
  return `A photorealistic ${SHOT_PHRASE[shot]} of ${art} ${who}, ${EXPRESSION_PHRASE[expression]}.`;
}

/**
 * Compose the full preview prompt. `params` is optional; its defaults mirror
 * `generationParamsSchema`.
 */
export function composePrompt(
  spec: FaceSpec,
  params?: Partial<GenerationParams>
): string {
  const shot = (params?.shot ?? SUBJECT_DEFAULTS.shot) as Shot;
  const expression = (params?.expression ??
    SUBJECT_DEFAULTS.expression) as Expression;

  const clauses: string[] = [];
  for (const key of FEATURE_ORDER) {
    const value = spec[key];
    if (typeof value !== 'string' || value === '') continue;
    const phrase = FEATURE_PHRASES[key]?.[value];
    if (phrase) clauses.push(phrase);
  }

  // Multi-select skin marks.
  if (spec.skinMarks && spec.skinMarks.length > 0) {
    clauses.push(spec.skinMarks.map((m) => m.replace(/-/g, ' ')).join(', '));
  }
  // Multi-select wrinkle locations (only meaningful alongside some aging).
  if (spec.wrinkleAreas && spec.wrinkleAreas.length > 0) {
    clauses.push(
      `lines around the ${spec.wrinkleAreas
        .map((a) => a.replace(/-/g, ' '))
        .join(', ')}`
    );
  }

  const parts: string[] = [subjectClause(spec, shot, expression)];
  if (clauses.length > 0) parts.push(`The face has ${clauses.join(', ')}.`);
  if (spec.facialHair && spec.facialHair !== 'clean-shaven') {
    const bits = [FEATURE_PHRASES.facialHair?.[spec.facialHair]];
    if (spec.facialHairDensity)
      bits.push(FEATURE_PHRASES.facialHairDensity?.[spec.facialHairDensity]);
    if (spec.facialHairColor)
      bits.push(`${spec.facialHairColor.replace(/-/g, ' ')} in color`);
    parts.push(`Facial hair: ${bits.filter(Boolean).join(', ')}.`);
  }
  if (spec.hairStyle) parts.push(`Hair: ${spec.hairStyle}.`);
  if (spec.ancestryNote) parts.push(spec.ancestryNote + '.');
  if (spec.distinguishingMark)
    parts.push(`Distinguishing feature: ${spec.distinguishingMark}.`);
  if (spec.extraNotes) parts.push(spec.extraNotes);
  if (params?.styleNote) parts.push(params.styleNote);

  parts.push(
    'Documentary realism, like a real casting photograph: natural, imperfect skin with visible pores and no retouching, no beauty filter, no glossy "AI" perfection. Even, soft lighting on a plain neutral backdrop. No text, labels, logos, or watermark.'
  );

  return parts.join(' ');
}
