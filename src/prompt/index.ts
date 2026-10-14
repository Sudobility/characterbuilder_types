import type { FaceSpec } from '../face/index.js';
import type {
  Expression,
  GenerationParams,
  Shot,
} from '../generation/index.js';

/**
 * Pure prompt composition: FaceSpec (+ generation params) -> a natural-language
 * image prompt. Dependency-free and deterministic, so BOTH the backend
 * (`characterbuilder_api`, which owns the authoritative prompt) and the frontend
 * (`characterbuilder_lib`, for instant local preview) use the exact same text.
 *
 * Each feature maps to a short phrase; unset features are omitted so the model is
 * free to choose them. The phrase tables deliberately echo the vocabulary of
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

const AGE_BAND_PHRASE: Phrase<string> = {
  child: 'child',
  teen: 'teenager',
  twenties: 'person in their twenties',
  thirties: 'person in their thirties',
  forties: 'person in their forties',
  fifties: 'person in their fifties',
  sixties: 'person in their sixties',
  'seventies-plus': 'elderly person',
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

/**
 * Per-feature phrases. Keyed by the FaceSpec field, each a map from the enum
 * value to a clause that reads naturally after "with ...".
 */
const FEATURE_PHRASES: {
  [K in keyof FaceSpec]?: Record<string, string>;
} = {
  cranialShape: {
    dolichocephalic: 'a long, narrow head',
    mesocephalic: 'a medium-proportioned head',
    brachycephalic: 'a short, broad head',
    hyperbrachycephalic: 'a very broad, round head',
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
  browRidge: {
    flat: 'a flat, smooth brow ridge',
    moderate: 'a moderate brow ridge',
    heavy: 'a heavy, projecting brow ridge',
  },
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
  epicanthicFold: {
    none: 'no epicanthic fold',
    slight: 'a slight epicanthic fold',
    pronounced: 'a pronounced epicanthic fold',
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
  noseBridge: {
    straight: 'a straight nasal bridge',
    convex: 'a convex (Roman) nasal bridge',
    concave: 'a concave, scooped nasal bridge',
    humped: 'a humped nasal bridge',
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
  nostrils: {
    narrow: 'narrow nostrils',
    medium: 'medium nostrils',
    flared: 'flared nostrils',
  },
  nasalIndex: {
    leptorrhine: 'a long, narrow nose',
    mesorrhine: 'a medium-breadth nose',
    platyrrhine: 'a short, broad nose',
  },
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
  philtrumLength: {
    short: 'a short philtrum',
    medium: 'a medium philtrum',
    long: 'a long philtrum',
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
  cheekboneProjection: {
    flat: 'flat cheekbones',
    moderate: 'moderately projecting cheekbones',
    prominent: 'prominent cheekbones',
  },
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
  jawDefinition: {
    soft: 'a soft jawline',
    defined: 'a defined jawline',
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
  hairline: {
    straight: 'a straight hairline',
    rounded: 'a rounded hairline',
    'widows-peak': 'a widow’s peak',
    'm-shaped': 'an M-shaped hairline',
    receding: 'a receding hairline',
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
};

/** Order the clauses roughly head-to-chin for readability. */
const FEATURE_ORDER: (keyof FaceSpec)[] = [
  'cranialShape',
  'faceShape',
  'facialProportion',
  'dominantThird',
  'foreheadHeight',
  'foreheadSlope',
  'browRidge',
  'browThickness',
  'browShape',
  'browArch',
  'eyeSize',
  'eyeSpacing',
  'eyeShape',
  'canthalTilt',
  'lidType',
  'epicanthicFold',
  'irisColor',
  'noseSize',
  'noseLength',
  'noseBridge',
  'noseWidth',
  'noseTip',
  'nostrils',
  'nasalIndex',
  'cheekFullness',
  'cheekboneHeight',
  'cheekboneProjection',
  'lipFullness',
  'lipRatio',
  'mouthWidth',
  'philtrumLength',
  'cupidsBow',
  'mouthCorners',
  'biteClass',
  'teeth',
  'jawWidth',
  'jawAngle',
  'jawDefinition',
  'chinProjection',
  'chinShape',
  'chinCleft',
  'profile',
  'earSize',
  'earProtrusion',
  'earlobe',
  'skinTone',
  'skinUndertone',
  'skinTexture',
  'hairTexture',
  'hairColor',
  'hairDensity',
  'hairline',
  'greying',
  'facialHair',
  'build',
  'asymmetry',
];

const SUBJECT_DEFAULTS = { shot: 'headshot', expression: 'neutral' } as const;

function subjectClause(
  spec: FaceSpec,
  shot: Shot,
  expression: Expression
): string {
  const age = spec.ageYears
    ? `${spec.ageYears}-year-old`
    : spec.ageBand
      ? AGE_BAND_PHRASE[spec.ageBand]
      : '';
  const ancestry = spec.ancestry ? ANCESTRY_ADJ[spec.ancestry] : '';
  const noun = spec.sex ? SEX_NOUN[spec.sex] : 'person';
  const who = [age, ancestry, noun].filter(Boolean).join(' ');
  return `A photorealistic ${SHOT_PHRASE[shot]} of a ${who}, ${EXPRESSION_PHRASE[expression]}.`;
}

/**
 * Compose the full prompt. `params` is optional; its defaults mirror
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

  const parts: string[] = [subjectClause(spec, shot, expression)];
  if (clauses.length > 0) parts.push(`The face has ${clauses.join(', ')}.`);
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
