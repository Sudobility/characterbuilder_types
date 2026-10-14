import { z } from 'zod';
import { faceSpecSchema } from '../face/index.js';

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
  count: z.coerce.number().int().min(1).max(4).default(1),
  size: imageSizeSchema.default('portrait'),
  shot: shotSchema.default('headshot'),
  expression: expressionSchema.default('neutral'),
  /** Optional deterministic seed; omitted = random each time. */
  seed: z.number().int().min(0).optional(),
  /** Free-text styling appended to the composed prompt (e.g. lighting). */
  styleNote: z.string().trim().max(600).optional(),
});
export type GenerationParams = z.infer<typeof generationParamsSchema>;

/** A data-URL reference image to condition on (same shape screenwriter uses). */
export const referenceImageSchema = z
  .string()
  .startsWith('data:image/')
  .max(15_000_000);

export const generateRequestSchema = z
  .object({
    characterId: z.string().optional(),
    spec: faceSpecSchema.optional(),
    params: generationParamsSchema.default({
      count: 1,
      size: 'portrait',
      shot: 'headshot',
      expression: 'neutral',
    }),
    referenceImage: referenceImageSchema.optional(),
    /** Client-supplied key so a retried request never double-charges. */
    idempotencyKey: z.string().trim().min(8).max(200).optional(),
  })
  .refine((v) => Boolean(v.characterId) !== Boolean(v.spec), {
    message: 'Provide exactly one of characterId or spec',
    path: ['spec'],
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
}
