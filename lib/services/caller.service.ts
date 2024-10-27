import { Caller } from "@/lib/models/caller.model";
import { callerRepo } from "@/lib/repositories/caller.repo";

export class CallerService {

  async createCaller(caller: Caller): Promise<number> {
    return await callerRepo.createCaller(caller);
  }

  async getAllCallers(): Promise<Caller[]> {
    return await callerRepo.getAllCallers();
  }

  async getCallerById(id: number): Promise<Caller | undefined> {
    return await callerRepo.getCallerById(id);
  }

  async updateCaller(caller: Caller): Promise<number | undefined> {
    return await callerRepo.updateCaller(caller);
  }

  async deleteCaller(id: number): Promise<void> {
    await callerRepo.deleteCaller(id);
  }
}

export const callerService = new CallerService();
