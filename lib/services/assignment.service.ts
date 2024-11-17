import { db } from "@/lib/db/dexie.db";
import { Assignment } from "@/lib/models/assignment.model";
import { Bidder } from "@/lib/models/bidder.model";
import { Caller } from "@/lib/models/caller.model";
import { Lot } from "@/lib/models/lot.model";
import { bidderService } from "./bidder.service";
import { callerService } from "./caller.service";
import { lotService } from "./lot.service";

export class AssignmentService {
  /**
   * Creates a new assignment in the database.
   * @param assignment The Assignment model to create.
   * @returns The ID of the created assignment.
   */
  async createAssignment(assignment: Assignment): Promise<number> {
    const assignmentData = this.modelToDto(assignment);
    const createdId = await db.assignments.add(assignmentData);
    return createdId ?? -1;
  }

  /**
   * Retrieves all assignments from the database.
   * @returns An array of Assignment models with related entities populated.
   */
  async getAllAssignments(): Promise<Assignment[]> {
    const assignmentDataArray = await db.assignments.toArray();
    const assignments = assignmentDataArray.map(data => this.dtoToModel(data));

    // Batch fetch related entities
    await this.populateAssignmentsWithRelatedEntities(assignments);

    return assignments;
  }

  /**
   * Retrieves an assignment by ID.
   * @param id The ID of the assignment to retrieve.
   * @returns The Assignment model with related entities, or undefined if not found.
   */
  async getAssignmentById(id: number): Promise<Assignment | undefined> {
    const data = await db.assignments.get(id);
    if (!data) return undefined;
    const assignment = this.dtoToModel(data);

    // Populate related entities
    await this.populateAssignmentsWithRelatedEntities([assignment]);

    return assignment;
  }

  /**
   * Updates an existing assignment.
   * @param assignment The Assignment model with updated data.
   * @returns The number of rows affected or undefined if the ID is missing.
   */
  async updateAssignment(assignment: Assignment): Promise<number | undefined> {
    if (!assignment.id) return undefined;
    const assignmentData = this.modelToDto(assignment);
    const { id, ...updateData } = assignmentData;
    return await db.assignments.update(assignment.id, updateData);
  }

  /**
   * Deletes an assignment by ID.
   * @param id The ID of the assignment to delete.
   */
  async deleteAssignment(id: number): Promise<void> {
    await db.assignments.delete(id);
  }

  /**
   * Removes all caller IDs from assignments associated with a specific auction.
   * @param auctionId The ID of the auction.
   */
  async removeAllCallerIdsFromAssignments(auctionId: number): Promise<void> {
    const lotIds = await db.lots.where('auctionId').equals(auctionId).primaryKeys();
    await db.assignments.where('lotId').anyOf(lotIds as number[]).modify({ callerId: undefined });
  }

  /**
   * Retrieves assignments by lot ID.
   * @param lotId The ID of the lot.
   * @returns An array of Assignment models.
   */
  async getAssignmentsByLotId(lotId: number): Promise<Assignment[]> {
    const assignmentDataArray = await db.assignments.where('lotId').equals(lotId).toArray();
    const assignments = assignmentDataArray.map(data => this.dtoToModel(data));

    // Populate related entities
    await this.populateAssignmentsWithRelatedEntities(assignments);

    return assignments;
  }

  /**
   * Retrieves assignments with no caller by auction ID.
   * @param auctionId The ID of the auction.
   * @returns An array of Assignment models.
   */
  async getAssignmentsWithNoCallerByAuctionId(auctionId: number): Promise<Assignment[]> {
    const lotIds = await db.lots.where('auctionId').equals(auctionId).primaryKeys();
    const assignmentDataArray = await db.assignments
      .where('lotId')
      .anyOf(lotIds as number[])
      .and(assignment => !assignment.callerId)
      .toArray();
    const assignments = assignmentDataArray.map(data => this.dtoToModel(data));

    // Populate related entities
    await this.populateAssignmentsWithRelatedEntities(assignments);

    return assignments;
  }

  /**
   * Retrieves assignments by auction ID.
   * @param auctionId The ID of the auction.
   * @returns An array of Assignment models.
   */
  async getAssignmentsByAuctionId(auctionId: number): Promise<Assignment[]> {
    const lotIds = await db.lots.where('auctionId').equals(auctionId).primaryKeys();
    const assignmentDataArray = await db.assignments.where('lotId').anyOf(lotIds as number[]).toArray();
    const assignments = assignmentDataArray.map(data => this.dtoToModel(data));

    // Populate related entities
    await this.populateAssignmentsWithRelatedEntities(assignments);

    return assignments;
  }

  /**
   * Converts an Assignment model to a database-friendly format.
   * @param assignment The Assignment model to convert.
   * @returns An object suitable for storage in IndexedDB.
   */
  private modelToDto(assignment: Assignment): AssignmentDTO {
    return {
      id: assignment.id,
      lotId: assignment.lot.id!,
      bidderId: assignment.bidder.id!,
      callerId: assignment.caller?.id,
      isFinal: assignment.isFinal,
    };
  }

  /**
   * Converts a database object to an Assignment model.
   * @param data The data retrieved from the database.
   * @returns An Assignment model with placeholders for related entities.
   */
  public dtoToModel(data: AssignmentDTO): Assignment {
    // Create placeholders for related entities
    const lot = new Lot(data.lotId, 0, 0, "", []);
    const bidder = new Bidder(data.bidderId, "", [], "");
    const caller = data.callerId ? new Caller(data.callerId, "", "", []) : undefined;

    return new Assignment(
      data.id,
      caller,
      lot,
      bidder,
      data.isFinal
    );
  }

  /**
   * Populates assignments with their related lots, bidders, and callers.
   * @param assignments The array of assignments to populate.
   */
  private async populateAssignmentsWithRelatedEntities(assignments: Assignment[]): Promise<void> {
    const lotIds = new Set<number>();
    const bidderIds = new Set<number>();
    const callerIds = new Set<number>();

    for (const assignment of assignments) {
      lotIds.add(assignment.lot.id!);
      bidderIds.add(assignment.bidder.id!);
      if (assignment.caller?.id) callerIds.add(assignment.caller.id);
    }

    // Batch fetch lots
    const lotsData = await db.lots.where('id').anyOf(Array.from(lotIds)).toArray();
    const lotsMap = new Map<number, Lot>();
    for (const lotData of lotsData) {
      const lot = lotService.dtoToModel(lotData);
      lotsMap.set(lot.id!, lot);
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

    // Attach related entities to assignments
    for (const assignment of assignments) {
      assignment.lot = lotsMap.get(assignment.lot.id!)!;
      assignment.bidder = biddersMap.get(assignment.bidder.id!)!;
      if (assignment.caller?.id) {
        assignment.caller = callersMap.get(assignment.caller.id);
      }
    }
  }
}

export interface AssignmentDTO {
  id?: number;
  lotId: number;
  bidderId: number;
  callerId?: number;
  isFinal: boolean;
}

export const assignmentService = new AssignmentService();


