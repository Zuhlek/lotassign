import { db } from '@/lib/dexie.db';
import { Caller } from '@/lib/models/caller.model';

export const CallerService = {
  async createCaller(caller: Caller) {
    return await db.callers.add(caller);
  },
  async getAllCallers() {
    return await db.callers.toArray();
  },
  async getCallerById(id: number) {
    return await db.callers.get(id);
  },
  async updateCaller(id: number, caller: Caller) {
    return await db.callers.update(id, caller);
  },
  async deleteCaller(id: number) {
    return await db.callers.delete(id);
  },
  async deleteAllCallers() {
    return await db.callers.clear();
  }
};
