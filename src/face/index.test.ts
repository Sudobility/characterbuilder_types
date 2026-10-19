import { describe, it, expect } from 'vitest';
import { FACE_FEATURE_VALUES, faceSpecSchema, type FaceSpec } from './index.js';
import { demographicsSchema } from '../demographics/index.js';
import {
  distributionRequestSchema,
  faceDistributionsSchema,
} from '../distribution/index.js';

describe('FaceSpec vocabulary', () => {
  it('has a comprehensive set of enum features', () => {
    // Guards against accidental shrink of the vocabulary.
    expect(Object.keys(FACE_FEATURE_VALUES).length).toBeGreaterThanOrEqual(100);
  });

  it('every FACE_FEATURE_VALUES key is a real schema field with valid values', () => {
    // Assigning each feature its first allowed value must parse cleanly — this
    // keeps the caster's value map in lockstep with the Zod schema.
    const spec: Record<string, string> = {};
    for (const [key, values] of Object.entries(FACE_FEATURE_VALUES)) {
      spec[key] = values[0]!;
    }
    const parsed = faceSpecSchema.safeParse(spec);
    expect(parsed.success).toBe(true);
  });

  it('accepts a spec with every feature set to its LAST allowed value too', () => {
    const spec: Record<string, string> = {};
    for (const [key, values] of Object.entries(FACE_FEATURE_VALUES)) {
      spec[key] = values[values.length - 1]!;
    }
    expect(faceSpecSchema.safeParse(spec).success).toBe(true);
  });

  it('rejects unknown feature keys (strict)', () => {
    const bad = { notAFeature: 'x' } as unknown as FaceSpec;
    expect(faceSpecSchema.safeParse(bad).success).toBe(false);
  });

  it('models the eye sub-dials the brief called out', () => {
    for (const key of [
      'lidCrease',
      'lidFoldHeight',
      'orbitalDepth',
      'lashLength',
      'lashDensity',
    ] as const) {
      expect(key in FACE_FEATURE_VALUES).toBe(true);
    }
    expect(FACE_FEATURE_VALUES.lidCrease).toContain('triple');
  });

  it('accepts the multi-select arrays', () => {
    const spec: FaceSpec = {
      skinMarks: ['freckles', 'moles'],
      wrinkleAreas: ['forehead', 'crows-feet'],
    };
    expect(faceSpecSchema.safeParse(spec).success).toBe(true);
  });
});

describe('demographics & distribution schemas', () => {
  it('accepts an empty demographics object (global prior)', () => {
    expect(demographicsSchema.safeParse({}).success).toBe(true);
  });

  it('accepts ancestry + sub-population + health', () => {
    const d = {
      ancestry: 'east-asian',
      subPopulation: 'Korean',
      sex: 'female',
      ageBand: 'thirties',
      health: 'healthy',
    };
    expect(distributionRequestSchema.safeParse(d).success).toBe(true);
  });

  it('rejects an unknown health state', () => {
    expect(demographicsSchema.safeParse({ health: 'immortal' }).success).toBe(
      false
    );
  });

  it('validates a per-feature distribution map', () => {
    const dist = {
      lidType: { monolid: 0.6, double: 0.35, hooded: 0.05 },
      irisColor: { 'dark-brown': 0.9, brown: 0.1 },
    };
    expect(faceDistributionsSchema.safeParse(dist).success).toBe(true);
  });

  it('rejects a probability outside [0,1]', () => {
    expect(
      faceDistributionsSchema.safeParse({ eyeSize: { large: 1.4 } }).success
    ).toBe(false);
  });
});
