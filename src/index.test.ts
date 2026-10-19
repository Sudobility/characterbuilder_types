import { describe, it, expect } from 'vitest';
import {
  faceSpecSchema,
  EMPTY_FACE_SPEC,
  FACE_SHAPES,
  createCharacterRequestSchema,
  updateCharacterRequestSchema,
  generateRequestSchema,
  composeRequestSchema,
  generationParamsSchema,
  successResponse,
  errorResponse,
  ERROR_STATUS,
  cursorQuerySchema,
  ROUTES,
  makeId,
  isId,
} from './index.js';
import { sampleFaceSpec, sampleCharacter } from './test/index.js';

describe('faceSpec', () => {
  it('accepts the empty spec', () => {
    expect(faceSpecSchema.parse(EMPTY_FACE_SPEC)).toEqual({});
  });

  it('validates the sample spec', () => {
    expect(() => faceSpecSchema.parse(sampleFaceSpec())).not.toThrow();
  });

  it('rejects unknown fields (strict)', () => {
    expect(() => faceSpecSchema.parse({ notAField: 'x' } as never)).toThrow();
  });

  it('rejects an out-of-range age', () => {
    expect(() => faceSpecSchema.parse({ ageYears: 200 })).toThrow();
  });

  it('exposes feature option arrays for the UI', () => {
    expect(FACE_SHAPES).toContain('oval');
    expect(FACE_SHAPES.length).toBeGreaterThan(4);
  });
});

describe('characters', () => {
  it('defaults an empty spec on create', () => {
    const parsed = createCharacterRequestSchema.parse({ name: 'Ada' });
    expect(parsed.spec).toEqual({});
  });

  it('requires at least one field on update', () => {
    expect(() => updateCharacterRequestSchema.parse({})).toThrow();
  });

  it('builds a valid sample character', () => {
    expect(sampleCharacter().id).toMatch(/^chr_/);
  });
});

describe('generation', () => {
  it('allows at most one of characterId or spec (neither is fine — fully cast)', () => {
    // Both together is the only disallowed combo.
    expect(() =>
      generateRequestSchema.parse({ characterId: 'chr_x', spec: {} })
    ).toThrow();
    // An empty request is valid: every trait is cast by the API.
    expect(() => generateRequestSchema.parse({})).not.toThrow();
    expect(() =>
      generateRequestSchema.parse({ characterId: 'chr_x' })
    ).not.toThrow();
    expect(() => generateRequestSchema.parse({ spec: {} })).not.toThrow();
    // Demographics may accompany a (partial) spec or stand alone.
    expect(() =>
      generateRequestSchema.parse({ demographics: { ancestry: 'east-asian' } })
    ).not.toThrow();
  });

  it('clamps count to 1..10', () => {
    expect(() => generationParamsSchema.parse({ count: 11 })).toThrow();
    expect(generationParamsSchema.parse({ count: 8 }).count).toBe(8);
    expect(generationParamsSchema.parse({}).count).toBe(1);
  });

  it('compose accepts a spec', () => {
    expect(() => composeRequestSchema.parse({ spec: {} })).not.toThrow();
  });
});

describe('api envelope', () => {
  it('wraps success and failure', () => {
    expect(successResponse(42)).toEqual({ success: true, data: 42 });
    const fail = errorResponse('nope', 'VALIDATION', { field: 'name' });
    expect(fail).toMatchObject({ success: false, code: 'VALIDATION' });
    expect(ERROR_STATUS.INSUFFICIENT_CREDITS).toBe(402);
  });

  it('parses cursor query defaults', () => {
    expect(cursorQuerySchema.parse({}).limit).toBe(50);
  });
});

describe('routes & ids', () => {
  it('builds parameterized routes', () => {
    expect(ROUTES.character('chr_1')).toBe('/characters/chr_1');
    expect(ROUTES.generate).toBe('/generate');
  });

  it('round-trips ids', () => {
    const id = makeId('generation', 'abc123');
    expect(id).toBe('gen_abc123');
    expect(isId('generation', id)).toBe(true);
    expect(isId('character', id)).toBe(false);
  });
});
