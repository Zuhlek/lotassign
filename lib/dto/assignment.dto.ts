import { Assignment } from '@/lib/models/assignment.model';
import { Bidder } from '../models/bidder.model';
import { Lot } from '../models/lot.model';
import { Caller } from '../models/caller.model';

export class AssignmentDTO {
  id?: number;
  callerId?: number;
  lotId: number;
  bidderId: number;
  isFinal: boolean;

  constructor(
    lotId: number,
    bidderId: number,
    isFinal: boolean,
    callerId?: number,
    id?: number
  ) {
    this.id = id;
    this.callerId = callerId;
    this.lotId = lotId;
    this.bidderId = bidderId;
    this.isFinal = isFinal;
  }

  static fromModel(assignment: Assignment): AssignmentDTO {
    return new AssignmentDTO(
      assignment.lot.id!,
      assignment.bidder.id!,
      assignment.isFinal,
      assignment.caller?.id,
      assignment.id
    );
  }

  static fromData(data: any): AssignmentDTO {
    return new AssignmentDTO(
      data.lotId,
      data.bidderId,
      data.isFinal,
      data.callerId,
      data.id
    );
  }

  toModel(bidder: Bidder, lot: Lot, caller?: Caller): Assignment {
    return new Assignment(
      this.id,
      caller,
      lot,
      bidder,
      this.isFinal
    );
  }
}
