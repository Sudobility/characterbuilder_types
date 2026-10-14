import { z } from 'zod';

/**
 * Credits: a thin re-export of `@sudobility/types`' generic consumables shapes,
 * plus the CharacterBuilder-specific priced catalog and the purchase handoff for
 * platforms that cannot buy in-app.
 *
 * The ledger itself (`consumable_balances/_purchases/_usages`) belongs to
 * `@sudobility/consumables_service`, called in-process from `characterbuilder_api`
 * exactly as `screenwriter_api` / `music_api` do; this module never redefines it.
 */
export type {
  ConsumableBalanceResponse,
  ConsumablePurchaseRecord,
  ConsumablePurchaseRequest,
  ConsumableSource,
  ConsumableUsageRecord,
  ConsumableUseRequest,
  ConsumableUseResponse,
} from '@sudobility/types';

export const CONSUMABLE_SOURCES = ['web', 'apple', 'google', 'free'] as const;

/** The consumable kind debited per generated image. */
export const CREDIT_KIND = 'image' as const;

/** `GET /consumables/products`: the priced catalog. */
export interface CreditProduct {
  productId: string;
  credits: number;
}

/** `POST /purchases/handoff`: send a user with no in-app purchase to the web to buy. */
export const purchaseHandoffRequestSchema = z.object({
  productId: z.string().optional(),
  returnTo: z.string().min(1).max(2000),
});
export type PurchaseHandoffRequest = z.infer<
  typeof purchaseHandoffRequestSchema
>;

export interface PurchaseHandoffResponse {
  handoffUrl: string;
  expiresAt: string;
}

export const creditCouponRedeemRequestSchema = z.object({
  code: z.string().trim().min(1).max(200),
});
export type CreditCouponRedeemRequest = z.infer<
  typeof creditCouponRedeemRequestSchema
>;

export interface CreditCouponRedeemResponse {
  credits: number;
  balance: number;
}
