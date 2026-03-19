/**
 * Drift Inspector DTOs — Shared Zod schemas for the Admin Drift Analysis & Resolve flow.
 */
import { z } from 'zod';

// ── Orphaned Transaction (returned by drift-analysis) ──
export const OrphanedTransactionSchema = z.object({
    buyInId: z.string(),
    userId: z.string(),
    username: z.string(),
    amount: z.number(),
    referenceId: z.string().nullable(),
    tableId: z.string().nullable(),
    createdAt: z.string(), // ISO string
});
export type OrphanedTransaction = z.infer<typeof OrphanedTransactionSchema>;

// ── Response from GET /admin/system/drift-analysis ──
export const DriftAnalysisResponseSchema = z.object({
    orphanedTransactions: z.array(OrphanedTransactionSchema),
    totalGhostMoney: z.number(),
    affectedUsers: z.number(),
    currentDrift: z.string(),
    analyzedAt: z.string(),
});
export type DriftAnalysisResponse = z.infer<typeof DriftAnalysisResponseSchema>;

// ── Request for POST /admin/system/resolve-drift ──
export const ResolveDriftRequestSchema = z.object({
    referenceIds: z.array(z.string()).min(1, 'At least one referenceId required'),
});
export type ResolveDriftRequest = z.infer<typeof ResolveDriftRequestSchema>;

// ── Response from POST /admin/system/resolve-drift ──
export const ResolveDriftResponseSchema = z.object({
    success: z.boolean(),
    refundedCount: z.number(),
    totalRefunded: z.number(),
    skippedCount: z.number(),
    errors: z.array(z.string()),
    resolvedAt: z.string(),
});
export type ResolveDriftResponse = z.infer<typeof ResolveDriftResponseSchema>;
