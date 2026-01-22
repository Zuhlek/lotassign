import { Language } from "@/lib/models/language.enum";

// ============================================
// TYPES
// ============================================

export interface LotInfo {
  id: number;
  number: number;
}

export interface BidderInfo {
  id: number;
  languages: Language[];
  preferredCallerId?: number;
}

export interface CallerInfo {
  id: number;
  languages: Set<Language>;
}

export interface LotBidderPair {
  lotId: number;
  lotNumber: number;
  bidderId: number;
  bidderLanguages: Language[];
  preferredCallerId?: number;
}

export interface AssignmentVariable {
  lotBidder: LotBidderPair;
  domain: number[]; // Possible caller IDs
  assigned?: number; // Assigned caller ID
}

// ============================================
// HARD CONSTRAINTS
// ============================================

/**
 * Checks if a caller can serve a bidder based on language compatibility.
 * - If bidder has no language preference, any caller is OK
 * - If caller has no languages specified, any bidder is OK
 * - Otherwise, at least one language must match
 */
export function languageConstraint(
  bidderLanguages: Language[],
  callerLanguages: Set<Language>
): boolean {
  // Empty bidder languages = any caller is OK
  if (bidderLanguages.length === 0) return true;
  // Empty caller languages = any bidder is OK
  if (callerLanguages.size === 0) return true;
  // At least one language must match
  return bidderLanguages.some(lang => callerLanguages.has(lang));
}

/**
 * Checks if a caller can take an assignment at a given lot number
 * based on temporal (lot gap) constraints.
 */
export function temporalConstraint(
  callerNextFreeLot: Map<number, number>, // callerId -> next available lot number
  callerId: number,
  lotNumber: number,
  lotGap: number
): boolean {
  const nextFree = callerNextFreeLot.get(callerId) ?? 0;
  return lotNumber >= nextFree;
}

// ============================================
// SOFT CONSTRAINTS (return scores)
// ============================================

export interface SoftConstraintWeights {
  preferredCaller: number;      // Weight for honoring preferences
  sameCaller: number;           // Weight for same caller across bidder's lots
  loadBalance: number;          // Weight for even distribution
  minimizeTransitions: number;  // Weight for minimizing caller switches
}

export const DEFAULT_WEIGHTS: SoftConstraintWeights = {
  preferredCaller: 100,
  sameCaller: 50,
  loadBalance: 10,
  minimizeTransitions: 20,
};

/**
 * Returns positive score if the assigned caller matches the bidder's preference.
 */
export function preferredCallerScore(
  preferredCallerId: number | undefined,
  assignedCallerId: number,
  weight: number
): number {
  if (preferredCallerId === undefined) return 0;
  return preferredCallerId === assignedCallerId ? weight : 0;
}

/**
 * Returns positive score if the same caller is used for consecutive assignments
 * for the same bidder (continuity bonus).
 */
export function sameCallerScore(
  bidderId: number,
  assignedCallerId: number,
  bidderToCallerHistory: Map<number, number>,
  weight: number
): number {
  const previousCaller = bidderToCallerHistory.get(bidderId);
  if (previousCaller === undefined) return 0;
  return previousCaller === assignedCallerId ? weight : 0;
}

/**
 * Returns a score (potentially negative) based on how balanced the workload is.
 * Penalizes assigning to callers who already have more work than average.
 */
export function loadBalanceScore(
  callerAssignmentCounts: Map<number, number>,
  assignedCallerId: number,
  weight: number
): number {
  const counts = Array.from(callerAssignmentCounts.values());
  if (counts.length === 0) return 0;

  const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
  const currentCount = callerAssignmentCounts.get(assignedCallerId) ?? 0;
  const deviation = currentCount - mean;

  // Penalize if above mean, reward if below
  return -weight * Math.max(0, deviation);
}

/**
 * Calculates total score for an assignment decision.
 */
export function calculateAssignmentScore(
  lotBidder: LotBidderPair,
  callerId: number,
  bidderToCallerHistory: Map<number, number>,
  callerAssignmentCounts: Map<number, number>,
  weights: SoftConstraintWeights
): number {
  let score = 0;

  // Preferred caller bonus
  score += preferredCallerScore(
    lotBidder.preferredCallerId,
    callerId,
    weights.preferredCaller
  );

  // Same caller continuity bonus
  score += sameCallerScore(
    lotBidder.bidderId,
    callerId,
    bidderToCallerHistory,
    weights.sameCaller
  );

  // Load balance consideration
  score += loadBalanceScore(
    callerAssignmentCounts,
    callerId,
    weights.loadBalance
  );

  return score;
}
