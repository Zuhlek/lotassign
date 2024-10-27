import { db } from "@/lib/db/dexie.db";
import { PrioCallerAssignmentDTO } from "@/lib/dto/prio-caller-assignment.dto";
import { PrioCallerAssignment } from "@/lib/models/prioCallerAssignment.model";

class PrioCallerAssignmentRepository {
  async createPrioCallerAssignment(prioAssignment: PrioCallerAssignment): Promise<number> {
    const prioAssignmentDTO = PrioCallerAssignmentDTO.fromModel(prioAssignment);
    const createdId = await db.prioCallerAssignments.add(prioAssignmentDTO);
    return createdId ? createdId : -1;
  }

  async getAllPrioCallerAssignments(): Promise<PrioCallerAssignmentDTO[]> {
    return await db.prioCallerAssignments.toArray();
  }

  async getPrioCallerAssignmentById(id: number): Promise<PrioCallerAssignmentDTO | undefined> {
    return await db.prioCallerAssignments.get(id);
  }

  async getPrioCallerAssignmentsByAuctionId(auctionId: number): Promise<PrioCallerAssignmentDTO[]> {
    return await db.prioCallerAssignments.where('auctionId').equals(auctionId).toArray();
  }

  async updatePrioCallerAssignment(prioAssignment: PrioCallerAssignment): Promise<number | undefined> {
    if (!prioAssignment.id) return undefined;
    const prioAssignmentDTO = PrioCallerAssignmentDTO.fromModel(prioAssignment);
    const { id, ...updateData } = prioAssignmentDTO;
    return await db.prioCallerAssignments.update(prioAssignment.id, updateData);
  }

  async deletePrioCallerAssignment(id: number): Promise<void> {
    await db.prioCallerAssignments.delete(id);
  }
  
}

export const prioCallerAssignmentRepo = new PrioCallerAssignmentRepository();
