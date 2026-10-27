import { describe, it, expect } from 'vitest';
import {
  FACE_FEATURE_VALUES,
  HAIR_FEATURE_KEYS,
  faceSpecSchema,
  type FaceSpec,
} from '../face/index.js';
import type { FaceDistributions } from '../distribution/index.js';
import { buildDistributions } from './distributions.js';
import { castFaceSpec } from './cast.js';

const FEATURE_KEYS = Object.keys(FACE_FEATURE_VALUES);
// Traits a coherent spec may legitimately omit (no meaning in context): facial-hair
// density/colour on a clean-shaven face, an asymmetry feature on a symmetric one.
const CONDITIONAL_KEYS = new Set([
  'facialHairDensity',
  'facialHairColor',
  'asymmetryFeature',
]);

describe('buildDistributions', () => {
  it('returns a normalized distribution for every enum feature', () => {
    const d = buildDistributions({});
    for (const key of FEATURE_KEYS) {
      const dist = d[key as keyof typeof d]!;
      expect(dist, key).toBeTruthy();
      const sum = Object.values(dist).reduce((s, p) => s + p, 0);
      expect(sum).toBeGreaterThan(0.999);
      expect(sum).toBeLessThan(1.001);
    }
  });

  it('skews coloring toward the ancestry tendency', () => {
    const ea = buildDistributions({ ancestry: 'east-asian' });
    expect(ea.hairTexture!.straight).toBeGreaterThan(0.7);
    expect(
      (ea.irisColor!['dark-brown'] ?? 0) + (ea.irisColor!.brown ?? 0)
    ).toBeGreaterThan(0.8);
    const eu = buildDistributions({ ancestry: 'european' });
    expect(eu.irisColor!.blue).toBeGreaterThan(0.1);
  });

  it('never zeroes a value — tendencies, not rules (non-bundled combos happen)', () => {
    const ea = buildDistributions({ ancestry: 'east-asian' });
    // A blue-eyed East Asian is rare but possible.
    expect(ea.irisColor!.blue).toBeGreaterThan(0);
    expect(ea.hairTexture!.coily).toBeGreaterThan(0);
  });

  it('shifts aging traits with age band', () => {
    const young = buildDistributions({ ageBand: 'twenties' });
    const old = buildDistributions({ ageBand: 'seventies-plus' });
    expect(old.greying!.full).toBeGreaterThan(young.greying!.full ?? 0);
    expect(old.wrinkleLevel!.deep).toBeGreaterThan(
      young.wrinkleLevel!.deep ?? 0
    );
  });
});

