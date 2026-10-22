import { describe, it, expect } from 'vitest';
import {
  faceSpecSchema,
  EMPTY_FACE_SPEC,
  FACE_SHAPES,
  createCharacterRequestSchema,
  updateCharacterRequestSchema,
  generateRequestSchema,
  composeRequestSchema,
  describeRequestSchema,
  analyzeRequestSchema,
  sanitizeFaceSpec,
  applyFemaleFacialHairRule,
  castFaceSpec,
  mostLikely,
  attractivenessDistributions,
  NEUTRAL_DEFAULTS,
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
  it('accepts characterId and/or spec in any combination', () => {
    // characterId + spec together is valid: the inline (draft) spec is rendered
    // while the generation is ASSOCIATED with the character (its gallery).
    expect(() =>
      generateRequestSchema.parse({ characterId: 'chr_x', spec: {} })
    ).not.toThrow();
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

  it('describe requires a non-empty description', () => {
    expect(() => describeRequestSchema.parse({ description: '' })).toThrow();
    expect(() =>
      describeRequestSchema.parse({ description: 'a tall woman' })
    ).not.toThrow();
  });

  it('analyze requires a data-image URL', () => {
    expect(() =>
      analyzeRequestSchema.parse({ image: 'https://x/y.jpg' })
    ).toThrow();
    expect(() =>
      analyzeRequestSchema.parse({ image: 'data:image/jpeg;base64,abc' })
    ).not.toThrow();
  });
});

describe('sanitizeFaceSpec', () => {
  it('keeps valid enum traits and drops unknown keys / values', () => {
    const out = sanitizeFaceSpec({
      faceShape: 'oval', // valid enum
      eyeShape: 'definitely-not-a-value', // invalid enum value → dropped
      notARealTrait: 'x', // unknown key → dropped
    });
    expect(out.faceShape).toBe('oval');
    expect('eyeShape' in out).toBe(false);
    expect('notARealTrait' in (out as Record<string, unknown>)).toBe(false);
  });

  it('keeps a valid free-form field but drops an out-of-range one, without losing the rest', () => {
    const out = sanitizeFaceSpec({
      faceShape: 'round',
      ageYears: 999, // out of range → dropped on its own
      extraNotes: 'a faint scar over the left brow',
    });
    expect(out.faceShape).toBe('round');
    expect('ageYears' in out).toBe(false);
    expect(out.extraNotes).toContain('scar');
  });

  it('returns an empty spec for junk input', () => {
    expect(sanitizeFaceSpec(null)).toEqual({});
    expect(sanitizeFaceSpec('nope')).toEqual({});
    expect(sanitizeFaceSpec({ nothing: 'useful' })).toEqual({});
  });
});

describe('applyFemaleFacialHairRule', () => {
  it('clears facial hair for a female and leaves others alone', () => {
    const f = applyFemaleFacialHairRule({
      sex: 'female',
      facialHair: 'full-beard',
      facialHairDensity: 'full',
    } as never);
    expect(f.facialHair).toBe('clean-shaven');
    expect('facialHairDensity' in f).toBe(false);

    const m = { sex: 'male', facialHair: 'full-beard' } as never;
    expect(applyFemaleFacialHairRule(m)).toBe(m); // untouched (same ref)
    expect(applyFemaleFacialHairRule({})).toEqual({}); // unset sex untouched
  });
});

describe('Look (conformity) + attractiveness', () => {
  it('conformity 1 draws attractiveness-covered traits from the attractive support', () => {
    const demo = { ancestry: 'east-asian', sex: 'female' } as const;
    const attractiveness = attractivenessDistributions(demo);
    const { spec } = castFaceSpec({}, demo, {
      conformity: 1,
      attractiveness,
      seed: 1,
    });
    // Every trait our attractiveness model covers must land on a value that model
    // assigns non-zero probability (it was sampled from that distribution).
    for (const [trait, dist] of Object.entries(attractiveness)) {
      const v = (spec as Record<string, unknown>)[trait];
      if (v != null) expect(Object.keys(dist)).toContain(v as string);
    }
    // And the classic defect is gone: the no-distribution fallback is a neutral
    // default, never the enum's first value "unibrow".
    expect((spec as Record<string, unknown>).interBrowDistance).not.toBe(
      'unibrow'
    );
  });

  it('undistributed traits favour the neutral value, so the enum[0] extreme is rare', () => {
    // Over many seeds at Look 0 (no attractiveness), the neutral default should
    // dominate and the unflattering first-enum value stay rare — not ~25% uniform.
    let unibrow = 0;
    let avg = 0;
    const N = 200;
    for (let seed = 0; seed < N; seed++) {
      const s = castFaceSpec({}, {}, { conformity: 0, seed }).spec as Record<
        string,
        unknown
      >;
      if (s.interBrowDistance === 'unibrow') unibrow++;
      if (s.interBrowDistance === NEUTRAL_DEFAULTS.interBrowDistance) avg++;
    }
    expect(avg).toBeGreaterThan(unibrow * 3); // neutral clearly dominates
    expect(unibrow / N).toBeLessThan(0.15); // not the ~25% a uniform prior gave
  });

  it('a clean-shaven face carries no facial-hair density or colour', () => {
    const { spec } = castFaceSpec(
      { sex: 'female' },
      { sex: 'female' },
      { conformity: 1, seed: 2 }
    );
    const s = spec as Record<string, unknown>;
    expect(s.facialHair).toBe('clean-shaven');
    expect(s.facialHairDensity).toBeUndefined();
    expect(s.facialHairColor).toBeUndefined();
  });

  it('minors get no attractiveness shaping', () => {
    expect(attractivenessDistributions({ ageBand: 'child' })).toEqual({});
    expect(attractivenessDistributions({ ageYears: 10 })).toEqual({});
  });

  it('conformity 0 can produce a non-mode value (variety preserved)', () => {
    // Over many seeds at least one structural trait should differ from its mode.
    let sawVariety = false;
    for (let seed = 0; seed < 40 && !sawVariety; seed++) {
      const { spec, distributions } = castFaceSpec(
        {},
        { ancestry: 'east-asian' },
        { conformity: 0, seed }
      );
      const d = (distributions as Record<string, Record<string, number>>)
        .faceShape;
      if (d && (spec as Record<string, unknown>).faceShape !== mostLikely(d)) {
        sawVariety = true;
      }
    }
    expect(sawVariety).toBe(true);
  });

  it('generationParams defaults conformity to 0.7 (Look 7)', () => {
    expect(generationParamsSchema.parse({}).conformity).toBe(0.7);
    expect(generationParamsSchema.parse({ conformity: 0.9 }).conformity).toBe(
      0.9
    );
    expect(generationParamsSchema.parse({ conformity: 0 }).conformity).toBe(0);
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
