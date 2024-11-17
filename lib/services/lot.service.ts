import { db } from "@/lib/db/dexie.db";
import { Lot } from "@/lib/models/lot.model";
import { Assignment } from "@/lib/models/assignment.model";
import { assignmentService } from "./assignment.service";
import { Bidder } from "@/lib/models/bidder.model";
import { Caller } from "@/lib/models/caller.model";
import { bidderService } from "./bidder.service";
import { callerService } from "./caller.service";

export class LotService {
  /**
   * Creates a new lot in the database.
   * @param lot The Lot model to create.
   * @returns The created Lot with assigned ID.
   */
  async createLot(lot: Lot): Promise<Lot> {
    const lotData = this.modelToDto(lot);
    const createdId = await db.lots.add(lotData);
    lot.id = createdId;
    if (lot.assignments) {
      for (const assignment of lot.assignments) {
        assignment.lot.id = lot.id;
        await assignmentService.createAssignment(assignment);
      }
    }
    return lot;
  }

  /**
   * Retrieves all lots from the database.
   * @returns An array of Lot models with assignments.
   */
  async getAllLots(): Promise<Lot[]> {
    const lotObjects = await db.lots.toArray();
    const lots = lotObjects.map(obj => this.dtoToModel(obj));

    // Batch fetch assignments
    const lotIds = lots.map(lot => lot.id!).filter(id => id !== undefined);
    const assignmentsData = await db.assignments.where('lotId').anyOf(lotIds).toArray();

    // Build a map of lotId to assignments
    const assignmentsByLotId = new Map<number, Assignment[]>();
    for (const assignmentData of assignmentsData) {
      const assignment = assignmentService.dtoToModel(assignmentData);
      if (!assignmentsByLotId.has(assignment.lot.id!) && assignment.lot.id) {
        assignmentsByLotId.set(assignment.lot.id, []);
      }
      if (assignment.lot.id) {
        assignmentsByLotId.get(assignment.lot.id)!.push(assignment);
      }
    }

    // Attach assignments to lots
    for (const lot of lots) {
      lot.assignments = assignmentsByLotId.get(lot.id!) || [];
    }

    // Batch fetch bidders and callers for assignments
    await this.populateAssignmentsWithBiddersAndCallers(lots);

    return lots;
  }

  /**
   * Retrieves a lot by ID.
   * @param id The ID of the lot to retrieve.
   * @returns The Lot model with assignments, or undefined if not found.
   */
  async getLotById(id: number): Promise<Lot | undefined> {
    const lotData = await db.lots.get(id);
    if (!lotData) return undefined;
    const lot = this.dtoToModel(lotData);

    const assignmentsData = await db.assignments.where('lotId').equals(id).toArray();
    const assignments = assignmentsData.map(a => assignmentService.dtoToModel(a));
    lot.assignments = assignments;

    // Populate assignments with bidders and callers
    await this.populateAssignmentsWithBiddersAndCallers([lot]);

    return lot;
  }

  /**
   * Updates an existing lot.
   * @param lot The Lot model with updated data.
   * @returns The number of rows affected or undefined if the ID is missing.
   */
  async updateLot(lot: Lot): Promise<number | undefined> {
    if (!lot.id) return undefined;
    const lotData = this.modelToDto(lot);
    const { id, ...updateData } = lotData;
    const updatedCount = await db.lots.update(lot.id, updateData);

    if (lot.assignments) {
      for (const assignment of lot.assignments) {
        if (assignment.id) {
          await assignmentService.updateAssignment(assignment);
        } else {
          assignment.lot.id = lot.id;
          await assignmentService.createAssignment(assignment);
        }
      }
    }

    return updatedCount;
  }

  /**
   * Deletes a lot by ID.
   * @param id The ID of the lot to delete.
   */
  async deleteLot(id: number): Promise<void> {
    await db.lots.delete(id);
    // Delete related assignments
    const assignmentIds = await db.assignments.where('lotId').equals(id).primaryKeys();
    await db.assignments.bulkDelete(assignmentIds);
  }

