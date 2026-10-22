/**
 * Ancestry TAXONOMY — a hierarchical tree of populations
 * (e.g. Asian → East Asian → Chinese → Northern Chinese). Each node may carry two
 * first-party, hand-authored overlays:
 *   • `population`  — the demographic trait tendencies of that group (coloring,
 *                     eye morphology, nose/face structure). Replaces the broad
 *                     ancestry distribution for the traits it lists.
 *   • `attractiveness` — that group's "good-looking" STRUCTURE, judged on its own
 *                     aesthetic (never ranked against other groups).
 * Overlays accumulate from root → node, so a leaf only states what differs from its
 * parent. These are mild statistical tendencies with wide spread, for a creative
 * portrait tool — not rules, and never a ranking of groups.
 *
 * Resolution (all seeded, so it is deterministic per image and varied across a batch):
 *   • A STEM input (e.g. "Asian", "European", "Chinese") randomly DESCENDS, by node
 *     weight, to a concrete leaf, then casts from there.
 *   • A leaf input (e.g. "Northern Chinese") is used directly.
 *   • MIXED resolves a leaf on each side independently, then the caster inherits
 *     each trait from one randomly-chosen parent (see `mixDistributions`).
 */
import type { FaceFeatureKey } from '../face/index.js';
import type { Demographics } from '../demographics/index.js';
import type { FaceDistributions } from '../distribution/index.js';
import { dirichlet, type Rng, type Weights } from './rng.js';

export type AncestryOverlay = Partial<Record<FaceFeatureKey, Weights>>;

/** One parent in an admixed node's recipe: a cluster id with a relative weight. */
export interface AncestryBlendRef {
  ref: string;
  weight: number;
}

/**
 * A node in the demographic tree. Three KINDS (inferred when `kind` is omitted):
 *   • `group`   — a stem/router with children and no look of its own; a stem input
 *                 descends it at random (weighted) to a concrete leaf. (Has children.)
 *   • `cluster` — a heritage leaf with an authored trait distribution (the endogamous
 *                 source looks). (No children, no blend.)
 *   • `admixed` — a leaf defined by a `blend` RECIPE over cluster ids: a characteristic
 *                 mixture (mestizo, mulatto, diaspora) composed per-trait from its
 *                 parents rather than hand-authored. (Has `blend`.)
 * Nations that are a *bag of unblended looks* (USA, Canada) are deliberately NOT nodes —
 * they are only ever `group` routers if included at all, never leaves.
 */
export interface AncestryNode {
  /** Canonical kebab id, unique across the tree. */
  id: string;
  /** Human label used in the prose (`ancestryNote`). */
  label: string;
  /** Extra strings that resolve to this node (case-insensitive), besides id+label. */
  aliases?: string[];
  /** Relative likelihood when a parent STEM descends into its children (default 1). */
  weight?: number;
  /** Override the inferred kind (children→group, blend→admixed, else→cluster). */
  kind?: 'group' | 'cluster' | 'admixed';
  /** For an `admixed` leaf: the weighted recipe of cluster ids it blends. */
  blend?: AncestryBlendRef[];
  population?: AncestryOverlay;
  attractiveness?: AncestryOverlay;
  children?: AncestryNode[];
}

/** The inferred kind of a node. */
function nodeKind(node: AncestryNode): 'group' | 'cluster' | 'admixed' {
  if (node.kind) return node.kind;
  if (node.children && node.children.length > 0) return 'group';
  if (node.blend && node.blend.length > 0) return 'admixed';
  return 'cluster';
}

/** The broad `ancestry` enum values — the level `buildDistributions` understands. */
const ENUM_ANCESTRIES = new Set([
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
]);

/* ───────────────────────── Attractive-structure overlays ─────────────────────
 * Attached at the enum level and inherited by every leaf beneath (a leaf may add
 * small deltas). Face outline, cheekbones and the nose, on each region's own terms. */
