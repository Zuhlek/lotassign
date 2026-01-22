import { z } from "zod";

export class AuctionCaller {
  id?: number;
  auctionId: number;
  callerId: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(
    auctionId: number,
    callerId: number,
    id?: number,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    this.auctionId = auctionId;
    this.callerId = callerId;
    this.id = id;
    this.createdAt = createdAt ?? new Date();
    this.updatedAt = updatedAt ?? new Date();
  }

  static fromJSON(json: AuctionCallerJSON): AuctionCaller {
    const parsed = AuctionCallerSchema.parse(json);
    return new AuctionCaller(
      parsed.auctionId,
      parsed.callerId,
      parsed.id,
      parsed.createdAt ? new Date(parsed.createdAt) : undefined,
      parsed.updatedAt ? new Date(parsed.updatedAt) : undefined
    );
  }

  toJSON(): AuctionCallerJSON {
    return {
      id: this.id,
      auctionId: this.auctionId,
      callerId: this.callerId,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}

export const AuctionCallerSchema = z.object({
  id: z.number().optional(),
  auctionId: z.number(),
  callerId: z.number(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export interface AuctionCallerJSON {
  id?: number;
  auctionId: number;
  callerId: number;
  createdAt?: string;
  updatedAt?: string;
}
