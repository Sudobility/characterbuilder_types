import { z } from 'zod';
import {
  ageBandSchema,
  ancestrySchema,
  buildSchema,
  sexSchema,
} from '../face/index.js';

/**
 * Demographic inputs that STEER the casting distribution (see the distribution
 * endpoint). None of these are facial features themselves; they shift the odds
 * of the features in a FaceSpec:
 *  - ancestry (+ a free-text `subPopulation` to narrow, e.g. "Korean",
 *    "Southern Chinese") shapes most structural/coloring traits as tendencies;
 *  - sex shifts the dimorphic traits (brow ridge, jaw, lips, facial hair…);
 *  - age shifts hair (greying/thinning/balding), skin (wrinkles), soft-tissue
 *    descent, and tooth show;
 *  - health shifts skin color/condition and soft-tissue fullness;
 *  - build shifts face/neck fullness.
 *
 * Every field is optional: with nothing set the distribution is the global prior.
 */

export const HEALTH_STATES = [
  'healthy',
  'robust', // ruddy, good color, well-nourished
  'frail', // pale, thin, drawn
  'sickly', // pallid/sallow skin, dark under-eyes
  'weathered', // sun-damaged, deeply lined, outdoor life
] as const;
export const healthStateSchema = z.enum(HEALTH_STATES);
export type HealthState = z.infer<typeof healthStateSchema>;

export const demographicsSchema = z
  .object({
    ancestry: ancestrySchema.optional(),
    /** Free-text sub-population to narrow the ancestry (e.g. "Korean", "Igbo"). */
    subPopulation: z.string().trim().max(120).optional(),
    /**
     * Mixed ancestry: one or two parent references, each naming a broad `ancestry`
     * and/or a `subPopulation` at any level of the taxonomy (e.g. "Asian" or
     * "Northern Chinese"). Two entries → a half-and-half person whose traits are
     * inherited per-feature from a randomly chosen parent; one entry behaves like a
     * single ancestry. Supersedes the top-level `ancestry`/`subPopulation`.
     */
    mix: z
      .array(
        z
          .object({
            ancestry: ancestrySchema.optional(),
            subPopulation: z.string().trim().max(120).optional(),
          })
          .strict()
      )
      .min(1)
      .max(2)
      .optional(),
    sex: sexSchema.optional(),
    ageBand: ageBandSchema.optional(),
    ageYears: z.number().int().min(1).max(120).optional(),
    health: healthStateSchema.optional(),
    build: buildSchema.optional(),
  })
  .strict();
export type Demographics = z.infer<typeof demographicsSchema>;

/** An empty demographics object is valid (yields the global-prior distribution). */
export const EMPTY_DEMOGRAPHICS: Demographics = {};
