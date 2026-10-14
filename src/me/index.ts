/**
 * `GET /me`: the signed-in user's profile and current credit balance, so the app
 * can render the account menu and the credit pill in one round-trip after login.
 */
export interface MeResponse {
  userId: string;
  email: string | null;
  displayName: string | null;
  /** Current spendable image-generation credit balance. */
  credits: number;
  createdAt: string;
}
