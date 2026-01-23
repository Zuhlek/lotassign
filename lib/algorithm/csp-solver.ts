import {
  AssignmentVariable,
  LotBidderPair,
  CallerInfo,
  languageConstraint,
  SoftConstraintWeights,
  DEFAULT_WEIGHTS,
} from "./constraints";
import { Language } from "@/lib/models/language.enum";

export interface CallerPriorityInfo {
  callerId: number;
  bidderIds: number[];  // Ordered by priority (index 0 = highest)
}

export interface FinalAssignment {
  lotId: number;
  lotNumber: number;
  bidderId: number;
  callerId: number;
}

export interface CSPInput {
  lotBidders: LotBidderPair[];
  callers: CallerInfo[];
  lotGap: number;
  weights?: SoftConstraintWeights;
  allowLanguageFallback?: boolean;
  callerPriorities?: CallerPriorityInfo[];  // Global caller-bidder priorities
  finalAssignments?: FinalAssignment[];      // Pre-fixed assignments to respect
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
  constraintNotes: Map<string, string>; // "lotId:bidderId" -> explanation
}

/**
 * CSP (Constraint Satisfaction Problem) Solver for caller-bidder assignments.
 *
 * Uses a greedy forward-checking approach:
 * 1. Pre-assign final assignments (respect user locks)
 * 2. Process lot-bidder pairs in lot number order
 * 3. For each pair, find valid callers (domain)
 * 4. Order domain by soft constraint scores (best first)
 * 5. Assign the best valid caller
 * 6. Update state and propagate constraints
 */
export class CSPSolver {
  private variables: AssignmentVariable[] = [];
  private callers: Map<number, CallerInfo> = new Map();
  private lotGap: number;
  private weights: SoftConstraintWeights;
  private allowLanguageFallback: boolean;
  private callerPriorities: Map<number, number[]> = new Map(); // callerId -> bidderIds[]
  private bidderToPriorityCallers: Map<number, { callerId: number; rank: number }[]> = new Map();
  private finalAssignments: Map<string, number> = new Map(); // "lotId:bidderId" -> callerId

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

    // Build caller priority lookup
    if (input.callerPriorities) {
      for (const cp of input.callerPriorities) {
        this.callerPriorities.set(cp.callerId, cp.bidderIds);
        // Build reverse lookup: which callers prefer this bidder
        for (let i = 0; i < cp.bidderIds.length; i++) {
          const bidderId = cp.bidderIds[i];
          if (bidderId === undefined) continue;
          if (!this.bidderToPriorityCallers.has(bidderId)) {
            this.bidderToPriorityCallers.set(bidderId, []);
          }
          this.bidderToPriorityCallers.get(bidderId)!.push({
            callerId: cp.callerId,
            rank: i + 1, // 1-indexed rank
          });
        }
      }
    }

    // Store final assignments
    if (input.finalAssignments) {
      for (const fa of input.finalAssignments) {
        const key = `${fa.lotId}:${fa.bidderId}`;
        this.finalAssignments.set(key, fa.callerId);
      }
    }

    // Create variables sorted by lot number (greedy ordering)
    // Exclude final assignments from variables
    const sorted = [...input.lotBidders]
      .filter(lb => !this.finalAssignments.has(`${lb.lotId}:${lb.bidderId}`))
      .sort((a, b) => a.lotNumber - b.lotNumber);

    for (const lb of sorted) {
      const domain = this.computeInitialDomain(lb);
      this.variables.push({
        lotBidder: lb,
        domain,
      });
    }

