import { z } from 'zod';
import type { FaceFeatureKey } from '../face/index.js';
import { demographicsSchema } from '../demographics/index.js';

/**
 * The distribution endpoint / internal caster: given {@link Demographics}, it
 * returns, for each enum FaceSpec feature, a probability distribution over that
 * feature's values (age/health/sex/ancestry modifiers already applied). The
 * generate flow SAMPLES from these to fill any trait the caller left unset — so
 * each generated image re-draws, giving real-world variety instead of the
 * model's attractive mean. The endpoint describes the odds; it does not pick.
 *
 * Probabilities within one trait should sum to ~1 (consumers normalize
 * defensively). Demographically-neutral traits return their global prior.
 */

/** One trait's odds: value -> probability in [0,1]. */
export const traitDistributionSchema = z.record(
  z.string(),
  z.number().min(0).max(1)
);
export type TraitDistribution = Record<string, number>;

/** Per-feature distributions, keyed by FaceSpec enum feature. */
export const faceDistributionsSchema = z.record(
  z.string(),
  traitDistributionSchema
);
export type FaceDistributions = Partial<
  Record<FaceFeatureKey, TraitDistribution>
>;

/** Request: the demographics to build a distribution for (all optional). */
export const distributionRequestSchema = demographicsSchema;
export type DistributionRequest = z.infer<typeof distributionRequestSchema>;

export interface DistributionResponse {
  /** The demographics the distribution was built for (echoed, possibly resolved). */
  demographics: z.infer<typeof demographicsSchema>;
  /** Per-feature probability maps the caster samples from. */
  distributions: FaceDistributions;
}
