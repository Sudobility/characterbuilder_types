import { z } from 'zod';
import { faceSpecSchema } from '../face/index.js';

/**
 * A saved Character: a named FaceSpec the user keeps and iterates on. This is the
 * CRUD entity persisted by `characterbuilder_api` (Postgres). Generated images
 * reference a character by id; `previewImageId` points at the user's chosen hero
 * image for the card/thumbnail.
 */
export interface Character {
  id: string;
  name: string;
  role: string | null;
  notes: string | null;
  spec: z.infer<typeof faceSpecSchema>;
  previewImageId: string | null;
  createdAt: string;
  updatedAt: string;
}

export const createCharacterRequestSchema = z.object({
  name: z.string().trim().min(1).max(120),
  role: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(4000).optional(),
  spec: faceSpecSchema.default({}),
});
export type CreateCharacterRequest = z.infer<
  typeof createCharacterRequestSchema
>;

/** PATCH: every field optional; omitted fields are left unchanged. */
export const updateCharacterRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    role: z.string().trim().max(200).nullable().optional(),
    notes: z.string().trim().max(4000).nullable().optional(),
    spec: faceSpecSchema.optional(),
    previewImageId: z.string().nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: 'At least one field must be provided',
  });
export type UpdateCharacterRequest = z.infer<
  typeof updateCharacterRequestSchema
>;
