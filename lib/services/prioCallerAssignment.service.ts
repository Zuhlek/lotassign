import { db } from "@/lib/db/dexie.db";
import { PrioCallerAssignment } from "../models/prioCallerAssignment";

export const PrioCallerAssignmentService = {
  async createPrioAssignment(assignment: PrioCallerAssignment) {
    return await db.prioCallerAssignments.add(assignment);
  },
  async getPrioAssignmentsByAuctionId(auctionId: number) {
    return db.prioCallerAssignments
      .filter((assignment) => assignment.auctionId === auctionId)
      .toArray();
  },
  async updatePrioAssignment(id: number, assignment: PrioCallerAssignment) {
    return await db.prioCallerAssignments.update(id, assignment);
  },
  async deletePrioAssignment(bidderId: number, auctionId: number) {
    // Finde das PrioCallerAssignment mit der passenden bidderId und auctionId und lösche es
    const assignmentToDelete = await db.prioCallerAssignments
      .where({ bidderId, auctionId })
      .first();

    if (assignmentToDelete) {
      await db.prioCallerAssignments.delete(assignmentToDelete.id);
    }
  },
  async getPrioAssignmentsByCallerIdAndAuctionId(callerId: number, auctionId: number) {
    // Finde alle PrioCallerAssignments für den gegebenen Caller und die Auction
    return db.prioCallerAssignments
      .where({ callerId, auctionId })
      .toArray();
  },
};
