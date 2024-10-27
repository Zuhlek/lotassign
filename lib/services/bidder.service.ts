import { Bidder } from "@/lib/models/bidder.model";
import { bidderRepo } from "@/lib/repositories/bidder.repo";

export class BidderService {
  async createBidder(bidder: Bidder): Promise<number> {
    return await bidderRepo.createBidder(bidder);
  }

  async getAllBidders(): Promise<Bidder[]> {
    return await bidderRepo.getAllBidders();
  }

  async getBidderById(id: number): Promise<Bidder | undefined> {
    return await bidderRepo.getBidderById(id);
  }

  async updateBidder(bidder: Bidder): Promise<number | undefined> {
    return await bidderRepo.updateBidder(bidder);
  }

  async deleteBidder(id: number): Promise<void> {
    await bidderRepo.deleteBidder(id);
  }
}

export const bidderService = new BidderService();
