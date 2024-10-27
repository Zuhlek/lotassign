import { db } from "@/lib/db/dexie.db";
import { LotDTO } from "@/lib/dto/lot.dto";
import { Lot } from "@/lib/models/lot.model";

class LotRepository {
  async createLot(lot: Lot): Promise<number> {
    const lotDTO = LotDTO.fromModel(lot);
    const createdId = await db.lots.add(lotDTO);
    return createdId ? createdId : -1;
  }

  async getAllLots(): Promise<Lot[]> {
    const lotDTOs = await db.lots.toArray();
    return lotDTOs.map(dto => dto.toModel());
  }

  async getLotById(id: number): Promise<Lot | undefined> {
    const lotDTO = await db.lots.get(id);
    if (!lotDTO) return undefined;
    return lotDTO.toModel();
  }

  async updateLot(lot: Lot): Promise<number | undefined> {
    if (!lot.id) return undefined;
    const lotDTO = LotDTO.fromModel(lot);
    const { id, ...updateData } = lotDTO;
    return await db.lots.update(lot.id, updateData);
  }

  async deleteLot(id: number): Promise<void> {
    await db.lots.delete(id);
  }

  async getAllLotsByAuctionId(auctionId: number): Promise<Lot[]> {
    const lotDTOs = await db.lots.where('auctionId').equals(auctionId).toArray();
    return lotDTOs.map(dto => dto.toModel());
  }

  async getNextAndCurrentAndPreviousNLots(
    lotNumber: number,
    range: number,
    auctionId: number
  ): Promise<Lot[]> {
    const minLotNumber = lotNumber - range;
    const maxLotNumber = lotNumber + range;
    const lotDTOs = await db.lots
      .where("number")
      .between(minLotNumber, maxLotNumber, true, true)
      .and(lot => lot.auctionId === auctionId)
      .toArray();
    return lotDTOs.map(dto => dto.toModel());
  }
}

export const lotRepo = new LotRepository();