const ATTR_EAST_ASIAN: AncestryOverlay = {
  faceShape: {
    oval: 30,
    heart: 20,
    round: 22,
    square: 12,
    diamond: 12,
    rectangular: 2,
    triangle: 1,
    trapezoid: 1,
  },
  cheekboneHeight: { high: 60, medium: 35, low: 5 },
  cheekboneProjection: { moderate: 55, prominent: 35, flat: 10 },
  midfaceProjection: { medium: 55, forward: 35, flat: 10 },
  noseTip: {
    rounded: 46,
    pointed: 30,
    upturned: 20,
    bulbous: 2,
    boxy: 1,
    drooping: 1,
  },
  noseBridge: { straight: 52, concave: 26, convex: 14, humped: 8 },
  noseBridgeHeight: { medium: 48, low: 37, high: 15 },
  noseWidth: { narrow: 35, medium: 55, wide: 10 },
};
const ATTR_SOUTH_ASIAN: AncestryOverlay = {
  faceShape: {
    oval: 34,
    heart: 18,
    round: 16,
    square: 14,
    diamond: 12,
    rectangular: 4,
    triangle: 1,
    trapezoid: 1,
  },
  cheekboneHeight: { high: 55, medium: 40, low: 5 },
  noseTip: {
    pointed: 36,
    rounded: 40,
    upturned: 12,
    bulbous: 8,
    boxy: 2,
    drooping: 2,
  },
  noseBridge: { straight: 58, convex: 22, concave: 12, humped: 8 },
  noseWidth: { narrow: 35, medium: 55, wide: 10 },
};
const ATTR_MIDDLE_EASTERN: AncestryOverlay = {
  faceShape: {
    oval: 34,
    heart: 16,
    square: 14,
    rectangular: 10,
    diamond: 12,
    round: 10,
    triangle: 2,
    trapezoid: 2,
  },
  cheekboneHeight: { high: 58, medium: 37, low: 5 },
  cheekboneProjection: { prominent: 45, moderate: 50, flat: 5 },
  noseBridge: { straight: 46, convex: 32, humped: 12, concave: 10 },
  noseTip: {
    pointed: 38,
    rounded: 40,
    drooping: 6,
    upturned: 10,
    bulbous: 4,
    boxy: 2,
  },
  noseWidth: { narrow: 40, medium: 52, wide: 8 },
};
const ATTR_AFRICAN: AncestryOverlay = {
  faceShape: {
    oval: 30,
    round: 20,
    heart: 18,
    square: 16,
    diamond: 10,
    rectangular: 4,
    triangle: 1,
    trapezoid: 1,
  },
  cheekboneHeight: { high: 62, medium: 33, low: 5 },
  cheekboneProjection: { prominent: 50, moderate: 45, flat: 5 },
  noseTip: {
    rounded: 52,
    bulbous: 12,
    pointed: 18,
    boxy: 5,
    upturned: 11,
    drooping: 2,
  },
  noseBridge: { straight: 44, concave: 26, convex: 18, humped: 12 },
  noseWidth: { narrow: 22, medium: 50, wide: 28 },
  nostrils: { narrow: 22, medium: 50, flared: 28 },
  alarBaseWidth: { narrow: 22, medium: 50, wide: 28 },
};
const ATTR_EUROPEAN: AncestryOverlay = {
  faceShape: {
    oval: 34,
    heart: 16,
    square: 14,
    diamond: 12,
    round: 14,
    rectangular: 6,
    triangle: 2,
    trapezoid: 2,
  },
  cheekboneHeight: { high: 52, medium: 43, low: 5 },
  noseBridge: { straight: 60, convex: 18, concave: 14, humped: 8 },
  noseTip: {
    pointed: 30,
    rounded: 46,
    upturned: 18,
    bulbous: 4,
    boxy: 1,
    drooping: 1,
  },
  noseWidth: { narrow: 45, medium: 50, wide: 5 },
};
const ATTR_BROAD_HIGH: AncestryOverlay = {
  faceShape: {
    oval: 28,
    round: 22,
    square: 18,
    heart: 14,
    diamond: 10,
    rectangular: 5,
    triangle: 2,
    trapezoid: 1,
  },
  cheekboneHeight: { high: 62, medium: 33, low: 5 },
  cheekboneProjection: { prominent: 50, moderate: 45, flat: 5 },
  cheekboneWidth: { medium: 48, wide: 42, narrow: 10 },
  noseBridge: { straight: 50, convex: 22, concave: 18, humped: 10 },
  noseTip: {
    rounded: 50,
    pointed: 22,
    bulbous: 10,
    upturned: 12,
    boxy: 4,
    drooping: 2,
  },
  noseWidth: { narrow: 22, medium: 56, wide: 22 },
};
/* ───────────────────────────────── The tree ──────────────────────────────── */
export const ANCESTRY_FOREST: AncestryNode[] = [
  {
    id: 'european',
    label: 'European',
    aliases: ['europe', 'white', 'caucasian'],
    attractiveness: ATTR_EUROPEAN,
    children: [
      {
        id: 'nordic',
        label: 'Nordic',
        aliases: [
          'scandinavian',
          'swedish',
          'norwegian',
          'danish',
          'finnish',
          'icelandic',
        ],
        population: {
          skinTone: { 'very-fair': 30, fair: 40, light: 25, medium: 5 },
          hairColor: {
            blonde: 40,
            'light-brown': 25,
            brown: 18,
            'dark-brown': 8,
            red: 9,
          },
          irisColor: {
            blue: 45,
            grey: 15,
            green: 15,
            hazel: 12,
            brown: 8,
            'dark-brown': 5,
          },
          hairTexture: { straight: 55, wavy: 40, curly: 5 },
        },
      },
      {
        id: 'british-isles',
        label: 'British & Irish',
        aliases: ['british', 'english', 'irish', 'scottish', 'welsh', 'uk'],
        population: {
          skinTone: { 'very-fair': 15, fair: 40, light: 35, medium: 10 },
          hairColor: {
            brown: 28,
            'dark-brown': 22,
            'light-brown': 18,
            blonde: 14,
            red: 12,
            black: 6,
          },
          irisColor: {
            blue: 32,
            green: 18,
            hazel: 18,
            brown: 18,
            'dark-brown': 14,
          },
          pigmentation: { even: 68, freckled: 32 },
        },
      },
      {
        id: 'western-european',
        label: 'Western European',
        aliases: ['french', 'german', 'dutch', 'belgian', 'austrian', 'swiss'],
        weight: 1.3,
        population: {
          skinTone: { fair: 30, light: 40, medium: 25, tan: 5 },
          hairColor: {
            brown: 30,
            'dark-brown': 28,
            'light-brown': 18,
            blonde: 16,
            black: 8,
          },
          irisColor: {
            brown: 28,
            blue: 22,
            hazel: 20,
            green: 14,
            'dark-brown': 16,
          },
        },
      },
      {
        id: 'eastern-european',
        label: 'Eastern European',
        aliases: [
          'slavic',
          'russian',
          'polish',
          'ukrainian',
          'czech',
          'balkan',
          'serbian',
        ],
        weight: 1.2,
        population: {
          skinTone: { 'very-fair': 12, fair: 38, light: 40, medium: 10 },
          hairColor: {
            'light-brown': 26,
            blonde: 22,
            brown: 24,
            'dark-brown': 20,
            black: 8,
          },
          irisColor: {
            blue: 34,
            grey: 16,
            hazel: 16,
            green: 14,
            brown: 12,
            'dark-brown': 8,
          },
        },
      },
      {
        id: 'mediterranean',
        label: 'Mediterranean',
        aliases: [
          'italian',
          'spanish',
          'portuguese',
          'greek',
          'iberian',
          'southern european',
        ],
        weight: 1.2,
        population: {
          skinTone: { fair: 12, light: 30, medium: 34, tan: 24 },
          skinUndertone: { olive: 50, warm: 35, neutral: 15 },
          hairColor: {
            'dark-brown': 34,
            black: 28,
            brown: 24,
            'light-brown': 8,
            auburn: 6,
          },
          irisColor: {
            brown: 28,
            'dark-brown': 30,
            hazel: 22,
            green: 10,
            blue: 10,
          },
          hairTexture: { straight: 35, wavy: 45, curly: 20 },
        },
        attractiveness: {
          noseBridge: { straight: 50, convex: 35, concave: 10, humped: 5 },
        },
      },
      {
        id: 'ashkenazi',
        label: 'Ashkenazi Jewish',
        aliases: ['jewish', 'ashkenazi jewish'],
        population: {
          skinTone: { fair: 30, light: 40, medium: 25, tan: 5 },
          hairColor: {
            'dark-brown': 38,
            brown: 26,
            black: 20,
            'light-brown': 10,
            auburn: 6,
          },
          irisColor: {
            brown: 34,
            'dark-brown': 24,
            hazel: 22,
            blue: 12,
            green: 8,
          },
          hairTexture: { straight: 25, wavy: 40, curly: 35 },
        },
        attractiveness: {
          noseBridge: { convex: 40, straight: 40, humped: 12, concave: 8 },
        },
      },
    ],
  },
  {
    id: 'asian',
    label: 'Asian',
    aliases: ['asia'],
    children: [
      {
        id: 'east-asian',
        label: 'East Asian',
        weight: 1.6,
        attractiveness: ATTR_EAST_ASIAN,
        population: {
          hairColor: { black: 68, 'dark-brown': 28, brown: 4 },
          hairTexture: { straight: 82, wavy: 16, curly: 2 },
          irisColor: { 'dark-brown': 72, brown: 24, hazel: 2, amber: 2 },
          epicanthicFold: { pronounced: 40, slight: 40, none: 20 },
        },
        children: [
          {
            id: 'chinese',
            label: 'Chinese',
            aliases: ['han', 'han chinese'],
            weight: 2.5,
            children: [
              {
                id: 'northern-chinese',
                label: 'Northern Chinese',
                aliases: ['beijing', 'dongbei', 'northern han', 'manchurian'],
                population: {
                  skinTone: { fair: 34, light: 40, medium: 22, tan: 4 },
                  faceShape: {
                    oval: 24,
                    square: 22,
                    round: 20,
                    heart: 12,
                    diamond: 10,
                    rectangular: 8,
                    triangle: 2,
                    trapezoid: 2,
                  },
                  lidType: {
                    monolid: 48,
                    double: 34,
                    hooded: 10,
                    'deep-set': 8,
                  },
                  noseBridgeHeight: { low: 32, medium: 52, high: 16 },
                },
                // Taller, longer faces and a higher nasal bridge read as the local ideal.
                attractiveness: {
                  faceShape: {
                    oval: 34,
                    square: 20,
                    rectangular: 8,
                    heart: 12,
                    diamond: 10,
                    round: 14,
                    triangle: 1,
                    trapezoid: 1,
                  },
                  noseBridgeHeight: { medium: 50, high: 30, low: 20 },
                  cheekboneHeight: { high: 62, medium: 34, low: 4 },
                },
              },
              {
                id: 'southern-chinese',
                label: 'Southern Chinese',
                aliases: [
                  'cantonese',
                  'guangdong',
                  'hokkien',
                  'fujian',
                  'southern han',
                ],
                weight: 1.1,
                population: {
                  skinTone: { fair: 6, light: 34, medium: 34, tan: 26 },
                  faceShape: {
                    round: 30,
                    heart: 20,
                    oval: 24,
                    square: 12,
                    diamond: 8,
                    triangle: 3,
                    trapezoid: 3,
                  },
                  lidType: {
                    double: 46,
                    monolid: 34,
                    hooded: 12,
                    'deep-set': 8,
                  },
                  noseWidth: { narrow: 25, medium: 50, wide: 25 },
                  noseBridgeHeight: { low: 46, medium: 40, high: 14 },
                },
                // Softer, rounder/heart-shaped faces and a lower, delicate bridge.
                attractiveness: {
                  faceShape: {
                    round: 28,
                    heart: 26,
                    oval: 26,
                    square: 8,
                    diamond: 8,
                    triangle: 2,
                    trapezoid: 2,
                  },
                  noseBridgeHeight: { low: 38, medium: 46, high: 16 },
                  noseWidth: { narrow: 30, medium: 55, wide: 15 },
                },
              },
              {
                id: 'eastern-chinese',
                label: 'Eastern Chinese',
                aliases: ['shanghai', 'jiangsu', 'zhejiang', 'wu'],
                population: {
                  skinTone: { fair: 22, light: 42, medium: 30, tan: 6 },
                  faceShape: {
                    oval: 34,
                    heart: 18,
                    round: 20,
                    square: 14,
                    diamond: 8,
                    rectangular: 4,
                    triangle: 1,
                    trapezoid: 1,
                  },
                },
                // Fair, refined oval "goose-egg" faces.
                attractiveness: {
                  faceShape: {
                    oval: 42,
                    heart: 22,
                    round: 16,
                    square: 8,
                    diamond: 8,
                    rectangular: 2,
                    triangle: 1,
                    trapezoid: 1,
                  },
                },
              },
              {
                id: 'western-chinese',
                label: 'Western Chinese',
                aliases: ['sichuan', 'xinjiang han', 'western han'],
                population: {
                  skinTone: { fair: 8, light: 36, medium: 34, tan: 22 },
                  irisColor: {
                    'dark-brown': 64,
                    brown: 26,
                    hazel: 6,
                    amber: 4,
                  },
                },
              },
            ],
          },
          {
            id: 'korean',
            label: 'Korean',
            weight: 1.1,
            population: {
              skinTone: { 'very-fair': 4, fair: 36, light: 42, medium: 18 },
              faceShape: {
                round: 28,
                oval: 26,
                square: 22,
                heart: 14,
                diamond: 10,
              },
              lidType: { monolid: 44, double: 40, hooded: 8, 'deep-set': 8 },
              epicanthicFold: { slight: 42, pronounced: 34, none: 24 },
              hairColor: { black: 70, 'dark-brown': 26, brown: 4 },
            },
            // Smooth, soft "V-line" oval/round faces with a gentle jaw.
            attractiveness: {
              faceShape: {
                oval: 30,
                heart: 24,
                round: 24,
                square: 10,
                diamond: 10,
                triangle: 1,
                trapezoid: 1,
              },
              noseBridgeHeight: { low: 28, medium: 52, high: 20 },
            },
          },
          {
            id: 'japanese',
            label: 'Japanese',
            weight: 1.3,
            population: {
              skinTone: { 'very-fair': 4, fair: 34, light: 40, medium: 22 },
              faceShape: {
                oval: 30,
                round: 20,
                rectangular: 14,
                square: 14,
                heart: 12,
                diamond: 10,
              },
              lidType: { double: 44, monolid: 40, hooded: 8, 'deep-set': 8 },
              hairColor: { black: 62, 'dark-brown': 30, brown: 8 },
              hairTexture: { straight: 70, wavy: 26, curly: 4 },
            },
            // Slightly longer oval faces; the double-lid is common and prized.
            attractiveness: {
              faceShape: {
                oval: 34,
                heart: 16,
                rectangular: 12,
                round: 18,
                square: 10,
                diamond: 10,
              },
              lidType: { double: 55, monolid: 30, hooded: 8, 'deep-set': 7 },
            },
          },
          {
            id: 'mongolian',
            label: 'Mongolian',
            population: {
              skinTone: { fair: 4, light: 30, medium: 36, tan: 30 },
              faceShape: {
                round: 34,
                square: 22,
                oval: 20,
                heart: 12,
                diamond: 8,
                trapezoid: 4,
              },
              lidType: { monolid: 52, double: 28, hooded: 10, 'deep-set': 10 },
              epicanthicFold: { pronounced: 48, slight: 36, none: 16 },
            },
            // Broad, strong faces with powerful high, wide cheekbones.
            attractiveness: {
              faceShape: {
                round: 30,
                square: 24,
                oval: 18,
                heart: 12,
                diamond: 8,
                trapezoid: 6,
                rectangular: 1,
                triangle: 1,
              },
              cheekboneHeight: { high: 68, medium: 28, low: 4 },
              cheekboneWidth: { wide: 42, medium: 50, narrow: 8 },
            },
          },
        ],
      },
      {
        id: 'southeast-asian',
        label: 'Southeast Asian',
        weight: 1.1,
        attractiveness: ATTR_EAST_ASIAN,
        population: {
          hairColor: { black: 80, 'dark-brown': 18, brown: 2 },
          hairTexture: { straight: 62, wavy: 32, curly: 6 },
          irisColor: { 'dark-brown': 74, brown: 22, hazel: 2, amber: 2 },
          lidType: { double: 48, monolid: 32, hooded: 12, 'deep-set': 8 },
          epicanthicFold: { slight: 40, none: 36, pronounced: 24 },
        },
        children: [
          {
            id: 'vietnamese',
            label: 'Vietnamese',
            population: {
              skinTone: { fair: 6, light: 30, medium: 36, tan: 28 },
              faceShape: {
                heart: 24,
                oval: 28,
                round: 24,
                square: 12,
                diamond: 8,
                triangle: 2,
                trapezoid: 2,
              },
              noseWidth: { narrow: 20, medium: 50, wide: 30 },
            },
          },
          {
            id: 'thai',
            label: 'Thai',
            population: {
              skinTone: { light: 12, medium: 34, tan: 34, brown: 20 },
              noseWidth: { narrow: 20, medium: 46, wide: 34 },
            },
          },
          {
            id: 'filipino',
            label: 'Filipino',
            aliases: ['pilipino', 'philippine'],
            population: {
              skinTone: { light: 10, medium: 34, tan: 34, brown: 22 },
              faceShape: {
                round: 28,
                heart: 22,
                oval: 24,
                square: 14,
                diamond: 8,
                triangle: 2,
                trapezoid: 2,
              },
              hairTexture: { straight: 60, wavy: 34, curly: 6 },
            },
          },
          {
            id: 'indonesian-malay',
            label: 'Indonesian / Malay',
            aliases: ['indonesian', 'malay', 'malaysian', 'javanese'],
            weight: 1.2,
            population: {
              skinTone: { light: 10, medium: 30, tan: 34, brown: 26 },
              noseWidth: { narrow: 18, medium: 44, wide: 38 },
            },
          },
          {
            id: 'burmese',
            label: 'Burmese',
            aliases: ['myanmar'],
            population: {
              skinTone: { light: 20, medium: 34, tan: 32, brown: 14 },
            },
          },
        ],
      },
      {
        id: 'south-asian',
        label: 'South Asian',
        aliases: ['indian', 'desi', 'subcontinental'],
        weight: 1.7,
        attractiveness: ATTR_SOUTH_ASIAN,
        population: {
          hairColor: { black: 70, 'dark-brown': 26, brown: 4 },
          hairTexture: { straight: 32, wavy: 42, curly: 26 },
          irisColor: {
            'dark-brown': 58,
            brown: 28,
            hazel: 8,
            green: 3,
            amber: 3,
          },
          lidType: { double: 72, hooded: 14, 'deep-set': 10, monolid: 4 },
          epicanthicFold: { none: 80, slight: 16, pronounced: 4 },
        },
        children: [
          {
            id: 'north-indian',
            label: 'North Indian',
            aliases: ['hindustani', 'rajasthani', 'gujarati'],
            weight: 1.3,
            population: {
              skinTone: { light: 20, medium: 36, tan: 28, brown: 16 },
              noseBridge: { straight: 54, convex: 28, concave: 10, humped: 8 },
            },
          },
          {
            id: 'south-indian',
            label: 'South Indian',
            aliases: ['tamil', 'telugu', 'malayali', 'kannada', 'dravidian'],
            weight: 1.2,
            population: {
              skinTone: {
                light: 10,
                medium: 24,
                tan: 26,
                brown: 28,
                'dark-brown': 12,
              },
              hairTexture: { straight: 22, wavy: 40, curly: 38 },
              noseWidth: { narrow: 22, medium: 44, wide: 34 },
            },
          },
          {
            id: 'bengali',
            label: 'Bengali',
            aliases: ['bangladeshi'],
            population: {
              skinTone: { light: 12, medium: 30, tan: 30, brown: 28 },
              faceShape: {
                oval: 30,
                round: 24,
                heart: 18,
                square: 14,
                diamond: 8,
                rectangular: 4,
                triangle: 1,
                trapezoid: 1,
              },
            },
          },
          {
            id: 'punjabi',
            label: 'Punjabi',
            population: {
              skinTone: { fair: 10, light: 28, medium: 36, tan: 26 },
              hairColor: { black: 64, 'dark-brown': 30, brown: 6 },
            },
          },
          {
            id: 'pakistani',
            label: 'Pakistani',
            aliases: ['pashtun', 'punjabi pakistani'],
            population: {
              skinTone: { fair: 10, light: 30, medium: 34, tan: 26 },
              irisColor: {
                'dark-brown': 52,
                brown: 26,
                hazel: 12,
                green: 6,
                blue: 4,
              },
              noseBridge: { straight: 46, convex: 34, humped: 12, concave: 8 },
            },
          },
          {
            id: 'sinhalese',
            label: 'Sinhalese',
            aliases: ['sri lankan'],
            population: {
              skinTone: {
                light: 8,
                medium: 22,
                tan: 30,
                brown: 32,
                'dark-brown': 8,
              },
            },
          },
        ],
      },
      {
        id: 'central-asian',
        label: 'Central Asian',
        attractiveness: ATTR_BROAD_HIGH,
        population: {
          hairColor: {
            black: 44,
            'dark-brown': 40,
            brown: 14,
            'light-brown': 2,
          },
          irisColor: {
            'dark-brown': 44,
            brown: 32,
            hazel: 14,
            green: 6,
            blue: 4,
          },
          epicanthicFold: { slight: 44, pronounced: 30, none: 26 },
        },
        children: [
          {
            id: 'kazakh',
            label: 'Kazakh',
            aliases: ['kyrgyz'],
            population: {
              skinTone: { fair: 4, light: 32, medium: 36, tan: 28 },
              lidType: { monolid: 40, double: 40, hooded: 10, 'deep-set': 10 },
            },
            attractiveness: {
              cheekboneHeight: { high: 64, medium: 32, low: 4 },
            },
          },
          {
            id: 'uzbek',
            label: 'Uzbek',
            aliases: ['turkmen'],
            population: {
              skinTone: { fair: 4, light: 34, medium: 36, tan: 26 },
              irisColor: {
                brown: 40,
                'dark-brown': 34,
                hazel: 16,
                green: 6,
                blue: 4,
              },
            },
          },
          {
            id: 'tajik',
            label: 'Tajik',
            population: {
              skinTone: { fair: 8, light: 36, medium: 34, tan: 22 },
              irisColor: {
                brown: 34,
                'dark-brown': 28,
                hazel: 20,
                green: 10,
                blue: 8,
              },
              hairColor: {
                'dark-brown': 44,
                black: 30,
                brown: 20,
                'light-brown': 6,
              },
              epicanthicFold: { none: 60, slight: 30, pronounced: 10 },
            },
          },
        ],
      },
    ],
  },
  {
    id: 'middle-eastern',
    label: 'Middle Eastern',
    aliases: ['west asian', 'arab', 'middle east'],
    attractiveness: ATTR_MIDDLE_EASTERN,
    population: {
      hairColor: { black: 36, 'dark-brown': 40, brown: 18, 'light-brown': 6 },
      hairTexture: { straight: 24, wavy: 46, curly: 30 },
      irisColor: { brown: 32, 'dark-brown': 30, hazel: 20, green: 10, blue: 8 },
      skinUndertone: { olive: 46, warm: 34, neutral: 20 },
    },
    children: [
      {
        id: 'levantine',
        label: 'Levantine',
        aliases: ['lebanese', 'syrian', 'palestinian', 'jordanian'],
        population: { skinTone: { fair: 8, light: 34, medium: 34, tan: 24 } },
      },
      {
        id: 'gulf-arab',
        label: 'Gulf Arab',
        aliases: ['saudi', 'emirati', 'kuwaiti', 'qatari', 'khaleeji'],
        population: {
          skinTone: { light: 8, medium: 30, tan: 34, brown: 28 },
          hairColor: { black: 62, 'dark-brown': 30, brown: 8 },
        },
      },
      {
        id: 'persian',
        label: 'Persian',
        aliases: ['iranian', 'farsi'],
        weight: 1.2,
        population: {
          skinTone: { fair: 14, light: 34, medium: 34, tan: 18 },
          irisColor: {
            brown: 30,
            'dark-brown': 26,
            hazel: 22,
            green: 12,
            blue: 10,
          },
          hairColor: {
            'dark-brown': 42,
            black: 30,
            brown: 20,
            'light-brown': 8,
          },
        },
      },
      {
        id: 'turkish',
        label: 'Turkish',
        weight: 1.2,
        population: {
          skinTone: { fair: 14, light: 36, medium: 32, tan: 18 },
          irisColor: {
            brown: 30,
            'dark-brown': 24,
            hazel: 22,
            green: 14,
            blue: 10,
          },
          hairColor: {
            'dark-brown': 40,
            black: 28,
            brown: 22,
            'light-brown': 10,
          },
        },
      },
      {
        id: 'kurdish',
        label: 'Kurdish',
        population: {
          skinTone: { fair: 10, light: 34, medium: 34, tan: 22 },
          irisColor: {
            brown: 30,
            'dark-brown': 28,
            hazel: 22,
            green: 12,
            blue: 8,
          },
        },
      },
    ],
  },
  {
    id: 'north-african',
    label: 'North African',
    aliases: ['maghrebi', 'maghreb'],
    attractiveness: ATTR_MIDDLE_EASTERN,
    population: {
      hairColor: { black: 46, 'dark-brown': 38, brown: 14, 'light-brown': 2 },
      hairTexture: { straight: 22, wavy: 40, curly: 38 },
      irisColor: { 'dark-brown': 42, brown: 30, hazel: 18, green: 6, blue: 4 },
      skinUndertone: { olive: 48, warm: 38, neutral: 14 },
    },
    children: [
      {
        id: 'maghrebi-arab',
        label: 'Maghrebi',
        aliases: ['moroccan', 'algerian', 'tunisian', 'libyan'],
        population: {
          skinTone: { fair: 6, light: 26, medium: 34, tan: 24, brown: 10 },
        },
      },
      {
        id: 'berber',
        label: 'Berber (Amazigh)',
        aliases: ['amazigh', 'kabyle'],
        population: {
          skinTone: { fair: 12, light: 30, medium: 34, tan: 24 },
          irisColor: {
            brown: 34,
            'dark-brown': 30,
            hazel: 20,
            green: 10,
            blue: 6,
          },
        },
      },
      {
        id: 'egyptian',
        label: 'Egyptian',
        population: {
          skinTone: { light: 12, medium: 32, tan: 32, brown: 24 },
          hairColor: { black: 50, 'dark-brown': 34, brown: 16 },
        },
      },
    ],
  },
  {
    id: 'sub-saharan-african',
    label: 'Sub-Saharan African',
    aliases: ['african', 'black', 'black african', 'africa'],
    weight: 1.4,
    attractiveness: ATTR_AFRICAN,
    population: {
      hairColor: { black: 88, 'dark-brown': 12 },
      hairTexture: { coily: 84, curly: 16 },
      irisColor: { 'dark-brown': 82, brown: 18 },
      lipFullness: { full: 58, medium: 36, thin: 6 },
    },
    children: [
      {
        id: 'west-african',
        label: 'West African',
        aliases: ['yoruba', 'igbo', 'akan', 'ghanaian', 'nigerian'],
        weight: 1.5,
        population: {
          skinTone: { medium: 6, brown: 26, 'dark-brown': 34, deep: 34 },
          noseWidth: { narrow: 10, medium: 40, wide: 50 },
          nostrils: { narrow: 10, medium: 40, flared: 50 },
          faceShape: {
            round: 28,
            oval: 26,
            square: 20,
            heart: 14,
            diamond: 8,
            rectangular: 2,
            triangle: 1,
            trapezoid: 1,
          },
        },
      },
      {
        id: 'east-african',
        label: 'East African (Horn)',
        aliases: ['ethiopian', 'somali', 'eritrean', 'oromo'],
        weight: 1.1,
        population: {
          skinTone: {
            light: 4,
            medium: 18,
            tan: 18,
            brown: 36,
            'dark-brown': 24,
          },
          noseWidth: { narrow: 40, medium: 45, wide: 15 },
          noseBridge: { straight: 50, convex: 20, concave: 18, humped: 12 },
          faceShape: {
            oval: 36,
            heart: 20,
            diamond: 14,
            round: 16,
            square: 10,
            rectangular: 2,
            triangle: 1,
            trapezoid: 1,
          },
          lipFullness: { full: 46, medium: 44, thin: 10 },
          hairTexture: { coily: 58, curly: 36, wavy: 6 },
        },
        attractiveness: { noseWidth: { narrow: 45, medium: 45, wide: 10 } },
      },
      {
        id: 'southern-african',
        label: 'Southern African',
        aliases: ['nguni', 'zulu', 'xhosa', 'south african'],
        population: {
          skinTone: { medium: 12, brown: 30, 'dark-brown': 34, deep: 24 },
          faceShape: {
            round: 26,
            oval: 24,
            square: 22,
            heart: 14,
            diamond: 8,
            rectangular: 3,
            triangle: 2,
            trapezoid: 1,
          },
        },
      },
      {
        id: 'central-african',
        label: 'Central African',
        aliases: ['congolese', 'bantu'],
        population: {
          skinTone: { brown: 24, 'dark-brown': 34, deep: 36, medium: 6 },
          noseWidth: { narrow: 10, medium: 38, wide: 52 },
        },
      },
    ],
  },
  {
    id: 'indigenous-american',
    label: 'Indigenous American',
    aliases: ['native american', 'amerindian', 'first nations', 'indigenous'],
    attractiveness: ATTR_BROAD_HIGH,
    population: {
      hairColor: { black: 80, 'dark-brown': 18, brown: 2 },
      hairTexture: { straight: 78, wavy: 20, curly: 2 },
      irisColor: { 'dark-brown': 74, brown: 24, hazel: 2 },
      epicanthicFold: { none: 50, slight: 36, pronounced: 14 },
    },
    children: [
      {
        id: 'north-american-indigenous',
        label: 'North American Indigenous',
        aliases: ['navajo', 'cherokee', 'sioux', 'plains'],
        population: {
          skinTone: {
            light: 8,
            medium: 24,
            tan: 34,
            brown: 24,
            'dark-brown': 10,
          },
          noseBridge: { straight: 40, convex: 34, concave: 14, humped: 12 },
        },
      },
      {
        id: 'mesoamerican',
        label: 'Mesoamerican',
        aliases: ['maya', 'nahua', 'aztec', 'mexican indigenous'],
        weight: 1.3,
        population: {
          skinTone: {
            light: 6,
            medium: 24,
            tan: 36,
            brown: 26,
            'dark-brown': 8,
          },
          faceShape: {
            round: 28,
            square: 22,
            oval: 22,
            heart: 14,
            diamond: 8,
            rectangular: 3,
            triangle: 2,
            trapezoid: 1,
          },
        },
      },
      {
        id: 'andean',
        label: 'Andean',
        aliases: ['quechua', 'aymara', 'peruvian indigenous'],
        weight: 1.2,
        population: {
          skinTone: {
            light: 6,
            medium: 24,
            tan: 32,
            brown: 28,
            'dark-brown': 10,
          },
        },
        attractiveness: { cheekboneHeight: { high: 66, medium: 30, low: 4 } },
      },
      {
        id: 'amazonian',
        label: 'Amazonian',
        population: {
          skinTone: { medium: 16, tan: 30, brown: 34, 'dark-brown': 20 },
        },
      },
    ],
  },
  {
    // Latin American — ADMIXED national looks. Each country is a recipe over the
    // heritage clusters above (Indigenous + Iberian + African, in characteristic
    // proportions); the caster draws a per-person ancestry fraction so a batch spans
    // the real range from near-Indigenous to near-European. A bare stem ("Latino")
    // descends at random to a country. US/Canada are deliberately absent — a
    // melting-pot nation is a bag of unblended looks, not one look.
    id: 'latin-american',
    label: 'Latin American',
    aliases: [
      'latino',
      'latina',
      'hispanic',
      'latinx',
      'latin america',
      'south american',
      'central american',
    ],
    weight: 1.6,
    children: [
      {
        id: 'mexican',
        label: 'Mexican',
        weight: 1.6,
        blend: [
          { ref: 'mesoamerican', weight: 55 },
          { ref: 'mediterranean', weight: 40 },
          { ref: 'west-african', weight: 5 },
        ],
      },
      {
        id: 'guatemalan',
        label: 'Guatemalan',
        blend: [
          { ref: 'mesoamerican', weight: 70 },
          { ref: 'mediterranean', weight: 28 },
          { ref: 'west-african', weight: 2 },
        ],
      },
      {
        id: 'brazilian',
        label: 'Brazilian',
        weight: 1.6,
        blend: [
          { ref: 'mediterranean', weight: 40 },
          { ref: 'west-african', weight: 33 },
          { ref: 'amazonian', weight: 15 },
          { ref: 'western-european', weight: 12 },
        ],
      },
      {
        id: 'peruvian',
        label: 'Peruvian',
        blend: [
          { ref: 'andean', weight: 60 },
          { ref: 'mediterranean', weight: 35 },
          { ref: 'west-african', weight: 5 },
        ],
      },
      {
        id: 'colombian',
        label: 'Colombian',
        blend: [
          { ref: 'mediterranean', weight: 45 },
          { ref: 'west-african', weight: 25 },
          { ref: 'mesoamerican', weight: 20 },
          { ref: 'andean', weight: 10 },
        ],
      },
      {
        id: 'venezuelan',
        label: 'Venezuelan',
        blend: [
          { ref: 'mediterranean', weight: 45 },
          { ref: 'west-african', weight: 30 },
          { ref: 'mesoamerican', weight: 15 },
          { ref: 'amazonian', weight: 10 },
        ],
      },
      {
        id: 'argentine',
        label: 'Argentine',
        aliases: ['argentinian', 'argentinean'],
        blend: [
          { ref: 'mediterranean', weight: 50 },
          { ref: 'western-european', weight: 25 },
          { ref: 'eastern-european', weight: 15 },
          { ref: 'mesoamerican', weight: 10 },
        ],
      },
      {
        id: 'chilean',
        label: 'Chilean',
        blend: [
          { ref: 'mediterranean', weight: 48 },
          { ref: 'mesoamerican', weight: 42 },
          { ref: 'andean', weight: 10 },
        ],
      },
      {
        id: 'dominican',
        label: 'Dominican',
        aliases: ['dominican republic'],
        blend: [
          { ref: 'west-african', weight: 50 },
          { ref: 'mediterranean', weight: 40 },
          { ref: 'amazonian', weight: 10 },
        ],
      },
      {
        id: 'cuban',
        label: 'Cuban',
        blend: [
          { ref: 'mediterranean', weight: 55 },
          { ref: 'west-african', weight: 40 },
          { ref: 'amazonian', weight: 5 },
        ],
      },
      {
        id: 'puerto-rican',
        label: 'Puerto Rican',
        aliases: ['boricua'],
        blend: [
          { ref: 'mediterranean', weight: 50 },
          { ref: 'west-african', weight: 38 },
          { ref: 'amazonian', weight: 12 },
        ],
      },
    ],
  },
  {
    // African diaspora of the New World — characteristic Creole/mulatto blends,
    // predominantly West African with European (and some Indigenous in the Caribbean).
    id: 'african-diaspora',
    label: 'African Diaspora',
    aliases: ['afro-descendant', 'new world african'],
    children: [
      {
        id: 'african-american',
        label: 'African American',
        aliases: ['black american'],
        weight: 1.3,
        blend: [
          { ref: 'west-african', weight: 80 },
          { ref: 'western-european', weight: 15 },
          { ref: 'mediterranean', weight: 5 },
        ],
      },
      {
        id: 'jamaican',
        label: 'Jamaican',
        aliases: ['afro-caribbean'],
        blend: [
          { ref: 'west-african', weight: 88 },
          { ref: 'british-isles', weight: 12 },
        ],
      },
      {
        id: 'haitian',
        label: 'Haitian',
        blend: [
          { ref: 'west-african', weight: 92 },
          { ref: 'mediterranean', weight: 8 },
        ],
      },
    ],
  },
  {
    id: 'pacific-islander',
    label: 'Pacific Islander',
    aliases: ['oceanian', 'islander', 'polynesian', 'pacific'],
    attractiveness: ATTR_BROAD_HIGH,
    population: {
      hairColor: { black: 74, 'dark-brown': 22, brown: 4 },
      irisColor: { 'dark-brown': 72, brown: 26, hazel: 2 },
    },
    children: [
      {
        id: 'polynesian',
        label: 'Polynesian',
        aliases: ['samoan', 'tongan', 'maori', 'hawaiian', 'tahitian'],
        weight: 1.3,
        population: {
          skinTone: {
            light: 6,
            medium: 18,
            tan: 34,
            brown: 34,
            'dark-brown': 8,
          },
          build: { athletic: 30, average: 34, heavy: 30, slim: 6 },
          faceShape: {
            round: 28,
            square: 22,
            oval: 22,
            heart: 14,
            diamond: 8,
            rectangular: 3,
            triangle: 2,
            trapezoid: 1,
          },
          hairTexture: { straight: 34, wavy: 44, curly: 22 },
          noseWidth: { narrow: 18, medium: 48, wide: 34 },
        },
      },
      {
        id: 'melanesian',
        label: 'Melanesian',
        aliases: ['fijian', 'papua', 'new guinean', 'solomon islander'],
        population: {
          skinTone: { tan: 12, brown: 30, 'dark-brown': 34, deep: 24 },
          hairTexture: { coily: 54, curly: 38, wavy: 8 },
        },
      },
      {
        id: 'micronesian',
        label: 'Micronesian',
        aliases: ['chamorro', 'marshallese'],
        population: {
          skinTone: {
            light: 8,
            medium: 22,
            tan: 34,
            brown: 30,
            'dark-brown': 6,
          },
        },
      },
      {
        // Aboriginal Australian — a distinct heritage cluster. (Modern "Australian"
        // and "New Zealander" are NOT nodes: their looks are British-descended
        // [british-isles], Māori/Polynesian [polynesian], or this.)
        id: 'aboriginal-australian',
        label: 'Aboriginal Australian',
        aliases: [
          'aboriginal',
          'indigenous australian',
          'first nations australian',
        ],
        population: {
          skinTone: { tan: 10, brown: 30, 'dark-brown': 36, deep: 24 },
          hairColor: { black: 68, 'dark-brown': 26, brown: 6 },
          hairTexture: { wavy: 44, curly: 40, coily: 10, straight: 6 },
          irisColor: { 'dark-brown': 78, brown: 20, hazel: 2 },
          noseWidth: { narrow: 14, medium: 44, wide: 42 },
          browRidge: { flat: 20, moderate: 46, heavy: 34 },
        },
      },
    ],
  },
];

