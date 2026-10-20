import { z } from 'zod';
import { referenceImageSchema } from '../generation/index.js';

/**
 * The staged "sheet" pipeline, layered on top of single-image generation:
 *
 *   headshot ──▶ head sheet (8 directions) ──▶ body sheet (underwear) ──▶ clothed sheet
 *
 * Each stage conditions on a SELECTED image from the previous one (a stored
 * image id) plus a little stage-specific input, and the provider returns the
 * whole sheet in one call. Stage 1 can instead start from an UPLOADED headshot
 * (a `data:` reference image).
 */

/** The non-face generation kinds. `face` (the original flow) is the default. */
export const SHEET_KINDS = [
  'head-sheet',
  'body-sheet',
  'clothed-sheet',
] as const;
export const sheetKindSchema = z.enum(SHEET_KINDS);
export type SheetKind = z.infer<typeof sheetKindSchema>;

/** Every `generations.kind` value: the original face flow plus the sheet stages. */
export const GENERATION_KINDS = ['face', ...SHEET_KINDS] as const;
export const generationKindSchema = z.enum(GENERATION_KINDS);
export type GenerationKind = z.infer<typeof generationKindSchema>;

/** The eight head directions of a turnaround sheet, clockwise from front. */
export const HEAD_DIRECTIONS = [
  'front',
  'front-right',
  'right',
  'back-right',
  'back',
  'back-left',
  'left',
  'front-left',
] as const;
export type HeadDirection = (typeof HEAD_DIRECTIONS)[number];

/** Body-sheet views (front / back / side of the same body). */
export const BODY_VIEWS = ['front', 'back', 'side'] as const;
export type BodyView = (typeof BODY_VIEWS)[number];

/** How many images each stage is expected to return (credits reserved up front; settled to actual). */
export const SHEET_EXPECTED_COUNT: Record<SheetKind, number> = {
  'head-sheet': HEAD_DIRECTIONS.length,
  'body-sheet': BODY_VIEWS.length,
  'clothed-sheet': BODY_VIEWS.length,
};

/** The ordered role labels a stage's images are tagged with, by index. */
export const SHEET_ROLES: Record<SheetKind, readonly string[]> = {
  'head-sheet': HEAD_DIRECTIONS,
  'body-sheet': BODY_VIEWS,
  'clothed-sheet': BODY_VIEWS,
};

/* ── Stage inputs ── */

export const HAIR_FULLNESS = [
  'auto',
  'bald',
  'thin',
  'medium',
  'full',
  'very-full',
] as const;
export const headSheetTraitsSchema = z.object({
  /** How full/voluminous the hair is across the turnaround. */
  hairFullness: z.enum(HAIR_FULLNESS).optional(),
  /** Marks, patterns or features on the back/sides of the head. */
  marksBehindHead: z.string().trim().max(400).optional(),
  /** Any other guidance for the head sheet. */
  note: z.string().trim().max(600).optional(),
});
export type HeadSheetTraits = z.infer<typeof headSheetTraitsSchema>;

export const BODY_SHAPES = [
  'auto',
  'slim',
  'average',
  'athletic',
  'curvy',
  'heavy',
] as const;
export const MUSCLE_LEVELS = [
  'auto',
  'low',
  'average',
  'toned',
  'muscular',
  'very-muscular',
] as const;
export const bodySpecSchema = z.object({
  heightCm: z.coerce.number().int().min(80).max(260).optional(),
  weightKg: z.coerce.number().int().min(20).max(400).optional(),
  bodyShape: z.enum(BODY_SHAPES).optional(),
  muscle: z.enum(MUSCLE_LEVELS).optional(),
  /** Any other guidance for the body (proportions, posture, …). */
  note: z.string().trim().max(600).optional(),
});
export type BodySpec = z.infer<typeof bodySpecSchema>;

export const wardrobeSpecSchema = z.object({
  /** Free-text description of the outfit(s) to dress the body in. */
  description: z.string().trim().min(1).max(1200),
  /** Optional one-line style tag (e.g. "1920s formal"). */
  style: z.string().trim().max(300).optional(),
});
export type WardrobeSpec = z.infer<typeof wardrobeSpecSchema>;

/* ── Requests ── */

const baseSheetFields = {
  /** Optional character this sheet belongs to (for history/attribution). */
  characterId: z.string().optional(),
  /** Client-supplied key so a retried request never double-charges. */
  idempotencyKey: z.string().trim().min(8).max(200).optional(),
};

/**
 * Stage request. A discriminated union by `kind`; the "exactly one source"
 * rule for a head sheet (uploaded `referenceImage` OR selected `sourceImageId`)
 * is enforced in the service, since a `.refine` would break the discriminator.
 */
export const sheetRequestSchema = z.discriminatedUnion('kind', [
  z.object({
    ...baseSheetFields,
    kind: z.literal('head-sheet'),
    /** A stored image to condition on (a headshot the user picked). */
    sourceImageId: z.string().optional(),
    /** …or an uploaded headshot as a data URL. Exactly one of the two. */
    referenceImage: referenceImageSchema.optional(),
    traits: headSheetTraitsSchema.optional(),
  }),
  z.object({
    ...baseSheetFields,
    kind: z.literal('body-sheet'),
    /** The selected head-sheet image to build the body from (required). */
    sourceImageId: z.string(),
    body: bodySpecSchema.default({}),
  }),
  z.object({
    ...baseSheetFields,
    kind: z.literal('clothed-sheet'),
    /** The selected body-sheet image to dress (required). */
    sourceImageId: z.string(),
    wardrobe: wardrobeSpecSchema,
  }),
]);
export type SheetRequest = z.infer<typeof sheetRequestSchema>;
export type SheetRequestInput = z.input<typeof sheetRequestSchema>;
