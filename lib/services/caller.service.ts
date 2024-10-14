import { callerRepo } from '@/lib/repositories/caller.repo';
import { Caller } from '@/lib/models/caller.model';
import { Language } from '@/lib/models/language.model';

class CallerService {

  async createCaller(name: string, abbreviation: string, languages: Language[]): Promise<number> {
    const caller = new Caller(undefined, name, abbreviation, languages);
    return await callerRepo.createCaller(caller);
  }

  async getAllCallers(): Promise<Caller[]> {
    return await callerRepo.getCallers();
  }

  async getCallerById(id: number): Promise<Caller | null> {
    return await callerRepo.getCallerById(id);
  }

  async updateCaller(id: number, name: string, abbreviation: string, languages: Language[]): Promise<number> {
    const existingCaller = await this.getCallerById(id);
    if (!existingCaller) {
      throw new Error(`Caller with ID ${id} not found.`);
    }

    existingCaller.name = name;
    existingCaller.abbreviation = abbreviation;
    existingCaller.languages = languages;
    
    return await callerRepo.updateCaller(id, existingCaller);
  }

  async deleteCaller(id: number): Promise<void> {
    await callerRepo.deleteCaller(id);
  }

  async deleteAllCallers(): Promise<void> {
    await callerRepo.deleteAllCallers();
  }
}

export const callerService = new CallerService();