/* ─────────────────────────────── Index + lookup ──────────────────────────── */
interface Indexed {
  node: AncestryNode;
  parent?: AncestryNode;
  /** Nearest ancestor (incl. self) whose id is a broad enum ancestry. */
  enumAncestry: string;
  /** Accumulated overlays root → node. */
  population: AncestryOverlay;
  attractiveness: AncestryOverlay;
}

const BY_ID = new Map<string, Indexed>();
const BY_ALIAS = new Map<string, AncestryNode>();
const LEAVES: AncestryNode[] = [];

function register(key: string, node: AncestryNode): void {
  const k = key.trim().toLowerCase();
  if (k && !BY_ALIAS.has(k)) BY_ALIAS.set(k, node);
}

function walk(
  node: AncestryNode,
  parent: AncestryNode | undefined,
  enumFromAbove: string | undefined,
  popAbove: AncestryOverlay,
  attrAbove: AncestryOverlay
): void {
  const enumAncestry = ENUM_ANCESTRIES.has(node.id)
    ? node.id
    : (enumFromAbove ?? 'mixed');
  const population = { ...popAbove, ...(node.population ?? {}) };
  const attractiveness = { ...attrAbove, ...(node.attractiveness ?? {}) };
  BY_ID.set(node.id, {
    node,
    parent,
    enumAncestry,
    population,
    attractiveness,
  });
  register(node.id, node);
  register(node.label, node);
  for (const a of node.aliases ?? []) register(a, node);
  if (node.children && node.children.length > 0) {
    for (const c of node.children)
      walk(c, node, enumAncestry, population, attractiveness);
  } else {
    LEAVES.push(node);
  }
}
for (const root of ANCESTRY_FOREST) walk(root, undefined, undefined, {}, {});

