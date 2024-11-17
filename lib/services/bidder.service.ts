import { db } from "@/lib/db/dexie.db";
import { Bidder } from "@/lib/models/bidder.model";
import { languagesToLanguageArray, languagesToStringArray } from "@/lib/models/language.model";

export class BidderService {
  /**
   * Creates a new bidder in the database.
   * @param bidder The Bidder model to create.
   * @returns The ID of the created bidder.
   */
  async createBidder(bidder: Bidder): Promise<number> {
    const bidderData = this.modelToDto(bidder);
    const createdId = await db.bidders.add(bidderData);
    return createdId ?? -1;
  }

  /**
   * Retrieves all bidders from the database.
   * @returns An array of Bidder models.
   */
  async getAllBidders(): Promise<Bidder[]> {
    const bidderObjects = await db.bidders.toArray();
    return bidderObjects.map(obj => this.dtoToModel(obj));
  }

  /**
   * Retrieves a bidder by ID.
   * @param id The ID of the bidder to retrieve.
   * @returns The Bidder model or undefined if not found.
   */
  async getBidderById(id: number): Promise<Bidder | undefined> {
    const bidderData = await db.bidders.get(id);
    if (!bidderData) return undefined;
    return this.dtoToModel(bidderData);
  }

  /**
   * Updates an existing bidder.
   * @param bidder The Bidder model with updated data.
   * @returns The number of rows affected or undefined if the ID is missing.
   */
  async updateBidder(bidder: Bidder): Promise<number | undefined> {
    if (!bidder.id) return undefined;
    const bidderData = this.modelToDto(bidder);
    const { id, ...updateData } = bidderData;
    return await db.bidders.update(bidder.id, updateData);
  }

  /**
   * Deletes a bidder by ID.
   * @param id The ID of the bidder to delete.
   */
  async deleteBidder(id: number): Promise<void> {
    await db.bidders.delete(id);
  }

  /**
   * Converts a Bidder model to a database-friendly format.
   * @param bidder The Bidder model to convert.
   * @returns An object suitable for storage in IndexedDB.
   */
  private modelToDto(bidder: Bidder): BidderDTO {
    return {
      id: bidder.id,
      name: bidder.name,
      languages: languagesToStringArray(bidder.languages),
      phoneNumber: bidder.phoneNumber,
    };
  }

  /**
   * Converts a database object to a Bidder model.
   * @param data The data retrieved from the database.
   * @returns A Bidder model.
   */
  public dtoToModel(data: BidderDTO): Bidder {
    return new Bidder(
      data.id,
      data.name,
      languagesToLanguageArray(data.languages || []),
      data.phoneNumber
    );
  }
}

export interface BidderDTO {
  id?: number;
  name: string;
  languages: string[];
  phoneNumber: string;
}

export const bidderService = new BidderService();
