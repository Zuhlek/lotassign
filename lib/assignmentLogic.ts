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
  debugger;
  let nextAndCurrAndPrevLots = [];

  for (const l of lots) {
    const assignments = await AssignmentService.getAssignmentsByLotId(l.id);
    nextAndCurrAndPrevLots = await LotService.getNextAndCurrentAndPreviousNLots(l.number, 4, auctionId);
    for (const a of assignments) {
      if (a.isFinal || a.callerId) continue;

      for (const caller of callers) {
        if (!caller.id) continue;

        const isEligible = await isTheCallerEligible(caller.id, nextAndCurrAndPrevLots);
        if (isEligible) {
          await assignCallerToBidder(a, caller, auctionId);
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
debugger;
  return true;
}

async function assignCallerToBidder(relevantAssignment: Assignment, caller: Caller, auctionId: number) {
  if (!relevantAssignment.id) return;

  const lots = await LotService.getAllLotsByAuctionId(auctionId);
  const assignmentsToUpdate: Assignment[] = [];

  assignmentsToUpdate.push(relevantAssignment);

  for (const l of lots) {
    const assignments = await AssignmentService.getAssignmentsByLotId(l.id);
    for (const a of assignments) {
      if (a.bidderId === relevantAssignment.bidderId && !a.isFinal && (!a.callerId || a.id === relevantAssignment.id)) {
        assignmentsToUpdate.push(a);
      }
    }
  }

  for (const assignment of assignmentsToUpdate) {
    if(!assignment.id) continue;
    await AssignmentService.updateAssignment(assignment.id, {
      lotId: assignment.lotId,
      bidderId: assignment.bidderId,
      isFinal: assignment.isFinal,
      callerId: caller.id,
    });
    console.log(`Assigned ${caller.name} to ${assignment.bidderId} for lot ${assignment.lotId}`);
  }
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