/** Find a node by id / label / alias (case-insensitive), else undefined. */
function matchNode(name?: string): AncestryNode | undefined {
  if (!name) return undefined;
  return BY_ALIAS.get(name.trim().toLowerCase());
}

/** Weighted-random pick among a node's children. */
function pickChild(node: AncestryNode, rng: Rng): AncestryNode {
  const kids = node.children!;
  const total = kids.reduce((s, k) => s + (k.weight ?? 1), 0);
  let r = rng() * total;
  for (const k of kids) {
    r -= k.weight ?? 1;
    if (r <= 0) return k;
  }
  return kids[kids.length - 1]!;
}

/** Descend a stem to a concrete leaf (weighted, seeded); a leaf returns itself. */
function descendToLeaf(node: AncestryNode, rng: Rng): AncestryNode {
  let cur = node;
  while (cur.children && cur.children.length > 0) cur = pickChild(cur, rng);
  return cur;
}

/** Pick any leaf in the whole tree, weighted by root then down. */
function randomLeaf(rng: Rng): AncestryNode {
  const total = ANCESTRY_FOREST.reduce((s, n) => s + (n.weight ?? 1), 0);
  let r = rng() * total;
  let root = ANCESTRY_FOREST[0]!;
  for (const n of ANCESTRY_FOREST) {
    root = n;
    r -= n.weight ?? 1;
    if (r <= 0) break;
  }
  return descendToLeaf(root, rng);
}

