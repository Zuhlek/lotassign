import { z } from "zod";

export type LotBidderStatus = "created" | "planned" | "assigned" | "final";

export class LotBidder {
  id?: number;
  auctionId: number;
  lotId: number;
  bidderId: number;
  preferredCallerId?: number;
  callerId?: number;
  status: LotBidderStatus;

  constructor(
    auctionId: number,
    lotId: number,
    bidderId: number,
    status: LotBidderStatus,
    preferredCallerId?: number,
    callerId?: number,
    id?: number
  ) {
    this.auctionId = auctionId;
    this.lotId = lotId;
    this.bidderId = bidderId;
    this.preferredCallerId = preferredCallerId;
    this.callerId = callerId;
    this.status = status;
    this.id = id;
  }

  static fromJSON(json: LotBidderJSON): LotBidder {
    const parsed = LotBidderSchema.parse(json);
    return new LotBidder(
      parsed.auctionId,
      parsed.lotId,
      parsed.bidderId,
      parsed.status,
      parsed.preferredCallerId,
      parsed.callerId,
      parsed.id
    );
  }

  toJSON(): LotBidderJSON {
    return {
      id: this.id,
      auctionId: this.auctionId,
      lotId: this.lotId,
      bidderId: this.bidderId,
      preferredCallerId: this.preferredCallerId,
      callerId: this.callerId,
      status: this.status,
    };
  }
}

export const LotBidderSchema = z.object({
  id: z.number().optional(),
  auctionId: z.number(),
  lotId: z.number(),
  bidderId: z.number(),
  preferredCallerId: z.number().optional(),
  callerId: z.number().optional(),
  status: z.enum(["planned", "assigned", "final"]),
});

export interface LotBidderJSON {
  id?: number;
  auctionId: number;
  lotId: number;
  bidderId: number;
  preferredCallerId?: number;
  callerId?: number;
  status: LotBidderStatus;
}
