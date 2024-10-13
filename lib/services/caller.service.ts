import { CallerRepository } from '@/lib/repositories/caller.repo';
import { Caller } from '@/lib/models/caller.model';
import { Language } from '@/lib/models/language.model';

class CallerService {
  private callerRepository: CallerRepository;

  constructor() {
    this.callerRepository = new CallerRepository(); 
  }

  async createCaller(name: string, abbreviation: string, languages: Language[]): Promise<number> {
    const caller = new Caller(undefined, name, abbreviation, languages);
    return await this.callerRepository.createCaller(caller);
  }

  async getAllCallers(): Promise<Caller[]> {
    return await this.callerRepository.getAllCallers();
  }

  async getCallerById(id: number): Promise<Caller | null> {
    return await this.callerRepository.getCallerById(id);
  }

  async updateCaller(id: number, name: string, abbreviation: string, languages: Language[]): Promise<number> {
    const existingCaller = await this.getCallerById(id);
    if (!existingCaller) {
      throw new Error(`Caller with ID ${id} not found.`);
    }

    existingCaller.name = name;
    existingCaller.abbreviation = abbreviation;
    existingCaller.languages = languages;
    
    return await this.callerRepository.updateCaller(id, existingCaller);
  }

  async deleteCaller(id: number): Promise<void> {
    await this.callerRepository.deleteCaller(id);
  }

  async deleteAllCallers(): Promise<void> {
    await this.callerRepository.deleteAllCallers();
  }
}

export const callerService = new CallerService();