describe('castFaceSpec', () => {
  it('keeps every hair dial outside Look, including length and style', () => {
    const population = buildDistributions({});
    const attractive: FaceDistributions = {};
    const expected: Record<string, string> = {};
    for (const key of HAIR_FEATURE_KEYS) {
      const values = FACE_FEATURE_VALUES[key];
      const natural = values[0];
      const goodLooking = values[1];
      if (!natural || !goodLooking) continue;
      population[key] = { [natural]: 1 };
      attractive[key] = { [goodLooking]: 1 };
      expected[key] = natural;
    }
    // These values avoid biological corrections after the initial draw.
    population.greying = { none: 1 };
    population.balding = { none: 1 };
    population.facialHair = { stubble: 1 };
    population.facialHairColor = { black: 1 };
    expected.greying = 'none';
    expected.balding = 'none';
    expected.facialHair = 'stubble';
    expected.facialHairColor = 'black';
    const { spec } = castFaceSpec(
      {},
      { sex: 'male', ageBand: 'thirties' },
      {
        seed: 7,
        conformity: 1,
        distributions: population,
        attractiveness: attractive,
      }
    );
    for (const [key, value] of Object.entries(expected)) {
      expect(spec[key as keyof FaceSpec], key).toBe(value);
    }
  });

  it('rotates the naturally sampled traits across a Look 9 batch', () => {
    const traits = [
      ['faceShape', 'square', 'oval'],
      ['eyeSize', 'small', 'large'],
      ['eyeSpacing', 'close-set', 'wide-set'],
      ['browThickness', 'thin', 'thick'],
      ['noseSize', 'large', 'small'],
      ['lipFullness', 'thin', 'full'],
      ['cheekboneHeight', 'low', 'high'],
      ['jawWidth', 'narrow', 'wide'],
      ['earSize', 'large', 'small'],
      ['mouthWidth', 'narrow', 'wide'],
    ] as const;
    const population = buildDistributions({});
    const attractiveness: FaceDistributions = {};
    for (const [key, natural, goodLooking] of traits) {
      population[key] = { [natural]: 1 };
      attractiveness[key] = { [goodLooking]: 1 };
    }
    const excluded = Array.from({ length: traits.length }, (_, index) => {
      const { spec } = castFaceSpec(
        { hairLength: 'very-long', hairStyle: 'braids' },
        {},
        {
          seed: index + 1,
          conformity: 0.9,
          distributions: population,
          attractiveness,
          lookBatch: { index, seed: 12345 },
        }
      );
      expect(spec.hairLength).toBe('very-long');
      expect(spec.hairStyle).toBe('braids');
      const naturalTraits = traits.filter(
        ([key, natural]) => spec[key as keyof FaceSpec] === natural
      );
      expect(naturalTraits).toHaveLength(1);
      return naturalTraits[0]![0];
    });
    expect(new Set(excluded).size).toBe(traits.length);
  });

  it('fills every enum feature and the result is a valid FaceSpec', () => {
    const { spec } = castFaceSpec({}, {}, { seed: 1 });
    for (const key of FEATURE_KEYS) {
      if (CONDITIONAL_KEYS.has(key)) continue;
      expect(spec[key as keyof typeof spec], key).toBeDefined();
    }
    expect(faceSpecSchema.safeParse(spec).success).toBe(true);
  });

  it('is deterministic under a seed', () => {
    const a = castFaceSpec({}, { ancestry: 'south-asian' }, { seed: 42 });
    const b = castFaceSpec({}, { ancestry: 'south-asian' }, { seed: 42 });
    expect(JSON.stringify(a.spec)).toBe(JSON.stringify(b.spec));
  });

  it('produces different people across seeds', () => {
    const a = castFaceSpec({}, {}, { seed: 1 });
    const b = castFaceSpec({}, {}, { seed: 2 });
    expect(JSON.stringify(a.spec)).not.toBe(JSON.stringify(b.spec));
  });

  it('threads a named sub-population into ancestryNote for the prose', () => {
    const { spec } = castFaceSpec(
      {},
      { ancestry: 'east-asian', subPopulation: 'Korean' },
      { seed: 9 }
    );
    expect(spec.ancestryNote).toBe('Korean');
    // An explicit ancestryNote is not overwritten.
    const { spec: spec2 } = castFaceSpec(
      { ancestryNote: 'Jeju Islander' },
      { subPopulation: 'Korean' },
      { seed: 9 }
    );
    expect(spec2.ancestryNote).toBe('Jeju Islander');
  });

  it('always keeps explicitly provided traits', () => {
    const { spec } = castFaceSpec(
      { eyeShape: 'round', irisColor: 'green', chinShape: 'square' },
      { ancestry: 'east-asian' },
      { seed: 7 }
    );
    expect(spec.eyeShape).toBe('round');
    expect(spec.irisColor).toBe('green');
    expect(spec.chinShape).toBe('square');
  });

  it('never gives a woman facial hair', () => {
    for (let seed = 0; seed < 30; seed++) {
      const { spec } = castFaceSpec({}, { sex: 'female' }, { seed });
      expect(spec.facialHair).toBe('clean-shaven');
    }
  });

  it('never ages a child (no greying/balding/wrinkles/beard)', () => {
    for (let seed = 0; seed < 30; seed++) {
      const { spec } = castFaceSpec({}, { ageBand: 'child' }, { seed });
      expect(spec.greying).toBe('none');
      expect(spec.balding).toBe('none');
      expect(spec.wrinkleLevel).toBe('none');
      expect(spec.facialHair).toBe('clean-shaven');
      expect(spec.wrinkleAreas).toEqual([]);
    }
  });

  it('keeps monolids crease-free and gives double lids a crease', () => {
    for (let seed = 0; seed < 50; seed++) {
      const { spec } = castFaceSpec({}, {}, { seed });
      if (spec.lidType === 'monolid') expect(spec.lidCrease).toBe('none');
      if (spec.lidType === 'double') expect(spec.lidCrease).not.toBe('none');
    }
  });

  it('agrees greying with hair color and matches brow color to hair', () => {
    for (let seed = 0; seed < 50; seed++) {
      const { spec } = castFaceSpec({}, {}, { seed });
      if (spec.greying === 'full')
        expect(['grey', 'white', 'salt-and-pepper']).toContain(spec.hairColor);
      expect(spec.browColor).toBe(spec.hairColor);
    }
  });

  it('respects LLM-override distributions when provided', () => {
    const { spec } = castFaceSpec(
      {},
      { ancestry: 'european' },
      {
        seed: 3,
        distributions: buildDistributions(
          { ancestry: 'european' },
          {
            irisColor: { amber: 1 },
          }
        ),
      }
    );
    expect(spec.irisColor).toBe('amber');
  });
});