/** A single heritage-cluster contribution to a (possibly admixed) person. */
export interface ResolvedComponent {
  label: string;
  enumAncestry: string;
  /** Relative share in the blend (per-person ancestry fraction is drawn from these). */
  weight: number;
  population: AncestryOverlay;
  attractiveness: AncestryOverlay;
}

/** A single ancestry reference the caller may pass for a (possibly mixed) person. */
export interface AncestryRef {
  ancestry?: string;
  subPopulation?: string;
}

export interface AncestryResolution {
  /** Display label for the prose (`ancestryNote`). */
  label: string;
  /** The FaceSpec `ancestry` enum: a single cluster's enum, or 'mixed'. */
  enumAncestry: string;
  /** One component for a pure cluster; several for an admixed / user-mixed person. */
  components: ResolvedComponent[];
}

/** A concrete cluster node → its component (accumulated overlays from the index). */
function clusterComponent(
  node: AncestryNode,
  weight: number
): ResolvedComponent {
  const idx = BY_ID.get(node.id)!;
  return {
    label: node.label,
    enumAncestry: idx.enumAncestry,
    weight,
    population: idx.population,
    attractiveness: idx.attractiveness,
  };
}

/** Expand a leaf into its weighted components: an admixed recipe, or a lone cluster. */
function leafComponents(leaf: AncestryNode, rng: Rng): ResolvedComponent[] {
  if (nodeKind(leaf) === 'admixed' && leaf.blend && leaf.blend.length > 0) {
    return leaf.blend.map(({ ref, weight }) => {
      // Recipes name clusters; if a ref lands on a group, descend it to a leaf.
      const target = descendToLeaf(matchNode(ref) ?? leaf, rng);
      return clusterComponent(target, weight);
    });
  }
  return [clusterComponent(leaf, 1)];
}

