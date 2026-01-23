import { getPlanningSnapshot, persistCallerAssignments, PlanningSnapshot, } from "@/lib/actions/assignment-logic.actions";
import { BidderJSON } from "@/lib/models/bidder.model";
import { CallerJSON } from "@/lib/models/caller.model";
import { Language } from "./models/language.enum";
import { CSPSolver, CSPInput } from "./algorithm/csp-solver";
import { CallerInfo, LotBidderPair, SoftConstraintWeights } from "./algorithm/constraints";
import { AuctionConfig } from "./models/auction-config.model";

// Legacy result format (backwards compatible)
export interface AssignmentResult {
  map: Map<number, number>;
  unscheduled: number[];
  // New detailed format (optional, for enhanced UI)
  detailed?: {
    assignments: Map<string, number>; // "lotId:bidderId" -> callerId
    unassigned: Array<{ lotId: number; bidderId: number }>;
    score: number;
    scoreBreakdown: {
      preferences: number;
      continuity: number;
      balance: number;
    };
    constraintNotes: Map<string, string>; // "lotId:bidderId" -> explanation
  };
}

export interface AssignmentOptions {
  lotGap?: number;
  weights?: Partial<SoftConstraintWeights>;
  allowLanguageFallback?: boolean;
  useCSPSolver?: boolean; // Use new CSP solver vs legacy algorithm
}

export interface BidderInfo {
  bidder: BidderJSON;
  lots: number[];
  firstLotNumber: number;
  lastLotNumber: number;
  preferredCallerId?: number;
}

export interface CallerState {
  caller: CallerJSON;
  nextFreeLot: number;
  assignedLotCount: number;
  languagesSet: Set<Language>;
}

export function computeAssignments(
  snapshot: PlanningSnapshot,
  lotGap: number,
): AssignmentResult {
  const lotNumberByLotId = new Map(snapshot.lots.map(lot => [lot.id!, lot.number]));
  const bidderInfoMap = buildBidderInfoMap(snapshot, lotNumberByLotId);
  const callerStateMap = buildCallerStateMap(snapshot);

  const result: AssignmentResult = { map: new Map(), unscheduled: [] };

  assignPreferredCallers(bidderInfoMap, callerStateMap, lotGap, result);
  assignRegularCallers(bidderInfoMap, callerStateMap, lotGap, result);

  return result;
}

function buildBidderInfoMap(
  snapshot: PlanningSnapshot,
  lotNumberByLotId: Map<number, number>,
): Map<number, BidderInfo> {
  const bidderById = new Map(snapshot.bidders.map(bidder => [bidder.id!, bidder]));
  const bidderInfoMap = new Map<number, BidderInfo>();

  for (const lotBidderRow of snapshot.lotBidders) {
    const lotNumber = lotNumberByLotId.get(lotBidderRow.lotId);
    if (lotNumber === undefined) continue;

    const bidderInfo = bidderInfoMap.get(lotBidderRow.bidderId) ?? {
      bidder: bidderById.get(lotBidderRow.bidderId)!,
      lots: [],
      firstLotNumber: lotNumber,
      lastLotNumber: lotNumber,
      preferredCallerId: lotBidderRow.preferredCallerId,
    };

    bidderInfo.lots.push(lotNumber);
    bidderInfo.firstLotNumber = Math.min(bidderInfo.firstLotNumber, lotNumber);
    bidderInfo.lastLotNumber = Math.max(bidderInfo.lastLotNumber, lotNumber);
    if (lotBidderRow.preferredCallerId !== undefined)
      bidderInfo.preferredCallerId = lotBidderRow.preferredCallerId;

    bidderInfoMap.set(lotBidderRow.bidderId, bidderInfo);
  }

  return bidderInfoMap;
}

function buildCallerStateMap(
  snapshot: PlanningSnapshot,
): Map<number, CallerState> {
  const activeCallerIds = new Set(snapshot.auctionCallers.map(ac => ac.callerId));
  const callerStateMap = new Map<number, CallerState>();

  snapshot.callers
    .filter(caller => activeCallerIds.has(caller.id!))
    .forEach(caller =>
      callerStateMap.set(caller.id!, {
        caller,
        nextFreeLot: 1,
        assignedLotCount: 0,
        languagesSet: new Set(caller.languages as Language[]),
      }),
    );

  return callerStateMap;
}

function assignPreferredCallers(
  bidderInfoMap: Map<number, BidderInfo>,
  callerStateMap: Map<number, CallerState>,
  lotGap: number,
  result: AssignmentResult,
) {
  [...bidderInfoMap.values()]
    .filter(info => info.preferredCallerId !== undefined)
    .sort((a, b) => a.firstLotNumber - b.firstLotNumber)
    .forEach(bidderInfo => {
      const callerState = callerStateMap.get(bidderInfo.preferredCallerId!);
      if (!callerState || !isTimingFeasible(bidderInfo, callerState)) {
        result.unscheduled.push(bidderInfo.bidder.id!);
        return;
      }
      assignCallerToBidder(bidderInfo, callerState, lotGap, result);
    });
}

function assignRegularCallers(
  bidderInfoMap: Map<number, BidderInfo>,
  callerStateMap: Map<number, CallerState>,
  lotGap: number,
  result: AssignmentResult,
) {
  [...bidderInfoMap.values()]
    .filter(info => info.preferredCallerId === undefined)
    .sort((a, b) => a.firstLotNumber - b.firstLotNumber)
    .forEach(bidderInfo => {
      let callerState = selectBestCaller(bidderInfo, callerStateMap, true);
      if (!callerState) callerState = selectBestCaller(bidderInfo, callerStateMap, false);

      if (!callerState) {
        result.unscheduled.push(bidderInfo.bidder.id!);
        return;
      }
      assignCallerToBidder(bidderInfo, callerState, lotGap, result);
    });
}

