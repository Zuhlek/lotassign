// src/lib/repositories/assignment.repo.ts

import { db } from "@/lib/db/dexie.db";
import { Assignment } from "@/lib/models/assignment.model";
import { Caller } from "@/lib/models/caller.model";
import { Lot } from "@/lib/models/lot.model";
import { Bidder } from "@/lib/models/bidder.model";
import { callerRepo } from "@/lib/repositories/caller.repo";
import { lotRepo } from "@/lib/repositories/lot.repo";
import { bidderRepo } from "@/lib/repositories/bidder.repo";

class AssignmentRepository {
  async getAssignmentsByIds(ids: number[]): Promise<Assignment[]> {
    const assignmentDataArray = await db.assignments.where('id').anyOf(ids).toArray();
    return Promise.all(
      assignmentDataArray.map((data) => {
        const assignmentDTO = AssignmentDTO.fromData(data);
        return assignmentDTO.toModel();
      })
    );
  }

  async createAssignment(assignment: Assignment): Promise<number> {
    const assignmentDTO = AssignmentDTO.fromModel(assignment);
    const createdId = await db.assignments.add(assignmentDTO);
    return createdId ? createdId : -1;
  }

  async updateAssignment(assignment: Assignment): Promise<number | undefined> {
    const assignmentDTO = AssignmentDTO.fromModel(assignment);
    const updatedCount = await db.assignments.put(assignmentDTO);
    return updatedCount;
  }

  async deleteAssignment(id: number): Promise<void> {
    await db.assignments.delete(id);
  }

  async getAllAssignments(): Promise<Assignment[]> {
    const assignmentDataArray = await db.assignments.toArray();
    return Promise.all(
      assignmentDataArray.map((data) => {
        const assignmentDTO = AssignmentDTO.fromData(data);
        return assignmentDTO.toModel();
      })
    );
  }
}

export const assignmentRepo = new AssignmentRepository();

export class AssignmentDTO {
  public id?: number;
  public callerId?: number;
  public lotId: number;
  public bidderId: number;
  public isFinal: boolean;

  private constructor(
    id: number | undefined,
    callerId: number | undefined,
    lotId: number,
    bidderId: number,
    isFinal: boolean
  ) {
    this.id = id;
    this.callerId = callerId;
    this.lotId = lotId;
    this.bidderId = bidderId;
    this.isFinal = isFinal;
  }

  static fromModel(assignment: Assignment): AssignmentDTO {
    if (!assignment.lot.id || !assignment.bidder.id) {
      throw new Error('Lot or Bidder not found for Assignment.');
    }
    return new AssignmentDTO(
      assignment.id,
      assignment.caller?.id,
      assignment.lot.id,
      assignment.bidder.id,
      assignment.isFinal
    );
  }

  static fromData(data: any): AssignmentDTO {
    return new AssignmentDTO(
      data.id,
      data.callerId,
      data.lotId,
      data.bidderId,
      data.isFinal
    );
  }

  async toModel(): Promise<Assignment> {
    const [caller, lot, bidder] = await Promise.all([
      this.callerId ? callerRepo.getCallerById(this.callerId) : Promise.resolve(undefined),
      this.lotId ? lotRepo.getLotById(this.lotId) : Promise.resolve(undefined),
      this.bidderId ? bidderRepo.getBidderById(this.bidderId) : Promise.resolve(undefined),
    ]);

    if (!lot || !bidder) {
      throw new Error('Lot or Bidder not found for Assignment.');
    }

    return new Assignment(
      this.id,
      caller,
      lot,
      bidder,
      this.isFinal
    );
  }
}
