import { db } from "@/lib/db/dexie.db";
import { AssignmentDTO } from "@/lib/dto/assignment.dto";
import { Assignment } from "@/lib/models/assignment.model";

class AssignmentRepo {
  async createAssignment(assignment: Assignment): Promise<number> {
    const assignmentDTO = AssignmentDTO.fromModel(assignment);
    const createdId = await db.assignments.add(assignmentDTO);
    return createdId ? createdId : -1;
  }

  async getAllAssignments(): Promise<AssignmentDTO[]> {
    return await db.assignments.toArray();
  }

  async getAssignmentById(id: number): Promise<AssignmentDTO | undefined> {
    return await db.assignments.get(id);
  }

  async updateAssignment(assignment: Assignment): Promise<number | undefined> {
    if (!assignment.id) return undefined;
    const assignmentDTO = AssignmentDTO.fromModel(assignment);
    const { id, ...updateData } = assignmentDTO;
    return await db.assignments.update(assignment.id, updateData);
  }

  async deleteAssignment(id: number): Promise<void> {
    await db.assignments.delete(id);
  }

  async removeAllCallerIdsFromAssignments(auctionId: number): Promise<void> {
    const relevantLots = await db.lots.filter(l => l.auctionId === auctionId).toArray();
    for (const lot of relevantLots) {
      if (!lot.assignmentIds) continue;
      for (const aId of lot.assignmentIds) {
        await db.assignments.update(aId, { callerId: undefined });
      }
    }
  }

  async getAssignmentsByLotId(lotId: number): Promise<AssignmentDTO[]> {
    return await db.assignments.where('lotId').equals(lotId).toArray();
  }

  async getAssignmentsWithNoCallerByAuctionId(auctionId: number): Promise<AssignmentDTO[]> {
    const lots = await db.lots.where('auctionId').equals(auctionId).toArray();
    const assignments: AssignmentDTO[] = [];
    for (const lot of lots) {
      const a = await db.assignments.where({ lotId: lot.id, callerId: undefined }).toArray();
      assignments.push(...a);
    }
    return assignments;
  }

  async getAssignmentsByAuctionId(auctionId: number): Promise<AssignmentDTO[]> {
    const lots = await db.lots.where('auctionId').equals(auctionId).toArray();
    const assignments: AssignmentDTO[] = [];
    for (const lot of lots) {
      if (!lot.id) continue;
      const a = await db.assignments.where('lotId').equals(lot.id).toArray();
      assignments.push(...a);
    }
    return assignments;
  }
}

export const assignmentRepo = new AssignmentRepo();
