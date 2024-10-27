import { db } from "@/lib/db/dexie.db";
import { BidderDTO } from "@/lib/dto/bidder.dto";
import { Bidder } from "@/lib/models/bidder.model";

export class BidderRepository {
  async createBidder(bidder: Bidder): Promise<number> {
    const bidderDTO = BidderDTO.fromModel(bidder);
    const createdId = await db.bidders.add(bidderDTO);
    return createdId ? createdId : -1;
  }

  async getAllBidders(): Promise<Bidder[]> {
    const bidderDTOs = await db.bidders.toArray();
    return bidderDTOs.map(dto => dto.toModel());
  }

  async getBidderById(id: number): Promise<Bidder | undefined> {
    const bidderDTO = await db.bidders.get(id);
    if (!bidderDTO) return undefined;
    return bidderDTO.toModel();
  }

  async updateBidder(bidder: Bidder): Promise<number | undefined> {
    if (!bidder.id) return undefined;
    const bidderDTO = BidderDTO.fromModel(bidder);
    const { id, ...updateData } = bidderDTO;
    return await db.bidders.update(bidder.id, updateData);
  }

  async deleteBidder(id: number): Promise<void> {
    await db.bidders.delete(id);
  }
}

export const bidderRepo = new BidderRepository();
