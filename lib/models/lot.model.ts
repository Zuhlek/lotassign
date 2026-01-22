import { z } from "zod";

export class Lot {
  id?: number;
  auctionId: number;
  number: number;
  title: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(
    auctionId: number,
    number: number,
    title: string,
    id?: number,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    this.auctionId = auctionId;
    this.number = number;
    this.title = title;
    this.id = id;
    this.createdAt = createdAt ?? new Date();
    this.updatedAt = updatedAt ?? new Date();
  }

  static fromJSON(json: LotJSON): Lot {
    const parsed = LotSchema.parse(json);
    return new Lot(
      parsed.auctionId,
      parsed.number,
      parsed.title,
      parsed.id,
      parsed.createdAt ? new Date(parsed.createdAt) : undefined,
      parsed.updatedAt ? new Date(parsed.updatedAt) : undefined
    );
  }

  toJSON(): LotJSON {
    return {
      id: this.id,
      auctionId: this.auctionId,
      number: this.number,
      title: this.title,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}

export const LotSchema = z.object({
  id: z.number().optional(),
  auctionId: z.number(),
  number: z.number(),
  title: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export interface LotJSON {
  id?: number;
  auctionId: number;
  number: number;
  title: string;
  createdAt?: string;
  updatedAt?: string;
}
