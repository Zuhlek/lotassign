import { db } from "@/lib/db/dexie.db";
import { Auction } from "@/lib/models/auction.model";
import { Lot } from "@/lib/models/lot.model";
import { Caller } from "@/lib/models/caller.model";
import { lotService } from "./lot.service";
import { callerService } from "./caller.service";

export class AuctionService {
  /**
   * Creates a new auction in the database.
   * @param auction The Auction model to create.
   * @returns The ID of the created auction.
   */
  async createAuction(auction: Auction): Promise<number> {
    const auctionData = this.modelToDto(auction);
    const createdId = await db.auctions.add(auctionData);
    auction.id = createdId;

    // Save lots associated with the auction
    if (auction.lots) {
      for (const lot of auction.lots) {
        lot.auctionId = auction.id!;
        await lotService.createLot(lot);
      }
    }

    return createdId ?? -1;
  }

  /**
   * Retrieves all auctions from the database.
   * @returns An array of Auction models with lots and callers.
   */
  async getAllAuctions(): Promise<Auction[]> {
    const auctionDataArray = await db.auctions.toArray();
    const auctions = auctionDataArray.map(data => this.dtoToModel(data));

    // Batch fetch lots and callers
    const auctionIds = auctions.map(a => a.id!).filter(id => id !== undefined);

    // Fetch and attach lots
    const lots = await db.lots.where('auctionId').anyOf(auctionIds).toArray();
    const lotsByAuctionId = new Map<number, Lot[]>();
    for (const lotData of lots) {
      const lot = lotService.dtoToModel(lotData);
      if (!lotsByAuctionId.has(lot.auctionId)) {
        lotsByAuctionId.set(lot.auctionId, []);
      }
      lotsByAuctionId.get(lot.auctionId)!.push(lot);
    }

    // Fetch and attach callers
    const callerIdsSet = new Set<number>();
    for (const auctionData of auctionDataArray) {
      (auctionData.callerIds || []).forEach(id => callerIdsSet.add(id));
    }
    const callerIds = Array.from(callerIdsSet);
    const callersData = await db.callers.where('id').anyOf(callerIds).toArray();
    const callerMap = new Map<number, Caller>();
    for (const callerData of callersData) {
      const caller = callerService.dtoToModel(callerData);
      callerMap.set(caller.id!, caller);
    }

    // Attach lots and callers to auctions
    for (const auction of auctions) {
      auction.lots = lotsByAuctionId.get(auction.id!) || [];
      const callerIds = auctionDataArray.find(a => a.id === auction.id)?.callerIds || [];
      auction.callers = callerIds.map(id => callerMap.get(id)).filter(Boolean) as Caller[];
    }

    return auctions;
  }

  /**
   * Retrieves an auction by ID.
   * @param id The ID of the auction to retrieve.
   * @returns The Auction model with lots and callers, or undefined if not found.
   */
  async getAuctionById(id: number): Promise<Auction | undefined> {
    const auctionData = await db.auctions.get(id);
    if (!auctionData) return undefined;
    const auction = this.dtoToModel(auctionData);

    // Fetch lots for this auction
    const lotsData = await db.lots.where('auctionId').equals(id).toArray();
    const lots = lotsData.map(lotData => lotService.dtoToModel(lotData));
    auction.lots = lots;

    // Fetch and attach callers
    const callerIds = auctionData.callerIds || [];
    const callersData = await db.callers.where('id').anyOf(callerIds).toArray();
    auction.callers = callersData.map(callerData => callerService.dtoToModel(callerData));

    return auction;
  }

  /**
   * Updates an existing auction.
   * @param auction The Auction model with updated data.
   * @returns The number of rows affected or undefined if the ID is missing.
   */
  async updateAuction(auction: Auction): Promise<number | undefined> {
    if (!auction.id) return undefined;
    const auctionData = this.modelToDto(auction);
    const { id, ...updateData } = auctionData;
    const updatedCount = await db.auctions.update(auction.id, updateData);

    // Update lots
    if (auction.lots) {
      for (const lot of auction.lots) {
        if (lot.id) {
          await lotService.updateLot(lot);
        } else {
          lot.auctionId = auction.id;
          await lotService.createLot(lot);
        }
      }
    }

    return updatedCount;
  }

  /**
   * Deletes an auction by ID.
   * @param id The ID of the auction to delete.
   */
  async deleteAuction(id: number): Promise<void> {
    await db.auctions.delete(id);

    // Delete associated lots
    const lotIds = await db.lots.where('auctionId').equals(id).primaryKeys();
    await db.lots.bulkDelete(lotIds);

    // Delete assignments associated with lots
    const assignmentIds = await db.assignments.where('lotId').anyOf(lotIds as number[]).primaryKeys();
    await db.assignments.bulkDelete(assignmentIds);
  }

  /**
   * Converts an Auction model to a database-friendly format.
   * @param auction The Auction model to convert.
   * @returns An object suitable for storage in IndexedDB.
   */
  private modelToDto(auction: Auction): AuctionDTO {
    return {
      id: auction.id,
      name: auction.name,
      date: auction.date.toISOString(),
      callerIds: auction.callers?.map(caller => caller.id!) || [],
    };
  }

  /**
   * Converts a database object to an Auction model.
   * @param data The data retrieved from the database.
   * @returns An Auction model with empty lots and callers (to be populated later).
   */
  public dtoToModel(data: AuctionDTO): Auction {
    return new Auction(
      data.id,
      data.name,
      new Date(data.date),
      [], // lots will be attached later
      []  // callers will be attached later
    );
  }
}

export interface AuctionDTO {
  id?: number;
  name: string;
  date: string;
  callerIds?: number[];
}

export const auctionService = new AuctionService();


