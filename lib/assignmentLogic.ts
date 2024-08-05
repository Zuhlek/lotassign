import { Assignment } from "@/lib/models/assignment.model";
import { Caller } from "@/lib/models/caller.model";
import { AssignmentService } from "@/lib/services/assignment.service";
import { LotService } from "@/lib/services/lot.service";
import { AuctionService } from "@/lib/services/auction.service";
import { Lot } from "@/lib/models/lot.model";
import { db } from "@/lib/dexie.db";

export async function assignCallersToBidders(auctionId: number) {
  const callers = await AuctionService.getCallersForAuction(auctionId);
  const lots = await LotService.getAllLotsByAuctionId(auctionId);
  let nextAndCurrAndPrevLots = [];

  for (const l of lots) {
    const assignments = await AssignmentService.getAssignmentsByLotId(l.id);
    nextAndCurrAndPrevLots = await LotService.getNextAndCurrentAndPreviousNLots(l.number, 4);
    for (const a of assignments) {
      if (a.isFinal || a.callerId) continue;

      //const alreadyAssignedCaller = await AssignmentService.getCallerWhoWasAlreadyAssignedToBidder(auctionId, a.bidderId);

      for (const caller of callers) {
        if (!caller.id) continue;

        const isEligible = await isTheCallerEligible(caller.id, nextAndCurrAndPrevLots);
        if (isEligible) {
          await assignCallerToBidder(a, caller);
          break;
        }
      }
    }
  }
}

async function isTheCallerEligible(callerId: number, lots: Lot[]) {
  const relevantAssignments: Assignment[] = [];
  for (const l of lots) {
    const lotAssignments = await AssignmentService.getAssignmentsByLotId(l.id);
    if (lotAssignments) {
      for (const a of lotAssignments) {
        relevantAssignments.push(a);
      }
    }
  }

  for (const assignment of relevantAssignments) {
    if (assignment.callerId === callerId) {
      return false;
    }
  }

  return true;
}

async function assignCallerToBidder(relevantAssignment: Assignment, caller: Caller) {
  if (!relevantAssignment.id) return;
  await AssignmentService.updateAssignment(relevantAssignment.id, {
    lotId: relevantAssignment.lotId,
    bidderId: relevantAssignment.bidderId,
    isFinal: relevantAssignment.isFinal,
    callerId: caller.id,
  });
}

export async function removeAllCallersFromAssignmentsByAuctionId(auctionId: number) {
  const lots = await LotService.getAllLotsByAuctionId(auctionId);
  for (const l of lots) {
    const assignments = await AssignmentService.getAssignmentsByLotId(l.id);
    for (const a of assignments) {
      if (a.callerId && a.id) {
        await AssignmentService.updateAssignment(a.id, {
          lotId: a.lotId,
          bidderId: a.bidderId,
          isFinal: a.isFinal,
          callerId: undefined,
        });
      }
    }
  }
  await db.assignments.toArray(); 
}