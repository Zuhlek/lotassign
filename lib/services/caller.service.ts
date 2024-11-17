import { db } from "@/lib/db/dexie.db";
import { Caller } from "@/lib/models/caller.model";
import { languagesToLanguageArray, languagesToStringArray } from "@/lib/models/language.model";

export class CallerService {
  /**
   * Creates a new caller in the database.
   * @param caller The Caller model to create.
   * @returns The ID of the created caller.
   */
  async createCaller(caller: Caller): Promise<number> {
    const callerData = this.modelToDto(caller);
    const createdId = await db.callers.add(callerData);
    return createdId ?? -1;
  }

  /**
   * Retrieves all callers from the database.
   * @returns An array of Caller models.
   */
  async getAllCallers(): Promise<Caller[]> {
    const callerObjects = await db.callers.toArray();
    return callerObjects.map(obj => this.dtoToModel(obj));
  }

  /**
   * Retrieves a caller by ID.
   * @param id The ID of the caller to retrieve.
   * @returns The Caller model or undefined if not found.
   */
  async getCallerById(id: number): Promise<Caller | undefined> {
    const callerData = await db.callers.get(id);
    if (!callerData) return undefined;
    return this.dtoToModel(callerData);
  }

  /**
   * Updates an existing caller.
   * @param caller The Caller model with updated data.
   * @returns The number of rows affected or undefined if the ID is missing.
   */
  async updateCaller(caller: Caller): Promise<number | undefined> {
    if (!caller.id) return undefined;
    const callerData = this.modelToDto(caller);
    const { id, ...updateData } = callerData;
    return await db.callers.update(caller.id, updateData);
  }

  /**
   * Deletes a caller by ID.
   * @param id The ID of the caller to delete.
   */
  async deleteCaller(id: number): Promise<void> {
    await db.callers.delete(id);
  }

  /**
   * Converts a Caller model to a database-friendly format.
   * @param caller The Caller model to convert.
   * @returns An object suitable for storage in IndexedDB.
   */
  private modelToDto(caller: Caller): CallerDTO {
    return {
      id: caller.id,
      name: caller.name,
      abbreviation: caller.abbreviation,
      languages: languagesToStringArray(caller.languages),
    };
  }

  /**
   * Converts a database object to a Caller model.
   * @param data The data retrieved from the database.
   * @returns A Caller model.
   */
  public dtoToModel(data: CallerDTO): Caller {
    return new Caller(
      data.id,
      data.name,
      data.abbreviation,
      languagesToLanguageArray(data.languages || [])
    );
  }
}

export interface CallerDTO {
  id?: number;
  name: string;
  abbreviation: string;
  languages: string[];
}

export const callerService = new CallerService();
