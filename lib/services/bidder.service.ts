import { Bidder } from "@/lib/models/bidder.model";
import { db } from "@/lib/dexie.db";

export const BidderService = {
    async createBidder(bidder: Bidder) {
        return await db.bidders.add(bidder);
      },
      async getAllBidders() {
        return await db.bidders.toArray();
      },
      async getBidderById(id: number) {
        return await db.bidders.get(id);
      },
      async updateBidder(id: number, bidder: Bidder) {
        return await db.bidders.update(id, bidder);
      },
      async deleteBidder(id: number) {
        return await db.bidders.delete(id);
      }
}