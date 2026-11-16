/**
 * Response envelope and pagination shape for CharacterBuilder.
 *
 * The success/failure envelope, its constructors and its guards are the
 * canonical ones from `@sudobility/types`; this module simply re-exports them so
 * consumers keep a single import surface. (The canonical constructors read the
 * clock, but that call lives in `@sudobility/types`, so this module itself stays
 * platform-free — no clock is read here.)
 */
export type {
  BaseResponse,
  ApiResponse,
  ApiInfoResponse,
  HealthResponse,
  HealthCheckData,
  PaginatedResponse,
  PaginationInfo,
} from '@sudobility/types';
export {
  successResponse,
  errorResponse,
  isSuccessResponse,
  isErrorResponse,
} from '@sudobility/types';
