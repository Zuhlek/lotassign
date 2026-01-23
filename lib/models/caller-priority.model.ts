import { z } from "zod";

export class CallerPriority {
  id?: number;
  auctionId: number;
  callerId: number;
  bidderIds: number[];  // Ordered array - index 0 is highest priority
  createdAt: Date;
  updatedAt: Date;

  constructor(
    auctionId: number,
    callerId: number,
    bidderIds: number[],
    id?: number,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    this.auctionId = auctionId;
    this.callerId = callerId;
    this.bidderIds = bidderIds;
    this.id = id;
    this.createdAt = createdAt ?? new Date();
    this.updatedAt = updatedAt ?? new Date();
  }

  static fromJSON(json: CallerPriorityJSON): CallerPriority {
    const parsed = CallerPrioritySchema.parse(json);
    return new CallerPriority(
      parsed.auctionId,
      parsed.callerId,
      parsed.bidderIds,
      parsed.id,
      parsed.createdAt ? new Date(parsed.createdAt) : undefined,
      parsed.updatedAt ? new Date(parsed.updatedAt) : undefined
    );
  }

  toJSON(): CallerPriorityJSON {
    return {
      id: this.id,
      auctionId: this.auctionId,
      callerId: this.callerId,
      bidderIds: this.bidderIds,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}

export const CallerPrioritySchema = z.object({
  id: z.number().optional(),
  auctionId: z.number(),
  callerId: z.number(),
  bidderIds: z.array(z.number()),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export interface CallerPriorityJSON {
  id?: number;
  auctionId: number;
  callerId: number;
  bidderIds: number[];
  createdAt?: string;
  updatedAt?: string;
}
