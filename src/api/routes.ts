/**
 * Canonical REST route paths for the CharacterBuilder API, shared by the backend
 * (to mount handlers) and the network client (to build requests). Keep these in
 * lockstep — the client never hard-codes a path string of its own.
 *
 * All paths are relative to the API base URL (e.g. `https://api.characterbuilder.ai/api/v1`).
 */
export const API_VERSION = 'v1' as const;

export const ROUTES = {
  health: '/health',
  healthReady: '/health/ready',

  me: '/me',

  characters: '/characters',
  character: (id: string) => `/characters/${id}`,

  /** Compose-only: return the prompt a spec would produce, without generating. */
  composePrompt: '/compose',

  /** Demographics -> per-trait probability maps (the casting odds). */
  distributions: '/distributions',

  /** Free-text description -> inferred (partial) FaceSpec. No credits spent. */
  describe: '/describe',

  /** Uploaded headshot -> read (partial) FaceSpec (vision). No credits spent. */
  analyze: '/analyze',

  /** Spend credits and generate images from a spec (saved or inline). */
  generate: '/generate',
  /** Staged sheet generation (head sheet / body sheet / clothed sheet). */
  generateSheet: '/generate/sheet',
  generations: '/generations',
  generation: (id: string) => `/generations/${id}`,

  /** Served image bytes / redirect for a stored result image. */
  image: (id: string) => `/images/${id}`,

  consumablesBalance: '/consumables/balance',
  consumablesProducts: '/consumables/products',
  /** Dev-only: grant credits to the signed-in user (gated by AUTH_TEST_MODE). */
  consumablesDevTopup: '/consumables/dev-topup',
  consumablesUse: '/consumables/use',
  purchasesHandoff: '/purchases/handoff',
  couponsRedeem: '/coupons/redeem',
} as const;
