import { describe, it, expect } from 'vitest';
import { castFaceSpec } from './cast.js';
import {
  resolveAncestry,
  mixDistributions,
  sampleAncestryFraction,
} from './ancestry.js';
import { mulberry32 } from './rng.js';

const EAST_ASIAN_LEAVES = new Set([
  'Northern Chinese',
  'Southern Chinese',
  'Eastern Chinese',
  'Western Chinese',
  'Korean',
  'Japanese',
  'Mongolian',
]);

describe('ancestry taxonomy', () => {
  it('a STEM descends to a concrete leaf, and varies across seeds', () => {
    const labels = new Set<string>();
    for (let seed = 0; seed < 20; seed++) {
      const res = resolveAncestry(
        { subPopulation: 'East Asian' },
        mulberry32(seed)
      );
      expect(res).not.toBeNull();
      expect(res!.components).toHaveLength(1); // a pure cluster
      const label = res!.label;
      expect(EAST_ASIAN_LEAVES.has(label), label).toBe(true);
      expect(res!.components[0]!.enumAncestry).toBe('east-asian');
      labels.add(label);
    }
    expect(labels.size).toBeGreaterThan(1); // not always the same leaf
  });

  it('a stem "Asian" can reach multiple broad ancestries', () => {
    const enums = new Set<string>();
    for (let seed = 0; seed < 40; seed++) {
      const res = resolveAncestry({ subPopulation: 'Asian' }, mulberry32(seed));
      enums.add(res!.components[0]!.enumAncestry);
    }
    // east/southeast/south/central asian all reachable.
    expect(enums.size).toBeGreaterThan(2);
  });

  it('a LEAF resolves directly (no descent) to itself', () => {
    for (let seed = 0; seed < 5; seed++) {
      const res = resolveAncestry(
        { subPopulation: 'Northern Chinese' },
        mulberry32(seed)
      );
      expect(res!.label).toBe('Northern Chinese');
      expect(res!.components).toHaveLength(1);
      expect(res!.components[0]!.enumAncestry).toBe('east-asian');
    }
  });

  it('an unknown sub-population keeps its label and does not crash', () => {
    const res = resolveAncestry(
      { ancestry: 'european', subPopulation: 'Atlantean' },
      mulberry32(1)
    );
    expect(res).not.toBeNull();
    expect(res!.label).toBe('Atlantean');
    expect(res!.components[0]!.enumAncestry).toBe('european');
  });

  it('no ancestry info → null (caster keeps default behavior)', () => {
    expect(resolveAncestry({}, mulberry32(1))).toBeNull();
  });

  it('casting a stem sets ancestry + a specific ancestryNote', () => {
    const { spec } = castFaceSpec(
      {},
      { subPopulation: 'European', sex: 'female' },
      { conformity: 0.8, seed: 3 }
    );
    expect(spec.ancestry).toBe('european');
    expect(typeof spec.ancestryNote).toBe('string');
    expect(spec.ancestryNote!.length).toBeGreaterThan(0);
  });

  it('distinct sub-populations differ (coloring tendency)', () => {
    const tally = (sub: string) => {
      const skins: Record<string, number> = {};
      for (let seed = 0; seed < 40; seed++) {
        const { spec } = castFaceSpec(
          { sex: 'female' },
          { subPopulation: sub, sex: 'female' },
          { conformity: 0.7, seed }
        );
        const t = spec.skinTone as string;
        skins[t] = (skins[t] ?? 0) + 1;
      }
      return skins;
    };
    const nordic = tally('Nordic');
    const sAsian = tally('South Indian');
    const fairNordic =
      (nordic['very-fair'] ?? 0) + (nordic.fair ?? 0) + (nordic.light ?? 0);
    const fairSAsian =
      (sAsian['very-fair'] ?? 0) + (sAsian.fair ?? 0) + (sAsian.light ?? 0);
    expect(fairNordic).toBeGreaterThan(fairSAsian);
  });
});

