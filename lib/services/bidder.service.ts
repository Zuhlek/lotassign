import { Bidder } from "@/lib/models/bidder.model";
import { bidderRepo } from "../repositories/bidder.repo";

class BidderService {
  async createBidder(bidder: Bidder) {
    return bidderRepo.createBidder(bidder);
  }
  async getAllBidders() {
    return bidderRepo.getBidders();
  }
  async getBidderById(id: number) {
    return bidderRepo.getBidderById(id);
  }
  async updateBidder(id: number, bidder: Bidder) {
    return bidderRepo.updateBidder(id, bidder);
  }
  async deleteBidder(id: number) {
    return bidderRepo.deleteBidder(id);
  }
};

export const bidderService = new  BidderService();
