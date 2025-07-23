import { getPlanningSnapshot, persistCallerAssignments, PlanningSnapshot, } from "@/lib/actions/assignment-logic.actions";
import { BidderJSON } from "@/lib/models/bidder.model";
import { CallerJSON } from "@/lib/models/caller.model";
import { Language } from "./models/language.enum";

export interface AssignmentResult {
  map: Map<number, number>;
  unscheduled: number[];
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

export class AssignmentService {
  static async run(auctionId: number, lotGap = 4): Promise<AssignmentResult> {
    const snapshot = await getPlanningSnapshot(auctionId);
    const assignment = this.computeAssignments(snapshot, lotGap);
    await persistCallerAssignments(auctionId, assignment.map);
    return assignment;
  }

  private static computeAssignments(
    snapshot: PlanningSnapshot,
    lotGap: number,
  ): AssignmentResult {
    const lotNumberByLotId = new Map(snapshot.lots.map(lot => [lot.id!, lot.number]));
    const bidderInfoMap    = this.buildBidderInfoMap(snapshot, lotNumberByLotId);
    const callerStateMap   = this.buildCallerStateMap(snapshot);

    const result: AssignmentResult = { map: new Map(), unscheduled: [] };

    this.assignPreferredCallers(bidderInfoMap, callerStateMap, lotGap, result);
    this.assignRegularCallers(bidderInfoMap, callerStateMap, lotGap, result);

    return result;
  }

  private static buildBidderInfoMap(
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
        lastLotNumber:  lotNumber,
        preferredCallerId: lotBidderRow.preferredCallerId,
      };

      bidderInfo.lots.push(lotNumber);
      bidderInfo.firstLotNumber = Math.min(bidderInfo.firstLotNumber, lotNumber);
      bidderInfo.lastLotNumber  = Math.max(bidderInfo.lastLotNumber,  lotNumber);
      if (lotBidderRow.preferredCallerId !== undefined)
        bidderInfo.preferredCallerId = lotBidderRow.preferredCallerId;

      bidderInfoMap.set(lotBidderRow.bidderId, bidderInfo);
    }

    return bidderInfoMap;
  }

  private static buildCallerStateMap(
    snapshot: PlanningSnapshot,
  ): Map<number, CallerState> {
    const activeCallerIds = new Set(snapshot.auctionCallers.map(ac => ac.callerId));
    const callerStateMap  = new Map<number, CallerState>();

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

  private static assignPreferredCallers(
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
        if (!callerState || !this.isTimingFeasible(bidderInfo, callerState)) {
          result.unscheduled.push(bidderInfo.bidder.id!);
          return;
        }
        this.assignCallerToBidder(bidderInfo, callerState, lotGap, result);
      });
  }

  private static assignRegularCallers(
    bidderInfoMap: Map<number, BidderInfo>,
    callerStateMap: Map<number, CallerState>,
    lotGap: number,
    result: AssignmentResult,
  ) {
    [...bidderInfoMap.values()]
      .filter(info => info.preferredCallerId === undefined)
      .sort((a, b) => a.firstLotNumber - b.firstLotNumber)
      .forEach(bidderInfo => {
        let callerState = this.selectBestCaller(bidderInfo, callerStateMap, true);
        if (!callerState) callerState = this.selectBestCaller(bidderInfo, callerStateMap, false);

        if (!callerState) {
          result.unscheduled.push(bidderInfo.bidder.id!);
          return;
        }
        this.assignCallerToBidder(bidderInfo, callerState, lotGap, result);
      });
  }

  private static selectBestCaller(
    bidderInfo: BidderInfo,
    callerStateMap: Map<number, CallerState>,
    respectLanguages: boolean,
  ): CallerState | undefined {
    let bestCallerState: CallerState | undefined;
    let bestScore = Infinity;

    for (const callerState of callerStateMap.values()) {
      if (!this.isTimingFeasible(bidderInfo, callerState)) continue;
      if (respectLanguages && !this.languagesCompatible(bidderInfo, callerState)) continue;

      const candidateScore =
        callerState.assignedLotCount + (bidderInfo.lastLotNumber - bidderInfo.firstLotNumber + 1);

      if (candidateScore < bestScore) {
        bestScore = candidateScore;
        bestCallerState = callerState;
      }
    }
    return bestCallerState;
  }

  private static isTimingFeasible(bidderInfo: BidderInfo, callerState: CallerState) {
    return bidderInfo.firstLotNumber >= callerState.nextFreeLot;
  }

  private static languagesCompatible(bidderInfo: BidderInfo, callerState: CallerState) {
    if (!bidderInfo.bidder.languages?.length) return true;
    if (!callerState.languagesSet.size) return true;

    return bidderInfo.bidder.languages.some(language =>
      callerState.languagesSet.has(language as Language),
    );
  }

  private static assignCallerToBidder(
    bidderInfo: BidderInfo,
    callerState: CallerState,
    lotGap: number,
    result: AssignmentResult,
  ) {
    callerState.nextFreeLot      = bidderInfo.lastLotNumber + lotGap;
    callerState.assignedLotCount += bidderInfo.lastLotNumber - bidderInfo.firstLotNumber + 1;
    result.map.set(bidderInfo.bidder.id!, callerState.caller.id!);
  }
}
