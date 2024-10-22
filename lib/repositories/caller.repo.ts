import { db } from "@/lib/db/dexie.db";
import { Caller } from "@/lib/models/caller.model";
import { languagesToLanguageArray, languagesToStringArray } from "@/lib/models/language.model";

class CallerRepo {
  async createCaller(caller: Caller): Promise<number> {
    const callerDTO = CallerDTO.fromModel(caller);
    const createdCallerId = await db.callers.add(callerDTO);
    return createdCallerId ? createdCallerId : -1;
  }

  async getCallers(): Promise<Caller[]> {
    const callerDataArray = await db.callers.toArray();
    return callerDataArray.map((data) => {
      const callerDTO = new CallerDTO(data.id, data.name, data.abbreviation, data.languages);
      return callerDTO.toModel();
    });
  }

  async getCallerById(id: number): Promise<Caller | undefined> {
    const data = await db.callers.get(id);
    if (!data) return;
    const callerDTO = new CallerDTO(data.id, data.name, data.abbreviation, data.languages);
    return callerDTO.toModel();
  }
  
  async updateCaller(caller: Caller): Promise<number | undefined> {
    const callerDTO = CallerDTO.fromModel(caller);
    const updatedCallerId = await db.callers.put(callerDTO);
    return updatedCallerId;
    
  }

  async deleteCaller(id: number): Promise<void> {
    await db.callers.delete(id);
  }

  async deleteAllCallers(): Promise<void> {
    await db.callers.clear();
  }
}

export const callerRepo = new CallerRepo();

export class CallerDTO {
  public id?: number;
  public name: string;
  public abbreviation: string;
  public languages: string[];

  constructor(id: number | undefined, name: string, abbreviation: string, languages: string[]) {
    this.id = id;
    this.name = name;
    this.abbreviation = abbreviation;
    this.languages = languages;
  }

  static fromModel(caller: Caller): CallerDTO {
    return new CallerDTO(caller.id, caller.name, caller.abbreviation, languagesToStringArray(caller.languages));
  }

  toModel(): Caller {
    const languages = languagesToLanguageArray(this.languages);
    return new Caller(this.id, this.name, this.abbreviation, languages);
  }
}
