import { PrioCallerAssignment } from '@/lib/models/prioCallerAssignment.model';
import { Auction } from '@/lib/models/auction.model';
import { Bidder } from '@/lib/models/bidder.model';
import { Caller } from '@/lib/models/caller.model';

export class PrioCallerAssignmentDTO {
  id?: number;
  auctionId: number;
  bidderId: number;
  callerId: number;

  constructor(
    auctionId: number,
    bidderId: number,
    callerId: number,
    id?: number
  ) {
    this.id = id;
    this.auctionId = auctionId;
    this.bidderId = bidderId;
    this.callerId = callerId;
  }

  static fromModel(prioAssignment: PrioCallerAssignment): PrioCallerAssignmentDTO {
    return new PrioCallerAssignmentDTO(
      prioAssignment.auction.id!,
      prioAssignment.bidder.id!,
      prioAssignment.caller.id!,
      prioAssignment.id
    );
  }

  static fromData(data: any): PrioCallerAssignmentDTO {
    return new PrioCallerAssignmentDTO(
      data.auctionId,
      data.bidderId,
      data.callerId,
      data.id
    );
  }

  toModel(auction: Auction, bidder: Bidder, caller: Caller): PrioCallerAssignment {
    return new PrioCallerAssignment(
      this.id,
      auction,
      bidder,
      caller
    );
  }
}
