import { Assignment } from "@/lib/models/assignment.model";
import { Caller } from "@/lib/models/caller.model";
import { AssignmentService } from "@/lib/services/assignment.service";
import { LotService } from "@/lib/services/lot.service";
import { AuctionService } from "@/lib/services/auction.service";
import { Lot } from "@/lib/models/lot.model";
import { db } from "@/lib/db/dexie.db";

export class AssignmentLogic {
  private assignmentService: typeof AssignmentService;
  private lotService: typeof LotService;
  private auctionService: typeof AuctionService;

  constructor(
    assignmentService: typeof AssignmentService,
    lotService: typeof LotService,
    auctionService: typeof AuctionService
  ) {
    this.assignmentService = assignmentService;
    this.lotService = lotService;
    this.auctionService = auctionService;
  }

  /**
   * Assign callers to bidders for a given auction.
   */
  async assignCallersToBidders(auctionId: number): Promise<void> {
    const callers = await this.auctionService.getCallersForAuction(auctionId);
    const lots = await this.lotService.getAllLotsByAuctionId(auctionId);

    if (!callers || !lots) {
      alert("No callers or lots found for this auction");
      return;
    }

    for (const lot of lots) {
      const assignments = await this.assignmentService.getAssignmentsByLotId(lot.id);
      const nextAndCurrAndPrevLots = await this.lotService.getNextAndCurrentAndPreviousNLots(
        lot.number, 4, auctionId
      );

      for (const assignment of assignments) {
        if (assignment.isFinal || assignment.callerId) continue;

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
      const lotAssignments = await this.assignmentService.getAssignmentsByLotId(lot.id);
      if (lotAssignments) {
        relevantAssignments.push(...lotAssignments);
      }
    }

    for (const assignment of relevantAssignments) {
      if (assignment.callerId === callerId) {
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

    const lots = await this.lotService.getAllLotsByAuctionId(auctionId);
    const assignmentsToUpdate: Assignment[] = [relevantAssignment];

    for (const lot of lots) {
      const assignments = await this.assignmentService.getAssignmentsByLotId(lot.id);
      for (const assignment of assignments) {
        if (
          assignment.bidderId === relevantAssignment.bidderId &&
          !assignment.isFinal &&
          (!assignment.callerId || assignment.id === relevantAssignment.id)
        ) {
          assignmentsToUpdate.push(assignment);
        }
      }
    }

    for (const assignment of assignmentsToUpdate) {
      if (!assignment.id) continue;
      await this.assignmentService.updateAssignment(assignment.id, {
        lotId: assignment.lotId,
        bidderId: assignment.bidderId,
        isFinal: assignment.isFinal,
        callerId: caller.id,
      });
      console.log(`Assigned ${caller.name} to ${assignment.bidderId} for lot ${assignment.lotId}`);
    }
  }

  /**
   * Remove all callers from assignments for a specific auction.
   */
  async removeAllCallersFromAssignmentsByAuctionId(auctionId: number): Promise<void> {
    const lots = await this.lotService.getAllLotsByAuctionId(auctionId);

    for (const lot of lots) {
      const assignments = await this.assignmentService.getAssignmentsByLotId(lot.id);
      for (const assignment of assignments) {
        if (assignment.callerId && assignment.id) {
          await this.assignmentService.updateAssignment(assignment.id, {
            lotId: assignment.lotId,
            bidderId: assignment.bidderId,
            isFinal: assignment.isFinal,
            callerId: undefined,
          });
        }
      }
    }
    await db.assignments.toArray();
  }
}