  /**
   * Retrieves all lots by auction ID.
   * @param auctionId The auction ID to filter lots.
   * @returns An array of Lot models.
   */
  async getAllLotsByAuctionId(auctionId: number): Promise<Lot[]> {
    const lotObjects = await db.lots.where('auctionId').equals(auctionId).toArray();
    const lots = lotObjects.map(obj => this.dtoToModel(obj));

    // Fetch and attach assignments
    const lotIds = lots.map(lot => lot.id!).filter(id => id !== undefined);
    const assignmentsData = await db.assignments.where('lotId').anyOf(lotIds).toArray();

    // Build a map of lotId to assignments
    const assignmentsByLotId = new Map<number, Assignment[]>();
    for (const assignmentData of assignmentsData) {
      const assignment = assignmentService.dtoToModel(assignmentData);
      if (!assignmentsByLotId.has(assignment.lot.id!) && assignment.lot.id) {
        assignmentsByLotId.set(assignment.lot.id, []);
      }
      if (assignment.lot.id) {
        assignmentsByLotId.get(assignment.lot.id)!.push(assignment);
      }
    }

    // Attach assignments to lots
    for (const lot of lots) {
      lot.assignments = assignmentsByLotId.get(lot.id!) || [];
    }

    // Populate assignments with bidders and callers
    await this.populateAssignmentsWithBiddersAndCallers(lots);

    return lots;
  }

  /**
   * Populates assignments with their respective bidders and callers.
   * @param lots Array of lots whose assignments need to be populated.
   */
  private async populateAssignmentsWithBiddersAndCallers(lots: Lot[]): Promise<void> {
    const bidderIds = new Set<number>();
    const callerIds = new Set<number>();

    // Collect bidder and caller IDs from assignments
    for (const lot of lots) {
      for (const assignment of lot.assignments || []) {
        bidderIds.add(assignment.bidder.id!);
        if (assignment.caller?.id) callerIds.add(assignment.caller?.id);
      }
    }

    // Batch fetch bidders and callers
    const bidders = await db.bidders.where('id').anyOf([...bidderIds]).toArray();
    const callers = await db.callers.where('id').anyOf([...callerIds]).toArray();

    const bidderMap = new Map<number, Bidder>();
    const callerMap = new Map<number, Caller>();

    for (const bidderData of bidders) {
      const bidder = bidderService.dtoToModel(bidderData);
      bidderMap.set(bidder.id!, bidder);
    }

    for (const callerData of callers) {
      const caller = callerService.dtoToModel(callerData);
      callerMap.set(caller.id!, caller);
    }

    // Attach bidders and callers to assignments
    for (const lot of lots) {
      for (const assignment of lot.assignments || []) {
        const bidder = bidderMap.get(assignment.bidder.id!);
        const caller = assignment.caller?.id ? callerMap.get(assignment.caller.id) : undefined;
        if (!bidder) throw new Error(`Bidder with ID ${assignment.bidder.id} not found`);
        assignment.bidder = bidder;
        assignment.caller = caller;
      }
    }
  }

  /**
   * Converts a Lot model to a database-friendly format.
   * @param lot The Lot model to convert.
   * @returns An object suitable for storage in IndexedDB.
   */
  private modelToDto(lot: Lot): LotDTO {
    return {
      id: lot.id,
      auctionId: lot.auctionId,
      number: lot.number,
      description: lot.description,
    };
  }

  /**
   * Converts a database object to a Lot model.
   * @param data The data retrieved from the database.
   * @returns A Lot model.
   */
  public dtoToModel(data: LotDTO): Lot {
    return new Lot(
      data.id,
      data.auctionId,
      data.number,
      data.description,
      [] // assignments will be attached later
    );
  }
}

export interface LotDTO {
  id?: number;
  auctionId: number;
  number: number;
  description: string;
}

export const lotService = new LotService();


