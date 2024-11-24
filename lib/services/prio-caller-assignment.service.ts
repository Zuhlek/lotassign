import { db } from "@/lib/db/dexie.db";
import { PrioCallerAssignment } from "@/lib/models/prioCallerAssignment.model";
import { Auction } from "@/lib/models/auction.model";
import { Bidder } from "@/lib/models/bidder.model";
import { Caller } from "@/lib/models/caller.model";
import { auctionService } from "./auction.service";
import { bidderService } from "./bidder.service";
import { callerService } from "./caller.service";

class PrioCallerAssignmentService {
  /**
   * Creates a new priority caller assignment in the database.
   * @param prioAssignment The PrioCallerAssignment model to create.
   * @returns The ID of the created assignment.
   */
  async createPrioCallerAssignment(auctionId: number, bidderId: number, callerId: number): Promise<number> {
    const auction = await auctionService.getAuctionById(auctionId);
    const bidder = await bidderService.getBidderById(bidderId);
    const caller = await callerService.getCallerById(callerId);

    const prioAssignment = new PrioCallerAssignment(undefined, auction!, bidder!, caller!);
    const prioAssignmentData = this.prioAssignmentToDBData(prioAssignment);
    const createdId = await db.prioCallerAssignments.add(prioAssignmentData);
    return createdId ?? -1;
  }

  /**
   * Retrieves all priority caller assignments from the database.
   * @returns An array of PrioCallerAssignment models with related entities populated.
   */
  async getAllPrioCallerAssignments(): Promise<PrioCallerAssignment[]> {
    const prioAssignmentDataArray = await db.prioCallerAssignments.toArray();
    const prioAssignments = prioAssignmentDataArray.map(data => this.dbDataToPrioAssignment(data));

    // Batch fetch related entities
    await this.populatePrioAssignmentsWithRelatedEntities(prioAssignments);

    return prioAssignments;
  }

  /**
   * Retrieves a priority caller assignment by ID.
   * @param id The ID of the assignment to retrieve.
   * @returns The PrioCallerAssignment model with related entities, or undefined if not found.
   */
  async getPrioCallerAssignmentById(id: number): Promise<PrioCallerAssignment | undefined> {
    const data = await db.prioCallerAssignments.get(id);
    if (!data) return undefined;
    const prioAssignment = this.dbDataToPrioAssignment(data);

    // Populate related entities
    await this.populatePrioAssignmentsWithRelatedEntities([prioAssignment]);

    return prioAssignment;
  }

  /**
   * Retrieves priority caller assignments by auction ID.
   * @param auctionId The ID of the auction.
   * @returns An array of PrioCallerAssignment models.
   */
  async getPrioCallerAssignmentsByAuctionId(auctionId: number): Promise<PrioCallerAssignment[]> {
    const prioAssignmentDataArray = await db.prioCallerAssignments.where('auctionId').equals(auctionId).toArray();
    const prioAssignments = prioAssignmentDataArray.map(data => this.dbDataToPrioAssignment(data));

    // Populate related entities
    await this.populatePrioAssignmentsWithRelatedEntities(prioAssignments);

    return prioAssignments;
  }

  /**
   * Updates an existing priority caller assignment.
   * @param prioAssignment The PrioCallerAssignment model with updated data.
   * @returns The number of rows affected or undefined if the ID is missing.
   */
  async updatePrioCallerAssignment(prioAssignment: PrioCallerAssignment): Promise<number | undefined> {
    if (!prioAssignment.id) return undefined;
    const prioAssignmentData = this.prioAssignmentToDBData(prioAssignment);
    const { id, ...updateData } = prioAssignmentData;
    return await db.prioCallerAssignments.update(prioAssignment.id, updateData);
  }

  /**
   * Deletes a priority caller assignment by ID.
   * @param id The ID of the assignment to delete.
   */
  async deletePrioCallerAssignment(id: number): Promise<void> {
    await db.prioCallerAssignments.delete(id);
  }

  /**
   * Converts a PrioCallerAssignment model to a database-friendly format.
   * @param prioAssignment The PrioCallerAssignment model to convert.
   * @returns An object suitable for storage in IndexedDB.
   */
  private prioAssignmentToDBData(prioAssignment: PrioCallerAssignment): PrioCallerAssignmentDTO {
    return {
      id: prioAssignment.id,
      auctionId: prioAssignment.auction.id!,
      bidderId: prioAssignment.bidder.id!,
      callerId: prioAssignment.caller.id!,
    };
  }

  /**
   * Converts a database object to a PrioCallerAssignment model.
   * @param data The data retrieved from the database.
   * @returns A PrioCallerAssignment model with placeholders for related entities.
   */
  private dbDataToPrioAssignment(data: PrioCallerAssignmentDTO): PrioCallerAssignment {
    // Create placeholders for related entities
    const auction = new Auction(data.auctionId, "", new Date());
    const bidder = new Bidder(data.bidderId, "", [], "");
    const caller = new Caller(data.callerId, "", "", []);

    return new PrioCallerAssignment(
      data.id,
      auction,
      bidder,
      caller
    );
  }

  /**
   * Populates priority caller assignments with their related auctions, bidders, and callers.
   * @param prioAssignments The array of priority caller assignments to populate.
   */
  private async populatePrioAssignmentsWithRelatedEntities(prioAssignments: PrioCallerAssignment[]): Promise<void> {
    const auctionIds = new Set<number>();
    const bidderIds = new Set<number>();
    const callerIds = new Set<number>();

    for (const prioAssignment of prioAssignments) {
      auctionIds.add(prioAssignment.auction.id!);
      bidderIds.add(prioAssignment.bidder.id!);
      callerIds.add(prioAssignment.caller.id!);
    }

    // Batch fetch auctions
    const auctionsData = await db.auctions.where('id').anyOf(Array.from(auctionIds)).toArray();
    const auctionsMap = new Map<number, Auction>();
    for (const auctionData of auctionsData) {
      const auction = auctionService.dtoToModel(auctionData);
      auctionsMap.set(auction.id!, auction);
    }

    // Batch fetch bidders
    const biddersData = await db.bidders.where('id').anyOf(Array.from(bidderIds)).toArray();
    const biddersMap = new Map<number, Bidder>();
    for (const bidderData of biddersData) {
      const bidder = bidderService.dtoToModel(bidderData);
      biddersMap.set(bidder.id!, bidder);
    }

    // Batch fetch callers
    const callersData = await db.callers.where('id').anyOf(Array.from(callerIds)).toArray();
    const callersMap = new Map<number, Caller>();
    for (const callerData of callersData) {
      const caller = callerService.dtoToModel(callerData);
      callersMap.set(caller.id!, caller);
    }

    // Attach related entities to priority assignments
    for (const prioAssignment of prioAssignments) {
      prioAssignment.auction = auctionsMap.get(prioAssignment.auction.id!)!;
      prioAssignment.bidder = biddersMap.get(prioAssignment.bidder.id!)!;
      prioAssignment.caller = callersMap.get(prioAssignment.caller.id!)!;
    }
  }
}

export interface PrioCallerAssignmentDTO {
  id?: number;
  auctionId: number;
  bidderId: number;
  callerId: number;
}

export const prioCallerAssignmentService = new PrioCallerAssignmentService();


