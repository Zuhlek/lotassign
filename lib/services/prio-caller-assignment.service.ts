import { PrioCallerAssignment } from "@/lib/models/prioCallerAssignment.model";
import { prioCallerAssignmentRepo } from "@/lib/repositories/prio-caller-assignment.repo";
import { auctionRepo } from "@/lib/repositories/auction.repo";
import { bidderRepo } from "@/lib/repositories/bidder.repo";
import { callerRepo } from "@/lib/repositories/caller.repo";

export class PrioCallerAssignmentService {
  async createPrioCallerAssignment(prioAssignment: PrioCallerAssignment): Promise<number> {
    return await prioCallerAssignmentRepo.createPrioCallerAssignment(prioAssignment);
  }

  async getAllPrioCallerAssignments(): Promise<PrioCallerAssignment[]> {
    const prioAssignmentDTOs = await prioCallerAssignmentRepo.getAllPrioCallerAssignments();
    return await Promise.all(
      prioAssignmentDTOs.map(async (dto) => {
        const auction = await auctionRepo.getAuctionById(dto.auctionId);
        const bidder = await bidderRepo.getBidderById(dto.bidderId);
        const caller = await callerRepo.getCallerById(dto.callerId);

        if (!auction) throw new Error(`Auction with ID ${dto.auctionId} not found`);
        if (!bidder) throw new Error(`Bidder with ID ${dto.bidderId} not found`);
        if (!caller) throw new Error(`Caller with ID ${dto.callerId} not found`);

        return dto.toModel(auction, bidder, caller);
      })
    );
  }

  async getPrioCallerAssignmentById(id: number): Promise<PrioCallerAssignment | undefined> {
    const dto = await prioCallerAssignmentRepo.getPrioCallerAssignmentById(id);
    if (!dto) return undefined;

    const auction = await auctionRepo.getAuctionById(dto.auctionId);
    const bidder = await bidderRepo.getBidderById(dto.bidderId);
    const caller = await callerRepo.getCallerById(dto.callerId);

    if (!auction) throw new Error(`Auction with ID ${dto.auctionId} not found`);
    if (!bidder) throw new Error(`Bidder with ID ${dto.bidderId} not found`);
    if (!caller) throw new Error(`Caller with ID ${dto.callerId} not found`);

    return dto.toModel(auction, bidder, caller);
  }

  async updatePrioCallerAssignment(prioAssignment: PrioCallerAssignment): Promise<number | undefined> {
    return await prioCallerAssignmentRepo.updatePrioCallerAssignment(prioAssignment);
  }

  async deletePrioCallerAssignment(id: number): Promise<void> {
    await prioCallerAssignmentRepo.deletePrioCallerAssignment(id);
  }
}

export const prioCallerAssignmentService = new PrioCallerAssignmentService();
