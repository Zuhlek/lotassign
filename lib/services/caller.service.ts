import { CallerRepo } from '@/lib/repos/indexeddb/caller.repo';
import { Caller } from '../models/caller.model';

export const CallerService = {
  async createCaller(caller: Caller) {
    return await CallerRepo.create(caller);
  },
  async getAllCallers() {
    return await CallerRepo.getAll();
  },
  async getCallerById(id: number) {
    return await CallerRepo.getById(id);
  },
  async updateCaller(id: number, caller: Caller) {
    return await CallerRepo.update(id, caller);
  },
  async deleteCaller(id: number) {
    return await CallerRepo.delete(id);
  }
};