/** Scale component weights (so two mixed sides can be balanced 50/50). */
function scale(
  components: ResolvedComponent[],
  factor: number
): ResolvedComponent[] {
  return components.map((c) => ({ ...c, weight: c.weight * factor }));
}

/** Resolve one ancestry reference to a (display label, weighted components). */
function resolveRef(
  ref: AncestryRef,
  rng: Rng
): { label: string; components: ResolvedComponent[] } | undefined {
  const matched = matchNode(ref.subPopulation);
  const base = matched ?? matchNode(ref.ancestry);
  if (!base) return undefined;
  // A free-text sub-population we don't recognise: keep its label, but borrow the
  // named broad ancestry's distribution — no random descent.
  if (!matched && ref.subPopulation?.trim()) {
    const label = ref.subPopulation.trim();
    const idx = BY_ID.get(base.id)!;
    return {
      label,
      components: [
        {
          label,
          enumAncestry: idx.enumAncestry,
          weight: 1,
          population: idx.population,
          attractiveness: idx.attractiveness,
        },
      ],
    };
  }
  const leaf = descendToLeaf(base, rng);
  return { label: leaf.label, components: leafComponents(leaf, rng) };
}

const mixedEnum = (components: ResolvedComponent[]): string =>
  components.length === 1 ? components[0]!.enumAncestry : 'mixed';

