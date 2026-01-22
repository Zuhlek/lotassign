import { z } from "zod";

export type AssignmentStatus = "pending" | "active" | "completed";
export type AssignmentSource = "auto" | "manual";

export class Assignment {
  id?: number;
  auctionId: number;
  lotId: number;
  bidderId: number;
  callerId: number;
  status: AssignmentStatus;
  source: AssignmentSource;
  createdAt: Date;
  updatedAt: Date;

  constructor(
    auctionId: number,
    lotId: number,
    bidderId: number,
    callerId: number,
    status: AssignmentStatus = "pending",
    source: AssignmentSource = "auto",
    id?: number,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    this.auctionId = auctionId;
    this.lotId = lotId;
    this.bidderId = bidderId;
    this.callerId = callerId;
    this.status = status;
    this.source = source;
    this.id = id;
    this.createdAt = createdAt ?? new Date();
    this.updatedAt = updatedAt ?? new Date();
  }

  static fromJSON(json: AssignmentJSON): Assignment {
    const parsed = AssignmentSchema.parse(json);
    return new Assignment(
      parsed.auctionId,
      parsed.lotId,
      parsed.bidderId,
      parsed.callerId,
      parsed.status,
      parsed.source,
      parsed.id,
      parsed.createdAt ? new Date(parsed.createdAt) : undefined,
      parsed.updatedAt ? new Date(parsed.updatedAt) : undefined
    );
  }

  toJSON(): AssignmentJSON {
    return {
      id: this.id,
      auctionId: this.auctionId,
      lotId: this.lotId,
      bidderId: this.bidderId,
      callerId: this.callerId,
      status: this.status,
      source: this.source,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}

export const AssignmentSchema = z.object({
  id: z.number().optional(),
  auctionId: z.number(),
  lotId: z.number(),
  bidderId: z.number(),
  callerId: z.number(),
  status: z.enum(["pending", "active", "completed"]),
  source: z.enum(["auto", "manual"]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export interface AssignmentJSON {
  id?: number;
  auctionId: number;
  lotId: number;
  bidderId: number;
  callerId: number;
  status: AssignmentStatus;
  source: AssignmentSource;
  createdAt?: string;
  updatedAt?: string;
}
