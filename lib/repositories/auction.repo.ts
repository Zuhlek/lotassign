import { db } from "@/lib/db/dexie.db";
import { AuctionDTO } from "@/lib/dto/auction.dto";
import { Auction } from "@/lib/models/auction.model";

export class AuctionRepository {
  async createAuction(auction: Auction): Promise<number> {
    const auctionDTO = AuctionDTO.fromModel(auction);
    const createdId = await db.auctions.add(auctionDTO);
    return createdId ? createdId : -1;
  }

  async getAllAuctions(): Promise<AuctionDTO[]> {
    return await db.auctions.toArray();
  }

  async getAuctionById(id: number): Promise<AuctionDTO | undefined> {
    return await db.auctions.get(id);
  }

  async updateAuction(auction: Auction): Promise<number | undefined> {
    if (!auction.id) return undefined;
    const auctionDTO = AuctionDTO.fromModel(auction);
    const { id, ...updateData } = auctionDTO;
    return await db.auctions.update(auction.id, updateData);
  }

  async deleteAuction(id: number): Promise<void> {
    await db.auctions.delete(id);
  }
}

export const auctionRepo = new AuctionRepository();
