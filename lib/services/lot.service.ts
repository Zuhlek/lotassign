import { Lot } from "@/lib/models/lot.model";
import { LotDTO } from "@/lib/dto/lot.dto";
import { lotRepo } from "@/lib/repositories/lot.repo";
import { assignmentRepo } from "@/lib/repositories/assignment.repo";
import { Assignment } from "@/lib/models/assignment.model";
import { db } from "@/lib/db/dexie.db";

/**
 * Service for managing Lot-related business logic.
 */
class LotService {
  /**
   * Creates a new Lot.
   * @param lot The Lot model to create.
   * @returns The created Lot with its assigned ID.
   */
  async createLot(lot: Lot): Promise<Lot> {
    try {
      // Convert Lot model to LotDTO
      const lotDTO = LotDTO.fromModel(lot);

      // Persist DTO to the database
      const createdId = await lotRepo.createLot(lotDTO);
      lot.id = createdId;

      return lot;
    } catch (error) {
      console.error('Error creating Lot:', error);
      throw new Error('Failed to create Lot.');
    }
  }

  /**
   * Retrieves all Lots with their associated Assignments.
   * @returns An array of Lots.
   */
  async getAllLots(): Promise<Lot[]> {
    try {
      // Fetch all LotDTOs from the repository
      const lotDTOs = await lotRepo.getAllLots();

      // Convert each LotDTO to a Lot model with Assignments
      const lots: Lot[] = await Promise.all(
        lotDTOs.map(async (lotDTO) => {
          // Fetch Assignments based on assignmentIds
          const assignments: Assignment[] = await assignmentRepo.getAssignmentsByIds(lotDTO.assignmentIds);

          // Assemble the Lot model
          return new Lot(
            lotDTO.id,
            lotDTO.auctionId,
            lotDTO.number,
            lotDTO.description!,
            assignments
          );
        })
      );

      return lots;
    } catch (error) {
      console.error('Error fetching all Lots:', error);
      throw new Error('Failed to fetch Lots.');
    }
  }

  /**
   * Retrieves a Lot by its ID with its associated Assignments.
   * @param id The ID of the Lot to retrieve.
   * @returns The Lot model or undefined if not found.
   */
  async getLotById(id: number): Promise<Lot | undefined> {
    try {
      // Fetch LotDTO from the repository
      const lotDTO = await lotRepo.getLotById(id);
      if (!lotDTO) return undefined;

      // Fetch Assignments based on assignmentIds
      const assignments: Assignment[] = await assignmentRepo.getAssignmentsByIds(lotDTO.assignmentIds);

      // Assemble the Lot model
      const lot = new Lot(
        lotDTO.id,
        lotDTO.auctionId,
        lotDTO.number,
        lotDTO.description!,
        assignments
      );

      return lot;
    } catch (error) {
      console.error(`Error fetching Lot with ID ${id}:`, error);
      throw new Error('Failed to fetch Lot.');
    }
  }

  /**
   * Updates an existing Lot.
   * @param id The ID of the Lot to update.
   * @param lot The updated Lot model.
   * @returns The updated Lot model.
   */
  async updateLot(id: number, lot: Lot): Promise<Lot> {
    try {
      // Convert Lot model to LotDTO
      const lotDTO = LotDTO.fromModel(lot);

      // Prepare update data by excluding 'id'
      const { id: _, ...updateData } = lotDTO;

      // Update the Lot in the repository
      await lotRepo.updateLot(id, updateData);

      // Retrieve and return the updated Lot
      return await this.getLotById(id) as Lot;
    } catch (error) {
      console.error(`Error updating Lot with ID ${id}:`, error);
      throw new Error('Failed to update Lot.');
    }
  }

  /**
   * Deletes a Lot by its ID.
   * @param id The ID of the Lot to delete.
   */
  async deleteLot(id: number): Promise<void> {
    try {
      await lotRepo.deleteLot(id);
    } catch (error) {
      console.error(`Error deleting Lot with ID ${id}:`, error);
      throw new Error('Failed to delete Lot.');
    }
  }

  /**
   * Retrieves all Lots associated with a specific Auction ID.
   * @param auctionId The Auction ID to filter Lots.
   * @returns An array of Lots.
   */
  async getAllLotsByAuctionId(auctionId: number): Promise<Lot[]> {
    try {
      // Fetch LotDTOs by Auction ID from the repository
      const lotDTOs: LotDTO[] = await db.lots.where('auctionId').equals(auctionId).toArray();

      // Convert each LotDTO to a Lot model with Assignments
      const lots: Lot[] = await Promise.all(
        lotDTOs.map(async (lotDTO) => {
          // Fetch Assignments based on assignmentIds
          const assignments: Assignment[] = await assignmentRepo.getAssignmentsByIds(lotDTO.assignmentIds);

          // Assemble the Lot model
          return new Lot(
            lotDTO.id,
            lotDTO.auctionId,
            lotDTO.number,
            lotDTO.description!,
            assignments
          );
        })
      );

      return lots;
    } catch (error) {
      console.error(`Error fetching Lots by Auction ID ${auctionId}:`, error);
      throw new Error('Failed to fetch Lots by Auction ID.');
    }
  }

  /**
   * Retrieves Lots within a range around a specific Lot number for a given Auction.
   * @param lotNumber The reference Lot number.
   * @param range The range to include before and after the reference Lot number.
   * @param auctionId The Auction ID to filter Lots.
   * @returns An array of Lots.
   */
  async getNextAndCurrentAndPreviousNLots(
    lotNumber: number,
    range: number,
    auctionId: number
  ): Promise<Lot[]> {
    try {
      const minLotNumber = lotNumber - range;
      const maxLotNumber = lotNumber + range;

      // Fetch LotDTOs within the specified range and Auction ID
      const lotDTOs: LotDTO[] = await db.lots
        .where("number")
        .between(minLotNumber, maxLotNumber, true, true)
        .and((lot) => lot.auctionId === auctionId)
        .toArray();

      // Convert each LotDTO to a Lot model with Assignments
      const lots: Lot[] = await Promise.all(
        lotDTOs.map(async (lotDTO) => {
          // Fetch Assignments based on assignmentIds
          const assignments: Assignment[] = await assignmentRepo.getAssignmentsByIds(lotDTO.assignmentIds);

          // Assemble the Lot model
          return new Lot(
            lotDTO.id,
            lotDTO.auctionId,
            lotDTO.number,
            lotDTO.description!,
            assignments
          );
        })
      );

      return lots;
    } catch (error) {
      console.error(`Error fetching surrounding Lots around Lot Number ${lotNumber} for Auction ID ${auctionId}:`, error);
      throw new Error('Failed to fetch surrounding Lots.');
    }
  }
}

export const lotService = new LotService();
