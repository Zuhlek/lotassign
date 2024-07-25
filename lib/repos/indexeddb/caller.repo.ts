import { Caller } from '@/lib/models/caller.model';
import { db } from '../../dexie.db';

export const CallerRepo = {
  async create(caller: Caller) {
    return await db.callers.add(caller);
  },
  async getAll() {
    return await db.callers.toArray();
  },
  async getById(id: number) {
    return await db.callers.get(id);
  },
  async update(id: number, caller: Partial<Caller>) {
    const updatedFields: Partial<Caller> = {
      name: caller.name,
      abbreviation: caller.abbreviation,
      languages: caller.languages,
    };
    return await db.callers.update(id, updatedFields);
  },
  async delete(id: number) {
    return await db.callers.delete(id);
  }
};
