import { db } from "@/lib/dexie.db";
import { Lot } from "@/lib/models/lot.model";

export const LotService = {
  async createLot(lot: Lot) {
    return await db.lots.add(lot);
  },
  async getAllLots() {
    return await db.lots.toArray();
  },
  async getLotById(id: number) {
    return await db.lots.get(id);
  },
  async updateLot(id: number, lot: Lot) {
    return await db.lots.update(id, lot);
  },
  async deleteLot(id: number) {
    return await db.lots.delete(id);
  },
  async getAllLotsByAuctionId(auctionId: number) {
    return db.lots.filter((l) => l.auctionId === auctionId).toArray();
  },
  async getNextAndCurrentAndPreviousNLots(lotNumber: number, range: number, auctionId: number) {
    const minLotNumber = lotNumber - range;
    const maxLotNumber = lotNumber + range;

    const lots: Lot[] = await db.lots
      .where("number")
      .between(minLotNumber, maxLotNumber, true, true) // true, true bedeutet inklusiv der Grenzen
      .and((lot) => lot.auctionId === auctionId)
      .toArray();

    return lots;},
};
