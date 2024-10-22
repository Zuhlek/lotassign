// src/lib/services/lot.service.ts

import { Lot } from "@/lib/models/lot.model";
import { LotDTO } from "@/lib/dto/lot.dto";
import { lotRepo } from "@/lib/repositories/lot.repo";
import { assignmentRepo } from "@/lib/repositories/assignment.repo";
import { Assignment } from "@/lib/models/assignment.model";

class LotService {
  async createLot(lot: Lot): Promise<Lot> {
    try {
      const lotDTO = LotDTO.fromModel(lot);
      const createdId = await lotRepo.createLot(lotDTO);
      lot.id = createdId;
      return lot;
    } catch (error) {
      console.error(`Error creating Lot:`, error);
      throw new Error('Failed to create Lot.');
    }
  }

  async getAllLots(): Promise<Lot[]> {
    try {
      const lotDTOs = await lotRepo.getAllLots();
      const lots: Lot[] = await Promise.all(
        lotDTOs.map(async (lotDTO) => {
          const assignments: Assignment[] = await assignmentRepo.getAssignmentsByIds(lotDTO.assignmentIds);
          return new Lot(
            lotDTO.id,
            lotDTO.auctionId,
            lotDTO.number,
            lotDTO.description,
            assignments
          );
        })
      );
      return lots;
    } catch (error) {
      console.error(`Error fetching all Lots:`, error);
      throw new Error('Failed to fetch Lots.');
    }
  }

  async getLotById(id: number): Promise<Lot | undefined> {
    try {
      const lotDTO = await lotRepo.getLotById(id);
      if (!lotDTO) return undefined;

      const assignments: Assignment[] = await assignmentRepo.getAssignmentsByIds(lotDTO.assignmentIds);
      const lot = new Lot(
        lotDTO.id,
        lotDTO.auctionId,
        lotDTO.number,
        lotDTO.description,
        assignments
      );
      return lot;
    } catch (error) {
      console.error(`Error fetching Lot with ID ${id}:`, error);
      throw new Error('Failed to fetch Lot.');
    }
  }

  async updateLot(id: number, lot: Lot): Promise<number | undefined> {
    try {
      const lotDTO = LotDTO.fromModel(lot);
      const { id: _, ...updateData } = lotDTO;
      const updatedCount = await lotRepo.updateLot(id, updateData);
      return updatedCount;
    } catch (error) {
      console.error(`Error updating Lot with ID ${id}:`, error);
      throw new Error('Failed to update Lot.');
    }
  }

  async deleteLot(id: number): Promise<void> {
    try {
      await lotRepo.deleteLot(id);
    } catch (error) {
      console.error(`Error deleting Lot with ID ${id}:`, error);
      throw new Error('Failed to delete Lot.');
    }
  }

  async getAllLotsByAuctionId(auctionId: number): Promise<Lot[]> {
    try {
      const lotDTOs: LotDTO[] = await db.lots.where('auctionId').equals(auctionId).toArray();
      const lots: Lot[] = await Promise.all(
        lotDTOs.map(async (lotDTO) => {
          const assignments: Assignment[] = await assignmentRepo.getAssignmentsByIds(lotDTO.assignmentIds);
          return new Lot(
            lotDTO.id,
            lotDTO.auctionId,
            lotDTO.number,
            lotDTO.description,
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

  async getNextAndCurrentAndPreviousNLots(
    lotNumber: number,
    range: number,
    auctionId: number
  ): Promise<Lot[]> {
    try {
      const minLotNumber = lotNumber - range;
      const maxLotNumber = lotNumber + range;

      const lotDTOs: LotDTO[] = await db.lots
        .where("number")
        .between(minLotNumber, maxLotNumber, true, true)
        .and((lot) => lot.auctionId === auctionId)
        .toArray();

      const lots: Lot[] = await Promise.all(
        lotDTOs.map(async (lotDTO) => {
          const assignments: Assignment[] = await assignmentRepo.getAssignmentsByIds(lotDTO.assignmentIds);
          return new Lot(
            lotDTO.id,
            lotDTO.auctionId,
            lotDTO.number,
            lotDTO.description,
            assignments
          );
        })
      );

      return lots;
    } catch (error) {
      console.error(`Error fetching Lots around Lot Number ${lotNumber} for Auction ID ${auctionId}:`, error);
      throw new Error('Failed to fetch surrounding Lots.');
    }
  }
}

export const lotService = new LotService();
