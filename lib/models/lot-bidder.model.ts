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
  isManual: boolean;           // true if user manually set the caller assignment
  constraintNote?: string;     // explains why algorithm made a decision
  createdAt: Date;
  updatedAt: Date;

  constructor(
    auctionId: number,
    lotId: number,
    bidderId: number,
    status: LotBidderStatus,
    preferredCallerId?: number,
    callerId?: number,
    id?: number,
    createdAt?: Date,
    updatedAt?: Date,
    isManual: boolean = false,
    constraintNote?: string
  ) {
    this.auctionId = auctionId;
    this.lotId = lotId;
    this.bidderId = bidderId;
    this.preferredCallerId = preferredCallerId;
    this.callerId = callerId;
    this.status = status;
    this.isManual = isManual;
    this.constraintNote = constraintNote;
    this.id = id;
    this.createdAt = createdAt ?? new Date();
    this.updatedAt = updatedAt ?? new Date();
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
      parsed.id,
      parsed.createdAt ? new Date(parsed.createdAt) : undefined,
      parsed.updatedAt ? new Date(parsed.updatedAt) : undefined,
      parsed.isManual ?? false,
      parsed.constraintNote
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
      isManual: this.isManual,
      constraintNote: this.constraintNote,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
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
  status: z.enum(["created", "planned", "assigned", "final"]),
  isManual: z.boolean().optional(),
  constraintNote: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export interface LotBidderJSON {
  id?: number;
  auctionId: number;
  lotId: number;
  bidderId: number;
  preferredCallerId?: number;
  callerId?: number;
  status: LotBidderStatus;
  isManual?: boolean;
  constraintNote?: string;
  createdAt?: string;
  updatedAt?: string;
}
