import { Lot } from "@/lib/models/lot.model";
import { lotRepo } from "@/lib/repositories/lot.repo";
import { assignmentRepo } from "@/lib/repositories/assignment.repo";

class LotService {
  async createLot(lot: Lot): Promise<Lot> {
    const createdId = await lotRepo.createLot(lot);
    lot.id = createdId;
    //TODO - bulk update assignments
    for (const assignment of lot.assignments || []) {
      await assignmentRepo.updateAssignment(assignment);
    }
    return lot;
  }

  async getAllLots(): Promise<Lot[]> {
    const lots = await lotRepo.getAllLots();
    const lotsWithAssignments = await Promise.all(
      lots.map(async (lot) => {
        if (lot.id) {
          const assignments = await assignmentRepo.getAssignmentsByLotId(lot.id);
          lot.assignments = await Promise.all(assignments.map(a => a.toModel()));
        }
        return lot;
      })
    );
    return lotsWithAssignments;
  }

  async getLotById(id: number): Promise<Lot | undefined> {
    const lot = await lotRepo.getLotById(id);
    if (lot && lot.id) {
      const assignments = await assignmentRepo.getAssignmentsByLotId(lot.id);
      lot.assignments = await Promise.all(assignments.map(a => a.toModel()));
    }
    return lot;
  }

  async updateLot(lot: Lot): Promise<number | undefined> {
    const updatedCount = await lotRepo.updateLot(lot);
    //TODO - bulk update assignments
    for (const assignment of lot.assignments || []) {
      await assignmentRepo.updateAssignment(assignment);
    }
    return updatedCount;
  }

  async deleteLot(id: number): Promise<void> {
    await lotRepo.deleteLot(id);
    const assignmentsToDelete = await assignmentRepo.getAssignmentsByLotId(id);
    await Promise.all(assignmentsToDelete.map(a => assignmentRepo.deleteAssignment(a.id!)));
  }

  async getAllLotsByAuctionId(auctionId: number): Promise<Lot[]> {
    const lots = await lotRepo.getAllLotsByAuctionId(auctionId);
    const updatedLots = await Promise.all(
      lots.map(async (lot) => {
        if (lot.id) {
          const assignments = await assignmentRepo.getAssignmentsByLotId(lot.id);
          lot.assignments =await Promise.all(assignments.map(a => a.toModel()));
        }
        return lot;
      })
    );
    return updatedLots;
  }

  async getNextAndCurrentAndPreviousNLots(
    lotNumber: number,
    range: number,
    auctionId: number
  ): Promise<Lot[]> {
    const lots = await lotRepo.getNextAndCurrentAndPreviousNLots(lotNumber, range, auctionId);
    const updatedLots = await Promise.all(
      lots.map(async (lot) => {
        if (lot.id) {
          const assignments = await assignmentRepo.getAssignmentsByLotId(lot.id);
          lot.assignments =await Promise.all(assignments.map(a => a.toModel()));
        }
        return lot;
      })
    );
    return updatedLots;
  }
}

export const lotService = new LotService();
