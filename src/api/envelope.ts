/**
 * Response envelope, error vocabulary and pagination shape for CharacterBuilder.
 * Platform-free: no clock is read here, so the envelope carries no timestamp.
 */

/** Every REST error code and its fixed HTTP status. */
const ERROR_TABLE = [
  ['UNAUTHORIZED', 401],
  ['REAUTH_REQUIRED', 401],
  ['FORBIDDEN', 403],
  ['NOT_FOUND', 404],
  ['CHARACTER_NOT_FOUND', 404],
  ['GENERATION_NOT_FOUND', 404],
  ['IMAGE_NOT_FOUND', 404],
  ['VALIDATION', 400],
  ['CONFIRMATION_MISMATCH', 400],
  ['NAME_COLLISION', 409],
  ['LIMIT_EXCEEDED', 409],
  ['RATE_LIMITED', 429],
  ['QUOTA_EXCEEDED', 429],
  ['INSUFFICIENT_CREDITS', 402],
  ['COUPON_NOT_FOUND', 404],
  ['COUPON_EMAIL_MISMATCH', 403],
  ['COUPON_ALREADY_REDEEMED', 409],
  ['COUPON_EXPIRED', 410],
  ['ASSET_TOO_LARGE', 413],
  ['PAYLOAD_TOO_LARGE', 413],
  ['UNSUPPORTED_FORMAT', 400],
  ['STORAGE_QUOTA_EXCEEDED', 507],
  ['STORAGE_UNAVAILABLE', 503],
  ['AI_UNAVAILABLE', 503],
  ['AI_INPUT_TOO_LARGE', 413],
  ['AI_GENERATION_FAILED', 502],
  ['AI_OUTPUT_INVALID', 502],
  ['AI_CONTENT_REFUSED', 422],
  ['CONFIG_MISSING', 503],
  ['CLIENT_TOO_OLD', 426],
  ['IDEMPOTENCY_KEY_REUSED', 409],
  ['IDEMPOTENCY_IN_PROGRESS', 409],
  ['INTERNAL', 500],
] as const;

type ErrorTable = typeof ERROR_TABLE;
export type ApiErrorCode = ErrorTable[number][0];

export const API_ERROR_CODES = Object.fromEntries(
  ERROR_TABLE.map(([code]) => [code, code])
) as { readonly [C in ApiErrorCode]: C };

/** HTTP status per error code. */
export const ERROR_STATUS = Object.fromEntries(ERROR_TABLE) as Record<
  ApiErrorCode,
  number
>;

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  /** Human-readable message. */
  error: string;
  code: ApiErrorCode;
  /** Code-specific details (e.g. `issues`, `balance`, `required`). */
  details?: Record<string, unknown>;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export function successResponse<T>(data: T): ApiSuccess<T> {
  return { success: true, data };
}

/** The only constructor for failure envelopes. */
export function errorResponse(
  message: string,
  code: ApiErrorCode,
  details?: Record<string, unknown>
): ApiFailure {
  return details === undefined
    ? { success: false, error: message, code }
    : { success: false, error: message, code, details };
}

/** Cursor page: `nextCursor` is null on the last page. */
export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
}
