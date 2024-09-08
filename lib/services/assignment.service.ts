import { Assignment } from "@/lib/models/assignment.model";
import { db } from "@/lib/db/dexie.db";
import { LotService } from "./lot.service";

export const AssignmentService = {
  async createAssignment(assignment: Assignment) {
    return await db.assignments.add(assignment);
  },
  async getAllAssignments() {
    return await db.assignments.toArray();
  },
  async getAssignmentById(id: number) {
    return await db.assignments.get(id);
  },
  async updateAssignment(id: number, assignment: Assignment) {
    return await db.assignments.update(id, assignment);
  },
  async deleteAssignment(id: number) {
    return await db.assignments.delete(id);
  },
  async removeAllCallerIdsFromAssignments(auctionId: number) {
    const relevantLots = await db.lots.filter((l) => l.auctionId === auctionId).toArray();
    for (const l of relevantLots) {
      if (!l.assignmentIds) continue;
      for (const aId of l.assignmentIds) {
        await db.assignments.update(aId, { callerId: undefined });
      }
    }
  },
  async getAssignmentsByLotId(lotId: number | undefined) {
    if (!lotId) {
      throw Error("lotId is required");
    }
    return await db.assignments.filter((a) => a.lotId === lotId).toArray();
  },
  async getAssignmentsWithNoCallerByAuctionId(auctionId: number) {
    const lots = await LotService.getAllLotsByAuctionId(auctionId);
    const assignments: Assignment[] = [];
    for (const l of lots) {
      const a = await db.assignments.filter((a) => a.lotId === l.id && !a.callerId).toArray();
      assignments.push(...a);
    }
    return assignments;
  },
  async getAssignmentsByAuctionId(auctionId: number) {
    const lots = await LotService.getAllLotsByAuctionId(auctionId);
    const assignments: Assignment[] = [];
    for (const l of lots) {
      const a = await db.assignments.filter((a) => a.lotId === l.id).toArray();
      assignments.push(...a);
    }
    return assignments;
  }
  
};
