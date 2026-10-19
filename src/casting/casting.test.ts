import { describe, it, expect } from 'vitest';
import { FACE_FEATURE_VALUES, faceSpecSchema } from '../face/index.js';
import { buildDistributions } from './distributions.js';
import { castFaceSpec } from './cast.js';

const FEATURE_KEYS = Object.keys(FACE_FEATURE_VALUES);

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
  it('fills every enum feature and the result is a valid FaceSpec', () => {
    const { spec } = castFaceSpec({}, {}, { seed: 1 });
    for (const key of FEATURE_KEYS) {
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
