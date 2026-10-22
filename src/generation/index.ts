import { z } from 'zod';
import { faceSpecSchema, type FaceSpec } from '../face/index.js';
import { demographicsSchema } from '../demographics/index.js';

/**
 * Generation: compose a prompt from a FaceSpec and render N images through
 * `shapeshyft_api`. A request may name a saved character (`characterId`) or
 * carry an inline `spec` (for unsaved tweaking) — exactly one of the two.
 */

/** Framing of the shot the image should depict. */
export const SHOTS = [
  'headshot',
  'bust',
  'three-quarter',
  'full-length',
] as const;
export const shotSchema = z.enum(SHOTS);
export type Shot = z.infer<typeof shotSchema>;

/** Expression to render (independent of the FaceSpec, which is identity). */
export const EXPRESSIONS = [
  'neutral',
  'slight-smile',
  'smile',
  'serious',
  'surprised',
  'thoughtful',
] as const;
export const expressionSchema = z.enum(EXPRESSIONS);
export type Expression = z.infer<typeof expressionSchema>;

/** Output aspect/size presets (the backend maps these to shapeshyft params). */
export const IMAGE_SIZES = ['square', 'portrait', 'landscape'] as const;
export const imageSizeSchema = z.enum(IMAGE_SIZES);
export type ImageSize = z.infer<typeof imageSizeSchema>;

export const generationParamsSchema = z.object({
  count: z.coerce.number().int().min(1).max(10).default(1),
  size: imageSizeSchema.default('portrait'),
  shot: shotSchema.default('headshot'),
  expression: expressionSchema.default('neutral'),
  /** Optional deterministic seed; omitted = random each time. */
  seed: z.number().int().min(0).optional(),
  /** Free-text styling appended to the composed prompt (e.g. lighting). */
  styleNote: z.string().trim().max(600).optional(),
  /**
   * "Look" level as a fraction, 0..1: the share of unset traits cast to the MOST
   * COMMON ("beautiful") value for the demographic; the rest are sampled. 0 = full
   * variety; 1 = the most typical face; 0.9 ≈ 90% typical. The UI exposes it as a
   * 1–10 "Look" scale (plus "Any" = 0). Default 0.7 (Look 7).
   */
  conformity: z.coerce.number().min(0).max(1).default(0.7),
});
export type GenerationParams = z.infer<typeof generationParamsSchema>;

/** A data-URL reference image to condition on (same shape screenwriter uses). */
export const referenceImageSchema = z
  .string()
  .startsWith('data:image/')
  .max(15_000_000);

export const generateRequestSchema = z.object({
  /**
   * The owning character. With no `spec`, its saved spec is rendered. WITH a
   * `spec` (the editor's live draft), the draft is rendered but the generation
   * is still ASSOCIATED with this character — so its images show up in the
   * character's gallery and link back to it.
   */
  characterId: z.string().optional(),
  /** Partial FaceSpec: any trait left unset is CAST by the API before render. */
  spec: faceSpecSchema.optional(),
  /** Demographics that steer the casting of unset traits (race/age/health…). */
  demographics: demographicsSchema.optional(),
  params: generationParamsSchema.default({
    count: 1,
    size: 'portrait',
    shot: 'headshot',
    expression: 'neutral',
    conformity: 0.7,
  }),
  referenceImage: referenceImageSchema.optional(),
  /** Client-supplied key so a retried request never double-charges. */
  idempotencyKey: z.string().trim().min(8).max(200).optional(),
});
export type GenerateRequest = z.infer<typeof generateRequestSchema>;
/** The request shape a CLIENT sends (params optional; the server defaults them). */
export type GenerateRequestInput = z.input<typeof generateRequestSchema>;

/** Compose-only request: same inputs, but returns the prompt and charges nothing. */
export const composeRequestSchema = z
  .object({
    characterId: z.string().optional(),
    spec: faceSpecSchema.optional(),
    params: generationParamsSchema.partial().optional(),
  })
  .refine((v) => Boolean(v.characterId) !== Boolean(v.spec), {
    message: 'Provide exactly one of characterId or spec',
    path: ['spec'],
  });
export type ComposeRequest = z.infer<typeof composeRequestSchema>;
export type ComposeRequestInput = z.input<typeof composeRequestSchema>;

export interface ComposeResponse {
  /** The natural-language prompt the spec + params compose to. */
  prompt: string;
}

/**
 * Describe-to-spec: the user writes a free-text description of a face ("a weathered
 * fisherman in his 60s, deep-set grey eyes, broad nose…") and the API's LLM maps it
 * onto the structured FaceSpec vocabulary. The returned spec is a partial — only the
 * traits the description implies are set; the rest stay unset (cast at generation).
 */
export const describeRequestSchema = z.object({
  /** Free-text description of the character's appearance. */
  description: z.string().trim().min(1).max(4000),
  /** Optional demographics to disambiguate traits the text leaves open. */
  demographics: demographicsSchema.optional(),
});
export type DescribeRequest = z.infer<typeof describeRequestSchema>;

export interface DescribeResponse {
  /** The (partial) FaceSpec inferred from the description. */
  spec: FaceSpec;
}

/**
 * Analyze-to-spec: the user uploads a headshot and a vision LLM reads the face
 * into the structured FaceSpec vocabulary (the inverse of generation). Like
 * describe, the returned spec is a partial — only the traits the photo shows.
 */
export const analyzeRequestSchema = z.object({
  /** The headshot to analyze, as a `data:image/...;base64,...` URL. */
  image: referenceImageSchema,
  /** Optional demographics to disambiguate traits the photo leaves ambiguous. */
  demographics: demographicsSchema.optional(),
});
export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;

/** Same shape as describe: the (partial) FaceSpec read from the image. */
export type AnalyzeResponse = DescribeResponse;

export const GENERATION_STATUSES = [
  'pending',
  'running',
  'succeeded',
  'failed',
] as const;
export type GenerationStatus = (typeof GENERATION_STATUSES)[number];

export interface GeneratedImage {
  id: string;
  mimeType: string;
  /** Resolvable URL for the stored image bytes. */
  url: string;
  width: number | null;
  height: number | null;
  /**
   * The fully-cast FaceSpec that produced THIS image. Generation is ephemeral,
   * so this is how a caller can inspect — or save as a character — a face they
   * liked. Absent on older rows generated before per-image specs were recorded.
   */
  spec?: FaceSpec;
  /** The prose prompt this specific image was rendered from. */
  prompt?: string;
  /**
   * For a sheet generation, this image's view/direction label (e.g. `front`,
   * `back-left`). Absent on single-image (`face`) generations.
   */
  role?: string;
}

/** A completed (or failed) generation record, persisted for history. */
export interface Generation {
  id: string;
  characterId: string | null;
  prompt: string;
  params: GenerationParams;
  status: GenerationStatus;
  images: GeneratedImage[];
  creditsSpent: number;
  /** Set only when status is 'failed'. */
  error: string | null;
  createdAt: string;
  /** What kind of generation this is: the single-image `face` flow, or a sheet stage. */
  kind?: string;
  /** For a sheet stage, the prior image id it was conditioned on. */
  sourceImageId?: string | null;
}
