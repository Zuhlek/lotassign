import { Assignment } from "@/lib/models/assignment.model";
import { assignmentRepo } from "@/lib/repositories/assignment.repo";
import { callerRepo } from "@/lib/repositories/caller.repo";
import { lotRepo } from "@/lib/repositories/lot.repo";
import { bidderRepo } from "@/lib/repositories/bidder.repo";


class AssignmentService {
  async createAssignment(assignment: Assignment): Promise<number> {
    return await assignmentRepo.createAssignment(assignment);
  }

  async getAllAssignments(): Promise<Assignment[]> {
    const assignmentDTOs = await assignmentRepo.getAllAssignments();
    return await Promise.all(
      assignmentDTOs.map(async (dto) => {
        let assignment;
        const lot = await lotRepo.getLotById(dto.lotId);
        const bidder = await bidderRepo.getBidderById(dto.bidderId);
        assignment = dto.toModel(bidder!, lot!);

        if (dto.callerId) {
          assignment.caller = await callerRepo.getCallerById(dto.callerId);
        }
        return assignment;
      })
    );
  }

  async getAssignmentById(id: number): Promise<Assignment | undefined> {
    const dto = await assignmentRepo.getAssignmentById(id);
    if (!dto) return undefined;
    let assignment;
    const lot = await lotRepo.getLotById(dto.lotId);
    const bidder = await bidderRepo.getBidderById(dto.bidderId);
    assignment = dto.toModel(bidder!, lot!);

    if (dto.callerId) {
      assignment.caller = await callerRepo.getCallerById(dto.callerId);
    }
    return assignment;
  }

  async updateAssignment(assignment: Assignment): Promise<number | undefined> {
    return await assignmentRepo.updateAssignment(assignment);
  }

  async deleteAssignment(id: number): Promise<void> {
    await assignmentRepo.deleteAssignment(id);
  }

  async removeAllCallerIdsFromAssignments(auctionId: number): Promise<void> {
    await assignmentRepo.removeAllCallerIdsFromAssignments(auctionId);
  }

  async getAssignmentsByLotId(lotId: number): Promise<Assignment[]> {
    const assignmentDTOs = await assignmentRepo.getAssignmentsByLotId(lotId);
    return await Promise.all(
      assignmentDTOs.map(async (dto) => {
        let assignment;
        const lot = await lotRepo.getLotById(dto.lotId);
        const bidder = await bidderRepo.getBidderById(dto.bidderId);
        assignment = dto.toModel(bidder!, lot!);

        if (dto.callerId) {
          assignment.caller = await callerRepo.getCallerById(dto.callerId);
        }
        return assignment;
      })
    );
  }

  async getAssignmentsWithNoCallerByAuctionId(auctionId: number): Promise<Assignment[]> {
    const assignmentDTOs = await assignmentRepo.getAssignmentsWithNoCallerByAuctionId(auctionId);
    return await Promise.all(
      assignmentDTOs.map(async (dto) => {
        let assignment;
        const lot = await lotRepo.getLotById(dto.lotId);
        const bidder = await bidderRepo.getBidderById(dto.bidderId);
        assignment = dto.toModel(bidder!, lot!);

        if (dto.callerId) {
          assignment.caller = await callerRepo.getCallerById(dto.callerId);
        }
        return assignment;
      })
    );
  }

  async getAssignmentsByAuctionId(auctionId: number): Promise<Assignment[]> {
    const assignmentDTOs = await assignmentRepo.getAssignmentsByAuctionId(auctionId);
    return await Promise.all(
      assignmentDTOs.map(async (dto) => {
        let assignment;
        const lot = await lotRepo.getLotById(dto.lotId);
        const bidder = await bidderRepo.getBidderById(dto.bidderId);
        assignment = dto.toModel(bidder!, lot!);

        if (dto.callerId) {
          assignment.caller = await callerRepo.getCallerById(dto.callerId);
        }
        return assignment;
      })
    );
  }
}

export const assignmentService = new AssignmentService();