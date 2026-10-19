/**
 * Tiny deterministic PRNG so casting is reproducible under a seed (tests, and the
 * optional `seed` on a generation). Not cryptographic — just a well-distributed,
 * fast, seedable stream.
 */

export type Rng = () => number;

/** mulberry32: a 32-bit seeded generator returning floats in [0, 1). */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash an arbitrary string to a 32-bit seed (so a demographic key can seed). */
export function hashSeed(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** A weight map: value -> non-negative weight. */
export type Weights = Record<string, number>;

/**
 * Pick one key from a weight map, proportional to weight. Zero/negative weights
 * are skipped; an all-zero (or empty) map falls back to the first key.
 */
export function weightedPick(weights: Weights, rng: Rng): string {
  const entries = Object.entries(weights).filter(([, w]) => w > 0);
  if (entries.length === 0) {
    const keys = Object.keys(weights);
    return keys[0] ?? '';
  }
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [k, w] of entries) {
    r -= w;
    if (r <= 0) return k;
  }
  return entries[entries.length - 1]![0];
}

/** A Bernoulli draw: true with probability p. */
export function chance(p: number, rng: Rng): boolean {
  return rng() < p;
}

/** Normalize a weight map into a probability distribution summing to 1. */
export function normalize(weights: Weights): Record<string, number> {
  const total = Object.values(weights).reduce((s, w) => s + Math.max(0, w), 0);
  if (total <= 0) {
    const keys = Object.keys(weights);
    const p = keys.length ? 1 / keys.length : 0;
    return Object.fromEntries(keys.map((k) => [k, p]));
  }
  return Object.fromEntries(
    Object.entries(weights).map(([k, w]) => [k, Math.max(0, w) / total])
  );
}
