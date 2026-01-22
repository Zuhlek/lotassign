import {
  AssignmentVariable,
  LotBidderPair,
  CallerInfo,
  languageConstraint,
  SoftConstraintWeights,
  DEFAULT_WEIGHTS,
  calculateAssignmentScore,
} from "./constraints";
import { Language } from "@/lib/models/language.enum";

export interface CSPInput {
  lotBidders: LotBidderPair[];
  callers: CallerInfo[];
  lotGap: number;
  weights?: SoftConstraintWeights;
  allowLanguageFallback?: boolean;
}

export interface CSPSolution {
  assignments: Map<string, number>; // "lotId:bidderId" -> callerId
  unassigned: LotBidderPair[];
  score: number;
  scoreBreakdown: {
    preferences: number;
    continuity: number;
    balance: number;
  };
}

/**
 * CSP (Constraint Satisfaction Problem) Solver for caller-bidder assignments.
 *
 * Uses a greedy forward-checking approach:
 * 1. Process lot-bidder pairs in lot number order
 * 2. For each pair, find valid callers (domain)
 * 3. Order domain by soft constraint scores (best first)
 * 4. Assign the best valid caller
 * 5. Update state and propagate constraints
 */
export class CSPSolver {
  private variables: AssignmentVariable[] = [];
  private callers: Map<number, CallerInfo> = new Map();
  private lotGap: number;
  private weights: SoftConstraintWeights;
  private allowLanguageFallback: boolean;

  // State during solving
  private callerAssignmentCounts: Map<number, number> = new Map();
  private callerNextFreeLot: Map<number, number> = new Map();
  private bidderToCallerHistory: Map<number, number> = new Map();

  constructor(input: CSPInput) {
    this.lotGap = input.lotGap;
    this.weights = input.weights ?? DEFAULT_WEIGHTS;
    this.allowLanguageFallback = input.allowLanguageFallback ?? true;

    // Initialize callers
    for (const caller of input.callers) {
      this.callers.set(caller.id, caller);
      this.callerAssignmentCounts.set(caller.id, 0);
      this.callerNextFreeLot.set(caller.id, 0);
    }

    // Create variables sorted by lot number (greedy ordering)
    const sorted = [...input.lotBidders].sort((a, b) => a.lotNumber - b.lotNumber);

    for (const lb of sorted) {
      const domain = this.computeInitialDomain(lb);
      this.variables.push({
        lotBidder: lb,
        domain,
      });
    }
  }

  /**
   * Computes the initial domain (possible callers) for a lot-bidder pair.
   */
  private computeInitialDomain(lb: LotBidderPair): number[] {
    const domain: number[] = [];
    const languageMatches: number[] = [];
    const fallbacks: number[] = [];

    for (const [callerId, caller] of this.callers) {
      const langOk = languageConstraint(lb.bidderLanguages, caller.languages);

      if (langOk) {
        languageMatches.push(callerId);
      } else if (this.allowLanguageFallback) {
        fallbacks.push(callerId);
      }
    }

    // Language matches first, then fallbacks
    domain.push(...languageMatches, ...fallbacks);

    return domain;
  }

  /**
   * Main solving method. Returns the best solution found.
   */
  solve(): CSPSolution {
    const solution: CSPSolution = {
      assignments: new Map(),
      unassigned: [],
      score: 0,
      scoreBreakdown: {
        preferences: 0,
        continuity: 0,
        balance: 0,
      },
    };

    // Reset state for fresh solve
    this.resetState();

    // Process variables in order (sorted by lot number)
    for (const variable of this.variables) {
      const result = this.assignVariable(variable);

      if (result !== null) {
        const key = `${variable.lotBidder.lotId}:${variable.lotBidder.bidderId}`;
        solution.assignments.set(key, result.callerId);
        solution.score += result.score;
        solution.scoreBreakdown.preferences += result.breakdown.preferences;
        solution.scoreBreakdown.continuity += result.breakdown.continuity;
        solution.scoreBreakdown.balance += result.breakdown.balance;

        this.updateState(variable.lotBidder, result.callerId);
      } else {
        solution.unassigned.push(variable.lotBidder);
      }
    }

    return solution;
  }

