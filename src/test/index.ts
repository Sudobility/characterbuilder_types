/**
 * Test fixtures and builders, published as the `@sudobility/characterbuilder_types/test`
 * subpath so downstream packages (api, client, lib) can share one canonical sample
 * FaceSpec / Character instead of each hand-rolling their own.
 */
import type { FaceSpec } from '../face/index.js';
import type { Character } from '../specs/index.js';
import type { Generation } from '../generation/index.js';

/** A richly-specified sample FaceSpec touching most feature groups. */
export function sampleFaceSpec(overrides: Partial<FaceSpec> = {}): FaceSpec {
  return {
    faceShape: 'oval',
    facialProportion: 'leptoprosopic',
    browRidge: 'flat',
    eyeSize: 'large',
    eyeSpacing: 'wide-set',
    canthalTilt: 'positive',
    lidType: 'double',
    irisColor: 'hazel',
    noseBridge: 'convex',
    noseWidth: 'narrow',
    lipFullness: 'medium',
    mouthCorners: 'neutral',
    cheekboneHeight: 'high',
    jawWidth: 'narrow',
    chinShape: 'pointed',
    skinTone: 'fair',
    skinUndertone: 'cool',
    skinMarks: ['freckles'],
    hairTexture: 'wavy',
    hairColor: 'auburn',
    hairLength: 'long',
    hairStyle: 'natural',
    sex: 'female',
    ageBand: 'thirties',
    ancestry: 'european',
    asymmetry: 'subtle',
    distinguishingMark: 'small mole on the right cheek',
    ...overrides,
  };
}

export function sampleCharacter(overrides: Partial<Character> = {}): Character {
  return {
    id: 'chr_sample0001',
    name: 'Jane Doe',
    role: 'lead',
    notes: null,
    spec: sampleFaceSpec(),
    previewImageId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function sampleGeneration(
  overrides: Partial<Generation> = {}
): Generation {
  return {
    id: 'gen_sample0001',
    characterId: 'chr_sample0001',
    prompt: 'A photorealistic headshot of a woman...',
    params: {
      count: 1,
      size: 'portrait',
      shot: 'headshot',
      expression: 'neutral',
      artStyle: 'naturalistic',
      conformity: 0,
    },
    status: 'succeeded',
    images: [
      {
        id: 'img_sample0001',
        mimeType: 'image/png',
        url: 'https://example.invalid/img_sample0001.png',
        width: 1024,
        height: 1536,
      },
    ],
    creditsSpent: 1,
    error: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}
