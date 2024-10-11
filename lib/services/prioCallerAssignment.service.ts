import { db } from "@/lib/db/dexie.db";
import { PrioCallerAssignment } from "../models/prioCallerAssignment";

export const PrioCallerAssignmentService = {
  async createPrioAssignment(assignment: PrioCallerAssignment) {
    console.log("PrioCallerAssignmentService.createPrioAssignment", assignment);
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
  async deletePrioAssignmentByBidderAndAuctionId(bidderId: number, auctionId: number) {
    const assignmentToDelete = await db.prioCallerAssignments
      .where({ bidderId, auctionId })
      .first();

    if (assignmentToDelete) {
      await db.prioCallerAssignments.delete(assignmentToDelete.id);
    }
  },
  async deletePrioAssignment(id: number) {
    return await db.prioCallerAssignments.delete(id);
  },
  async getPrioAssignmentsByCallerIdAndAuctionId(callerId: number, auctionId: number) {

    return db.prioCallerAssignments
      .where({ callerId, auctionId })
      .toArray();
  },
};