/**
 * Resolve the demographics' ancestry into a weighted set of heritage-cluster
 * components, descending stems at random. One component = a pure cluster; several =
 * an admixed national group (recipe) or an explicit user mix. Returns null when
 * there is no ancestry information at all (the caster keeps its default behaviour).
 */
export function resolveAncestry(
  demo: Demographics & { mix?: AncestryRef[] },
  rng: Rng
): AncestryResolution | null {
  // Explicit two-parent mix: resolve each side, balance 50/50, concatenate.
  if (demo.mix && demo.mix.length >= 2) {
    const a = resolveRef(demo.mix[0]!, rng);
    const b = resolveRef(demo.mix[1]!, rng);
    const sides = [a, b].filter(Boolean) as {
      label: string;
      components: ResolvedComponent[];
    }[];
    if (sides.length === 2) {
      return {
        label: `${sides[0]!.label} / ${sides[1]!.label}`,
        enumAncestry: 'mixed',
        components: [
          ...scale(sides[0]!.components, 0.5),
          ...scale(sides[1]!.components, 0.5),
        ],
      };
    }
    if (sides.length === 1)
      return {
        label: sides[0]!.label,
        enumAncestry: mixedEnum(sides[0]!.components),
        components: sides[0]!.components,
      };
    return null;
  }

  const single: AncestryRef =
    demo.mix && demo.mix.length === 1
      ? demo.mix[0]!
      : { ancestry: demo.ancestry, subPopulation: demo.subPopulation };

  // `mixed` with no explicit sides → two random, distinct leaves, balanced 50/50.
  if (single.ancestry === 'mixed' && !matchNode(single.subPopulation)) {
    const a = randomLeaf(rng);
    let b = randomLeaf(rng);
    for (let i = 0; i < 6 && b.id === a.id; i++) b = randomLeaf(rng);
    return {
      label: `${a.label} / ${b.label}`,
      enumAncestry: 'mixed',
      components: [
        ...scale(leafComponents(a, rng), 0.5),
        ...scale(leafComponents(b, rng), 0.5),
      ],
    };
  }

  const r = resolveRef(single, rng);
  if (!r) return null;
  return {
    label: r.label,
    enumAncestry: mixedEnum(r.components),
    components: r.components,
  };
}