  /**
   * Resets solver state for a fresh solve.
   */
  private resetState(): void {
    this.callerAssignmentCounts.clear();
    this.callerNextFreeLot.clear();
    this.bidderToCallerHistory.clear();

    for (const caller of this.callers.keys()) {
      this.callerAssignmentCounts.set(caller, 0);
      this.callerNextFreeLot.set(caller, 0);
    }
  }

  /**
   * Attempts to assign a caller to a lot-bidder pair.
   * Returns the assignment result or null if no valid assignment found.
   */
  private assignVariable(
    variable: AssignmentVariable
  ): { callerId: number; score: number; breakdown: { preferences: number; continuity: number; balance: number } } | null {
    const lb = variable.lotBidder;

    // Order domain by score (best first)
    const orderedDomain = this.orderDomain(variable);

    for (const callerId of orderedDomain) {
      if (this.canAssign(lb, callerId)) {
        // Calculate score breakdown
        const prefScore = lb.preferredCallerId === callerId ? this.weights.preferredCaller : 0;

        const prevCaller = this.bidderToCallerHistory.get(lb.bidderId);
        const contScore = prevCaller === callerId ? this.weights.sameCaller : 0;

        const counts = Array.from(this.callerAssignmentCounts.values());
        const mean = counts.length > 0 ? counts.reduce((a, b) => a + b, 0) / counts.length : 0;
        const currentCount = this.callerAssignmentCounts.get(callerId) ?? 0;
        const balScore = -this.weights.loadBalance * Math.max(0, currentCount - mean);

        return {
          callerId,
          score: prefScore + contScore + balScore,
          breakdown: {
            preferences: prefScore,
            continuity: contScore,
            balance: balScore,
          },
        };
      }
    }

    return null;
  }

  /**
   * Orders the domain (possible callers) by preference.
   * Best candidates come first.
   */
  private orderDomain(variable: AssignmentVariable): number[] {
    const lb = variable.lotBidder;

    return [...variable.domain].sort((a, b) => {
      // 1. Preferred caller first
      if (lb.preferredCallerId === a) return -1;
      if (lb.preferredCallerId === b) return 1;

      // 2. Same caller as previous assignment for this bidder
      const prevCaller = this.bidderToCallerHistory.get(lb.bidderId);
      if (prevCaller === a) return -1;
      if (prevCaller === b) return 1;

      // 3. Language match priority (if fallback is allowed)
      const callerA = this.callers.get(a);
      const callerB = this.callers.get(b);
      if (callerA && callerB) {
        const langMatchA = languageConstraint(lb.bidderLanguages, callerA.languages);
        const langMatchB = languageConstraint(lb.bidderLanguages, callerB.languages);
        if (langMatchA && !langMatchB) return -1;
        if (!langMatchA && langMatchB) return 1;
      }

      // 4. Least busy caller (load balancing)
      const countA = this.callerAssignmentCounts.get(a) ?? 0;
      const countB = this.callerAssignmentCounts.get(b) ?? 0;
      return countA - countB;
    });
  }

  /**
   * Checks if a caller can be assigned to a lot-bidder pair.
   * Validates temporal (lot gap) constraints.
   */
  private canAssign(lb: LotBidderPair, callerId: number): boolean {
    const nextFree = this.callerNextFreeLot.get(callerId) ?? 0;

    // Check if caller is available at this lot
    if (lb.lotNumber < nextFree) {
      // Caller is busy until nextFree
      // But if it's the same bidder continuing, that's OK (no gap needed)
      const prevCaller = this.bidderToCallerHistory.get(lb.bidderId);
      if (prevCaller === callerId) {
        // Same bidder with same caller - allowed
        return true;
      }
      return false;
    }

    return true;
  }

  /**
   * Updates solver state after an assignment is made.
   */
  private updateState(lb: LotBidderPair, callerId: number): void {
    // Update caller assignment count
    const count = this.callerAssignmentCounts.get(callerId) ?? 0;
    this.callerAssignmentCounts.set(callerId, count + 1);

    // Update caller next free lot (apply lot gap)
    const currentNext = this.callerNextFreeLot.get(callerId) ?? 0;
    const newNext = lb.lotNumber + this.lotGap;
    if (newNext > currentNext) {
      this.callerNextFreeLot.set(callerId, newNext);
    }

    // Update bidder history (for continuity tracking)
    this.bidderToCallerHistory.set(lb.bidderId, callerId);
  }
}
