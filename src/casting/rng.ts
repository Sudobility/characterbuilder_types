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

/**
 * The single most likely value in a weight map (the mode / argmax). Ties resolve
 * to the first-declared key, so the result is deterministic without an rng. An
 * empty map returns ''. Used by the "typicality" knob to pick the most common
 * trait value for a demographic instead of sampling.
 */
export function mostLikely(weights: Weights): string {
  let bestKey = '';
  let bestWeight = -Infinity;
  for (const [k, w] of Object.entries(weights)) {
    if (w > bestWeight) {
      bestWeight = w;
      bestKey = k;
    }
  }
  return bestKey;
}

/**
 * Sharpen a weight map by raising every weight to `gamma` (>1 = more peaked toward
 * the top value, which also crushes the low-probability tail). Used for the "ideal"
 * pick at high Look so a 10/10 reliably lands near the best value while still
 * leaving the near-best values in play (a slight variety, not a clone). gamma ≤ 1
 * returns the weights unchanged.
 */
export function sharpen(weights: Weights, gamma: number): Weights {
  if (gamma <= 1) return weights;
  return Object.fromEntries(
    Object.entries(weights).map(([k, w]) => [
      k,
      Math.pow(Math.max(0, w), gamma),
    ])
  );
}

/** A standard-normal sample via Box–Muller, drawn from the uniform stream. */
function gaussian(rng: Rng): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** A Gamma(shape, 1) sample (Marsaglia–Tsang), with the shape<1 boost. */
function gammaSample(shape: number, rng: Rng): number {
  if (shape < 1) {
    const u = rng() || 1e-12;
    return gammaSample(shape + 1, rng) * Math.pow(u, 1 / shape);
  }
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  for (;;) {
    const x = gaussian(rng);
    let v = 1 + c * x;
    if (v <= 0) continue;
    v = v * v * v;
    const u = rng();
    if (u < 1 - 0.0331 * x * x * x * x) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

/**
 * A Dirichlet sample: a point on the simplex (non-negative, sums to 1) given
 * concentration parameters. Used as a per-individual ANCESTRY FRACTION for an
 * admixed face — one draw per person, so a mixed population spans the full range
 * (some faces lean strongly to one parent, some evenly) instead of all landing on
 * the mean blend.
 */
export function dirichlet(concentration: number[], rng: Rng): number[] {
  const gs = concentration.map((c) => gammaSample(Math.max(c, 1e-6), rng));
  const sum = gs.reduce((a, b) => a + b, 0) || 1;
  return gs.map((g) => g / sum);
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
