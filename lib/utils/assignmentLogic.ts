import { Assignment } from "@/lib/models/assignment.model";
import { Caller } from "@/lib/models/caller.model";
import { Lot } from "@/lib/models/lot.model";
import { db } from "@/lib/db/dexie.db";
import { assignmentService } from "../services/assignment.service";
import { auctionService } from "../services/auction.service";
import { lotService } from "../services/lot.service";

export class AssignmentLogic {

  /**
   * Assign callers to bidders for a given auction.
   */
  async assignCallersToBidders(auctionId: number): Promise<void> {
    const auction = await auctionService.getAuctionById(auctionId);
    const callers = auction?.callers;
    const lots = auction?.lots;

    if (!callers || !lots) {
      alert("No callers or lots found for this auction");
      return;
    }

    for (const lot of lots) {
      const assignments = await assignmentService.getAssignmentsByLotId(lot.id!);
      const nextAndCurrAndPrevLots = await lotService.getNextAndCurrentAndPreviousNLots(
        lot.number, 4, auctionId
      );

      for (const assignment of assignments) {
        if (assignment.isFinal || assignment.caller?.id) continue;

        for (const caller of callers) {
          if (!caller.id) continue;

          const isEligible = await this.isTheCallerEligible(caller.id, nextAndCurrAndPrevLots);
          if (isEligible) {
            await this.assignCallerToBidder(assignment, caller, auctionId);
            break;
          }
        }
      }
    }
  }

  /**
   * Check if a caller is eligible to be assigned to a bidder for certain lots.
   */
  private async isTheCallerEligible(callerId: number, lots: Lot[]): Promise<boolean> {
    const relevantAssignments: Assignment[] = [];

    for (const lot of lots) {
      const lotAssignments = await assignmentService.getAssignmentsByLotId(lot.id!);
      if (lotAssignments) {
        relevantAssignments.push(...lotAssignments);
      }
    }

    for (const assignment of relevantAssignments) {
      if (assignment.caller?.id === callerId) {
        return false;
      }
    }
    return true;
  }

  /**
   * Assign a caller to a bidder for the relevant assignment and update other associated assignments.
   */
  private async assignCallerToBidder(
    relevantAssignment: Assignment,
    caller: Caller,
    auctionId: number
  ): Promise<void> {
    if (!relevantAssignment.id) return;

    const lots = await lotService.getAllLotsByAuctionId(auctionId);
    const assignmentsToUpdate: Assignment[] = [relevantAssignment];

    for (const lot of lots) {
      const assignments = await assignmentService.getAssignmentsByLotId(lot.id!);
      for (const assignment of assignments) {
        if (
          assignment.bidder.id === relevantAssignment.bidder.id &&
          !assignment.isFinal &&
          (!assignment.caller?.id || assignment.id === relevantAssignment.id)
        ) {
          assignmentsToUpdate.push(assignment);
        }
      }
    }

    for (const assignment of assignmentsToUpdate) {
      if (!assignment.id) continue;
      await assignmentService.updateAssignment({
        id: assignment.id,
        lot: assignment.lot,
        bidder: assignment.bidder,
        isFinal: assignment.isFinal,
        caller: undefined,
      });
      console.log(`Assigned ${caller.name} to ${assignment.bidder.id} for lot ${assignment.lot.id}`);
    }
  }

  /**
   * Remove all callers from assignments for a specific auction.
   */
  async removeAllCallersFromAssignmentsByAuctionId(auctionId: number): Promise<void> {
    const lots = await lotService.getAllLotsByAuctionId(auctionId);

    for (const lot of lots) {
      const assignments = await assignmentService.getAssignmentsByLotId(lot.id!);
      for (const assignment of assignments) {
        if (assignment.caller?.id && assignment.id) {
          await assignmentService.updateAssignment({
            id: assignment.id,
            lot: assignment.lot,
            bidder: assignment.bidder,
            isFinal: assignment.isFinal,
            caller: undefined,
          });
        }
      }
    }
    await db.assignments.toArray();
  }
}