    // Pre-process final assignments to update state
    if (input.finalAssignments) {
      for (const fa of input.finalAssignments) {
        this.updateStateForFinal(fa);
      }
    }
  }

  /**
   * Updates solver state based on a final (locked) assignment.
   */
  private updateStateForFinal(fa: FinalAssignment): void {
    // Update caller assignment count
    const count = this.callerAssignmentCounts.get(fa.callerId) ?? 0;
    this.callerAssignmentCounts.set(fa.callerId, count + 1);

    // Update caller next free lot (apply lot gap)
    const currentNext = this.callerNextFreeLot.get(fa.callerId) ?? 0;
    const newNext = fa.lotNumber + this.lotGap;
    if (newNext > currentNext) {
      this.callerNextFreeLot.set(fa.callerId, newNext);
    }

    // Update bidder history
    this.bidderToCallerHistory.set(fa.bidderId, fa.callerId);
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
      constraintNotes: new Map(),
    };

    // Add final assignments to solution first
    for (const [key, callerId] of this.finalAssignments) {
      solution.assignments.set(key, callerId);
      solution.constraintNotes.set(key, "Locked by user (final assignment)");
    }

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

        if (result.constraintNote) {
          solution.constraintNotes.set(key, result.constraintNote);
        }

        this.updateState(variable.lotBidder, result.callerId);
      } else {
        solution.unassigned.push(variable.lotBidder);
      }
    }

    return solution;
  }

  /**
   * Attempts to assign a caller to a lot-bidder pair.
   * Returns the assignment result or null if no valid assignment found.
   */
  private assignVariable(
    variable: AssignmentVariable
  ): { callerId: number; score: number; breakdown: { preferences: number; continuity: number; balance: number }; constraintNote?: string } | null {
    const lb = variable.lotBidder;

    // Order domain by score (best first)
    const orderedDomain = this.orderDomain(variable);

    for (const callerId of orderedDomain) {
      if (this.canAssign(lb, callerId)) {
        // Calculate score breakdown
        let prefScore = lb.preferredCallerId === callerId ? this.weights.preferredCaller : 0;

        // Check global caller priority
        const priorityCallers = this.bidderToPriorityCallers.get(lb.bidderId);
        let priorityNote: string | undefined;
        if (priorityCallers) {
          const match = priorityCallers.find(pc => pc.callerId === callerId);
          if (match) {
            // Priority bonus based on rank
            const bonus = match.rank === 1 ? 200 : match.rank === 2 ? 150 : match.rank === 3 ? 100 : 50;
            prefScore += bonus;
            priorityNote = `Caller priority #${match.rank}`;
          }
        }

        const prevCaller = this.bidderToCallerHistory.get(lb.bidderId);
        const contScore = prevCaller === callerId ? this.weights.sameCaller : 0;

        const counts = Array.from(this.callerAssignmentCounts.values());
        const mean = counts.length > 0 ? counts.reduce((a, b) => a + b, 0) / counts.length : 0;
        const currentCount = this.callerAssignmentCounts.get(callerId) ?? 0;
        const balScore = -this.weights.loadBalance * Math.max(0, currentCount - mean);

        // Build constraint note
        let constraintNote: string | undefined;
        if (priorityNote) {
          constraintNote = priorityNote;
        } else if (lb.preferredCallerId === callerId) {
          constraintNote = "Preferred caller match";
        } else if (prevCaller === callerId) {
          constraintNote = "Same caller as previous lot (continuity)";
        }

        return {
          callerId,
          score: prefScore + contScore + balScore,
          breakdown: {
            preferences: prefScore,
            continuity: contScore,
            balance: balScore,
          },
          constraintNote,
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

    // Get callers that have this bidder in their priority list
    const priorityCallers = this.bidderToPriorityCallers.get(lb.bidderId) ?? [];
    const priorityMap = new Map(priorityCallers.map(pc => [pc.callerId, pc.rank]));

    return [...variable.domain].sort((a, b) => {
      // 1. Caller priority (global) - lower rank is better
      const rankA = priorityMap.get(a);
      const rankB = priorityMap.get(b);
      if (rankA !== undefined && rankB === undefined) return -1;
      if (rankA === undefined && rankB !== undefined) return 1;
      if (rankA !== undefined && rankB !== undefined) {
        if (rankA !== rankB) return rankA - rankB;
      }

      // 2. Preferred caller (per lot-bidder)
      if (lb.preferredCallerId === a) return -1;
      if (lb.preferredCallerId === b) return 1;

      // 3. Same caller as previous assignment for this bidder
      const prevCaller = this.bidderToCallerHistory.get(lb.bidderId);
      if (prevCaller === a) return -1;
      if (prevCaller === b) return 1;

      // 4. Language match priority (if fallback is allowed)
      const callerA = this.callers.get(a);
      const callerB = this.callers.get(b);
      if (callerA && callerB) {
        const langMatchA = languageConstraint(lb.bidderLanguages, callerA.languages);
        const langMatchB = languageConstraint(lb.bidderLanguages, callerB.languages);
        if (langMatchA && !langMatchB) return -1;
        if (!langMatchA && langMatchB) return 1;
      }

      // 5. Least busy caller (load balancing)
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