describe('admixed demographics (recipe + per-person fraction)', () => {
  it('a Latino country resolves to a multi-cluster recipe tagged mixed', () => {
    const res = resolveAncestry({ subPopulation: 'Mexican' }, mulberry32(2));
    expect(res!.label).toBe('Mexican');
    expect(res!.enumAncestry).toBe('mixed');
    expect(res!.components.length).toBeGreaterThan(1);
    // Mesoamerican + Iberian(Mediterranean) are the dominant parents.
    const enums = res!.components.map((c) => c.enumAncestry);
    expect(enums).toContain('indigenous-american');
    expect(enums).toContain('european');
  });

  it('the "Latino" stem descends to different countries across seeds', () => {
    const labels = new Set<string>();
    for (let seed = 0; seed < 30; seed++) {
      labels.add(
        resolveAncestry({ subPopulation: 'Latino' }, mulberry32(seed))!.label
      );
    }
    expect(labels.size).toBeGreaterThan(2);
  });

  it('an admixed group spans a range of skin tones across a batch', () => {
    const skins = new Set<string>();
    for (let seed = 0; seed < 60; seed++) {
      const { spec } = castFaceSpec(
        { sex: 'female' },
        { subPopulation: 'Mexican', sex: 'female' },
        { conformity: 0.4, seed }
      );
      skins.add(spec.skinTone as string);
    }
    // Per-person ancestry fraction → a real spread, not one averaged tone.
    expect(skins.size).toBeGreaterThan(2);
  });

  it('US / Canada are NOT selectable looks (dropped as containers)', () => {
    expect(
      resolveAncestry({ subPopulation: 'United States' }, mulberry32(1))
    ).toBeNull();
    expect(
      resolveAncestry({ subPopulation: 'Canada' }, mulberry32(1))
    ).toBeNull();
  });

  it('African American resolves to a West-African-dominant blend', () => {
    const res = resolveAncestry(
      { subPopulation: 'African American' },
      mulberry32(4)
    );
    expect(res!.enumAncestry).toBe('mixed');
    const wa = res!.components.find(
      (c) => c.enumAncestry === 'sub-saharan-african'
    );
    expect(wa).toBeTruthy();
    expect(wa!.weight).toBeGreaterThan(50); // dominant parent
  });
});

describe('mixed ancestry (explicit two heritages)', () => {
  it('sets ancestry=mixed and notes both sides', () => {
    const { spec } = castFaceSpec(
      { sex: 'female' },
      {
        sex: 'female',
        mix: [
          { subPopulation: 'Northern Chinese' },
          { subPopulation: 'Nordic' },
        ],
      },
      { conformity: 0.9, seed: 2 }
    );
    expect(spec.ancestry).toBe('mixed');
    expect(spec.ancestryNote).toContain('Northern Chinese');
    expect(spec.ancestryNote).toContain('Nordic');
  });

  it('a Chinese+Nordic mix can show either side’s coloring across seeds', () => {
    const hairs = new Set<string>();
    for (let seed = 0; seed < 40; seed++) {
      const { spec } = castFaceSpec(
        { sex: 'female' },
        {
          sex: 'female',
          mix: [
            { subPopulation: 'Northern Chinese' },
            { subPopulation: 'Nordic' },
          ],
        },
        { conformity: 0.5, seed }
      );
      hairs.add(spec.hairColor as string);
    }
    expect(hairs.size).toBeGreaterThan(2);
  });

  it('mixDistributions takes each trait from exactly one parent', () => {
    const a = { skinTone: { fair: 1 }, hairColor: { black: 1 } } as never;
    const b = { skinTone: { deep: 1 }, noseWidth: { wide: 1 } } as never;
    const rng = mulberry32(5);
    const mixed = mixDistributions(a, b, rng) as Record<string, unknown>;
    expect(['fair', 'deep']).toContain(
      Object.keys(mixed.skinTone as object)[0]
    );
    expect(mixed.hairColor).toEqual({ black: 1 });
    expect(mixed.noseWidth).toEqual({ wide: 1 });
  });

  it('sampleAncestryFraction returns a point on the simplex', () => {
    const a = sampleAncestryFraction([55, 40, 5], mulberry32(7));
    expect(a).toHaveLength(3);
    expect(a.every((x) => x >= 0)).toBe(true);
    expect(a.reduce((s, x) => s + x, 0)).toBeCloseTo(1, 6);
  });
});
