import { db } from '@/lib/db/dexie.db';
import { Caller } from '@/lib/models/caller.model';

class CallerRepository {
  async createCaller(caller: Caller): Promise<number> {
    const createdCallerId = await db.callers.add({
      name: caller.name,
      abbreviation: caller.abbreviation,
      languages: caller.languages, 
    });
    return createdCallerId ? createdCallerId : -1;
  }

  async getCallers(): Promise<Caller[]> {
    const callers = await db.callers.toArray();
    return callers.map(c => new Caller(c.id, c.name, c.abbreviation, c.languages));
  }

  async getCallerById(id: number): Promise<Caller | null> {
    const caller = await db.callers.get(id);
    if (!caller) return null;
    return new Caller(caller.id, caller.name, caller.abbreviation, caller.languages);
  }

  async updateCaller(id: number, caller: Caller): Promise<number> {
    return await db.callers.update(id, {
      name: caller.name,
      abbreviation: caller.abbreviation,
      languages: caller.languages,
    });
  }

  async deleteCaller(id: number): Promise<void> {
    await db.callers.delete(id);
  }

  async deleteAllCallers(): Promise<void> {
    await db.callers.clear();
  }
}

export const callerRepo = new CallerRepository();