/** How concentrated the per-person ancestry fraction is (higher = closer to the mean blend). */
export const BLEND_CONCENTRATION = 3;

/**
 * Draw ONE per-individual ancestry fraction over the components (a point on the
 * simplex). Drawn once per face and shared by the population and attractiveness
 * blends, so the whole face leans the same ancestry — and a batch spans the real
 * range (some faces near one parent, some evenly mixed).
 */
export function sampleAncestryFraction(
  weights: number[],
  rng: Rng,
  kappa = BLEND_CONCENTRATION
): number[] {
  return dirichlet(
    weights.map((w) => Math.max(w, 1e-6) * kappa),
    rng
  );
}

/**
 * Blend parent distributions into one using a given ancestry fraction `alpha`: for
 * each trait, pick a parent that has an opinion with probability proportional to its
 * alpha. (One trait per parent, so the result is coherent, never muddy.)
 */
export function blendByFraction(
  parents: FaceDistributions[],
  alpha: number[],
  rng: Rng
): FaceDistributions {
  if (parents.length === 1) return parents[0]!;
  const out: FaceDistributions = {};
  const keys = new Set<string>();
  for (const p of parents) for (const k of Object.keys(p)) keys.add(k);
  for (const key of keys) {
    const k = key as FaceFeatureKey;
    const avail: {
      d: NonNullable<FaceDistributions[FaceFeatureKey]>;
      a: number;
    }[] = [];
    for (let i = 0; i < parents.length; i++) {
      const d = parents[i]![k];
      if (d) avail.push({ d, a: alpha[i] ?? 0 });
    }
    if (avail.length === 0) continue;
    const total = avail.reduce((s, x) => s + x.a, 0);
    if (total <= 0) {
      out[k] = avail[Math.floor(rng() * avail.length)]!.d;
      continue;
    }
    let r = rng() * total;
    let chosen = avail[0]!.d;
    for (const x of avail) {
      r -= x.a;
      if (r <= 0) {
        chosen = x.d;
        break;
      }
    }
    out[k] = chosen;
  }
  return out;
}

/**
 * Back-compat: an equal-weight two-parent blend (per-trait inheritance). Kept for
 * callers of the old API; prefer `sampleAncestryFraction` + `blendByFraction`.
 */
export function mixDistributions(
  a: FaceDistributions,
  b: FaceDistributions,
  rng: Rng
): FaceDistributions {
  return blendByFraction([a, b], sampleAncestryFraction([1, 1], rng), rng);
}
