import { db } from "@/lib/db/dexie.db";
import { LotDTO } from "@/lib/dto/lot.dto";

class LotRepository {
  async createLot(lotDTO: LotDTO): Promise<number> {
    const createdId = await db.lots.add(lotDTO);
    return createdId ? createdId : -1;
  }

  async getLots(): Promise<LotDTO[]> {
    return await db.lots.toArray();
  }

  async getLotById(id: number): Promise<LotDTO | undefined> {
    return await db.lots.get(id);
  }

  async updateLot(id: number, updateData: Partial<LotDTO>): Promise<number | undefined> {
    return await db.lots.update(id, updateData);
  }

  async deleteLot(id: number): Promise<void> {
    await db.lots.delete(id);
  }

  async deleteAllLots(): Promise<void> {
    await db.lots.clear();
  }

  async getAllLots(): Promise<LotDTO[]> {
    return await db.lots.toArray();
  }
}

export const lotRepo = new LotRepository();