function selectBestCaller(
  bidderInfo: BidderInfo,
  callerStateMap: Map<number, CallerState>,
  respectLanguages: boolean,
): CallerState | undefined {
  let bestCallerState: CallerState | undefined;
  let bestScore = Infinity;

  for (const callerState of callerStateMap.values()) {
    if (!isTimingFeasible(bidderInfo, callerState)) continue;
    if (respectLanguages && !languagesCompatible(bidderInfo, callerState)) continue;

    const candidateScore =
      callerState.assignedLotCount + (bidderInfo.lastLotNumber - bidderInfo.firstLotNumber + 1);

    if (candidateScore < bestScore) {
      bestScore = candidateScore;
      bestCallerState = callerState;
    }
  }
  return bestCallerState;
}

function isTimingFeasible(bidderInfo: BidderInfo, callerState: CallerState) {
  return bidderInfo.firstLotNumber >= callerState.nextFreeLot;
}

function languagesCompatible(bidderInfo: BidderInfo, callerState: CallerState) {
  if (!bidderInfo.bidder.languages?.length) return true;
  if (!callerState.languagesSet.size) return true;

  return bidderInfo.bidder.languages.some(language =>
    callerState.languagesSet.has(language as Language),
  );
}

function assignCallerToBidder(
  bidderInfo: BidderInfo,
  callerState: CallerState,
  lotGap: number,
  result: AssignmentResult,
) {
  callerState.nextFreeLot = bidderInfo.lastLotNumber + lotGap;
  callerState.assignedLotCount += bidderInfo.lastLotNumber - bidderInfo.firstLotNumber + 1;
  result.map.set(bidderInfo.bidder.id!, callerState.caller.id!);
}

// ============================================
// CSP-BASED SOLVER (NEW IMPLEMENTATION)
// ============================================

/**
 * Computes assignments using the new CSP-based solver.
 * Provides more detailed results and better optimization.
 */
export function computeAssignmentsCSP(
  snapshot: PlanningSnapshot,
  options: AssignmentOptions = {}
): AssignmentResult {
  const lotGap = options.lotGap ?? 5;

  // Build lot number lookup
  const lotNumberByLotId = new Map(
    snapshot.lots.map(lot => [lot.id!, lot.number])
  );

  // Build bidder lookup
  const bidderById = new Map(
    snapshot.bidders.map(bidder => [bidder.id!, bidder])
  );

  // Build caller info (only active callers)
  const activeCallerIds = new Set(
    snapshot.auctionCallers.map(ac => ac.callerId)
  );
  const callers: CallerInfo[] = snapshot.callers
    .filter(c => activeCallerIds.has(c.id!))
    .map(c => ({
      id: c.id!,
      languages: new Set(c.languages as Language[]),
    }));

  // Build lot-bidder pairs (exclude final assignments - they're pre-fixed)
  const lotBidders: LotBidderPair[] = snapshot.lotBidders
    .filter(lb => lb.status !== "final")
    .map(lb => ({
      lotId: lb.lotId,
      lotNumber: lotNumberByLotId.get(lb.lotId) ?? 0,
      bidderId: lb.bidderId,
      bidderLanguages: (bidderById.get(lb.bidderId)?.languages ?? []) as Language[],
      preferredCallerId: lb.preferredCallerId,
    }));

  // Build final assignments (user-locked entries the algorithm must respect)
  const finalAssignments = snapshot.lotBidders
    .filter(lb => lb.status === "final" && lb.callerId !== undefined)
    .map(lb => ({
      lotId: lb.lotId,
      lotNumber: lotNumberByLotId.get(lb.lotId) ?? 0,
      bidderId: lb.bidderId,
      callerId: lb.callerId!,
    }));

  // Build caller priorities from snapshot
  const callerPriorities = snapshot.callerPriorities?.map(cp => ({
    callerId: cp.callerId,
    bidderIds: cp.bidderIds,
  })) ?? [];

  // Create solver input
  const input: CSPInput = {
    lotBidders,
    callers,
    lotGap,
    allowLanguageFallback: options.allowLanguageFallback ?? true,
    callerPriorities,
    finalAssignments,
  };

  // Solve
  const solver = new CSPSolver(input);
  const solution = solver.solve();

  // Convert to legacy format for backwards compatibility
  const legacyMap = new Map<number, number>();
  for (const [key, callerId] of solution.assignments) {
    const parts = key.split(":");
    const bidderIdStr = parts[1];
    if (bidderIdStr === undefined) continue;
    const bidderId = parseInt(bidderIdStr, 10);
    // Only set if not already set (first assignment wins for legacy format)
    if (!legacyMap.has(bidderId)) {
      legacyMap.set(bidderId, callerId);
    }
  }

  const unscheduledBidders = [...new Set(
    solution.unassigned.map(lb => lb.bidderId)
  )];

  return {
    map: legacyMap,
    unscheduled: unscheduledBidders,
    detailed: {
      assignments: solution.assignments,
      unassigned: solution.unassigned.map(lb => ({
        lotId: lb.lotId,
        bidderId: lb.bidderId,
      })),
      score: solution.score,
      scoreBreakdown: solution.scoreBreakdown,
      constraintNotes: solution.constraintNotes,
    },
  };
}

/**
 * Computes assignments using AuctionConfig settings.
 */
export function computeAssignmentsWithConfig(
  snapshot: PlanningSnapshot,
  config: AuctionConfig
): AssignmentResult {
  return computeAssignmentsCSP(snapshot, {
    lotGap: config.lotGap,
    allowLanguageFallback: config.allowLanguageFallback,
  });
}

