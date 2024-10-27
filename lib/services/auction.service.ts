import { Auction } from "@/lib/models/auction.model";
import { auctionRepo } from "@/lib/repositories/auction.repo";
import { lotRepo } from "@/lib/repositories/lot.repo";
import { callerRepo } from "@/lib/repositories/caller.repo";
import { Lot } from "@/lib/models/lot.model";
import { Caller } from "@/lib/models/caller.model";

export class AuctionService {
  async createAuction(auction: Auction): Promise<number> {
    return await auctionRepo.createAuction(auction);
  }

  async getAllAuctions(): Promise<Auction[]> {
    const auctionDTOs = await auctionRepo.getAllAuctions();
    return await Promise.all(
      auctionDTOs.map(async (dto) => {
        const lots: Lot[] = [];
        const callers: Caller[] = [];

        if (dto.lotIds && dto.lotIds.length > 0) {
          for (const lotId of dto.lotIds) {
            const lot = await lotRepo.getLotById(lotId);
            if (lot) {
              lots.push(lot);
            }
          }
        }

        if (dto.callerIds && dto.callerIds.length > 0) {
          for (const callerId of dto.callerIds) {
            const caller = await callerRepo.getCallerById(callerId);
            if (caller) {
              callers.push(caller);
            }
          }
        }

        return dto.toModel(lots, callers);
      })
    );
  }

  async getAuctionById(id: number): Promise<Auction | undefined> {
    const dto = await auctionRepo.getAuctionById(id);
    if (!dto) return undefined;

    const lots: Lot[] = [];
    const callers: Caller[] = [];

    if (dto.lotIds && dto.lotIds.length > 0) {
      for (const lotId of dto.lotIds) {
        const lot = await lotRepo.getLotById(lotId);
        if (lot) {
          lots.push(lot);
        }
      }
    }

    if (dto.callerIds && dto.callerIds.length > 0) {
      for (const callerId of dto.callerIds) {
        const caller = await callerRepo.getCallerById(callerId);
        if (caller) {
          callers.push(caller);
        }
      }
    }

    return dto.toModel(lots, callers);
  }

  async updateAuction(auction: Auction): Promise<number | undefined> {
    return await auctionRepo.updateAuction(auction);
  }

  async deleteAuction(id: number): Promise<void> {
    await auctionRepo.deleteAuction(id);
  }
}

export const auctionService = new AuctionService();
