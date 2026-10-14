/**
 * Prefixed, URL-safe entity ids. The prefix makes an id self-describing in logs
 * and prevents a character id from being mistaken for a generation id.
 *
 * Generation of the random suffix is the caller's job (platform-dependent), so
 * this module only defines the prefixes and the predicate/parse helpers that are
 * pure and shared by both ends.
 */
export const ID_PREFIXES = {
  character: 'chr',
  generation: 'gen',
  image: 'img',
} as const;

export type IdKind = keyof typeof ID_PREFIXES;

/** `chr_a1b2c3...` — prefix, underscore, then the opaque suffix. */
export function isId(kind: IdKind, value: string): boolean {
  return value.startsWith(`${ID_PREFIXES[kind]}_`) && value.length > 4;
}

/** Build an id from a prefix and an already-random, URL-safe suffix. */
export function makeId(kind: IdKind, suffix: string): string {
  return `${ID_PREFIXES[kind]}_${suffix}`;
}
