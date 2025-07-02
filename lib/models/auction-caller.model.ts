import { z } from "zod";

export class AuctionCaller {
  id?: number;
  auctionId: number;
  callerId: number;

  constructor(auctionId: number, callerId: number, id?: number) {
    this.auctionId = auctionId;
    this.callerId = callerId;
    this.id = id;
  }

  static fromJSON(json: AuctionCallerJSON): AuctionCaller {
    const parsed = AuctionCallerSchema.parse(json);
    return new AuctionCaller(parsed.auctionId, parsed.callerId, parsed.id);
  }

  toJSON(): AuctionCallerJSON {
    return {
      id: this.id,
      auctionId: this.auctionId,
      callerId: this.callerId,
    };
  }
}

export const AuctionCallerSchema = z.object({
  id: z.number().optional(),
  auctionId: z.number(),
  callerId: z.number(),
});

export interface AuctionCallerJSON {
  id?: number;
  auctionId: number;
  callerId: number;
}

