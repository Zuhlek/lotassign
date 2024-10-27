import { db } from "@/lib/db/dexie.db";
import { CallerDTO } from "@/lib/dto/caller.dto";
import { Caller } from "@/lib/models/caller.model";

export class CallerRepository {
  async createCaller(caller: Caller): Promise<number> {
    const callerDTO = CallerDTO.fromModel(caller);
    const createdId = await db.callers.add(callerDTO);
    return createdId ? createdId : -1;
  }

  async getAllCallers(): Promise<Caller[]> {
    const callerDTOs = await db.callers.toArray();
    return callerDTOs.map(dto => dto.toModel());
  }

  async getCallerById(id: number): Promise<Caller | undefined> {
    const callerDTO = await db.callers.get(id);
    if (!callerDTO) return undefined;
    return callerDTO.toModel();
  }

  async updateCaller(caller: Caller): Promise<number | undefined> {
    if (!caller.id) return undefined;
    const callerDTO = CallerDTO.fromModel(caller);
    const { id, ...updateData } = callerDTO;
    return await db.callers.update(caller.id, updateData);
  }

  async deleteCaller(id: number): Promise<void> {
    await db.callers.delete(id);
  }
}

export const callerRepo = new CallerRepository();
