import { Auction } from "@/lib/models/auction.model";
import { db } from "@/lib/db/dexie.db";
import { Caller } from "@/lib/models/caller.model";

export const AuctionService = {
    async createAuction(auction: Auction) {
        return await db.auctions.add(auction);
      },
      async getAllAuctions() {
        return await db.auctions.toArray();
      },

      async getAuctionById(id: number) {
        return await db.auctions.get(id);
      },
      async updateAuction(id: number, auction: Auction) {
        return await db.auctions.update(id, auction);
      },
      async deleteAuction(id: number) {
        return await db.auctions.delete(id);
      },
      async getCallersForAuction(id: number){
        const auction = await db.auctions.get(id);
        const callers: Caller[] = [];
        if (auction && auction.callerIds) {
          for (const callerId of auction.callerIds) {
            const caller = await db.callers.get(callerId);
            if (caller) {
              callers.push(caller);
            }
          }
        } else {
          console.error("no callers assigned to auction number ", id);
        }
        return callers;
      }
}