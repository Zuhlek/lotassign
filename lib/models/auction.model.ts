import { z } from "zod";

export class Auction {
  id?: number;
  name: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;

  constructor(
    name: string,
    date: Date,
    id?: number,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    this.name = name;
    this.date = date;
    this.id = id;
    this.createdAt = createdAt ?? new Date();
    this.updatedAt = updatedAt ?? new Date();
  }

  static fromJSON(json: AuctionJSON): Auction {
    const parsed = AuctionSchema.parse(json);
    return new Auction(
      parsed.name,
      new Date(parsed.date),
      parsed.id,
      parsed.createdAt ? new Date(parsed.createdAt) : undefined,
      parsed.updatedAt ? new Date(parsed.updatedAt) : undefined
    );
  }

  toJSON(): AuctionJSON {
    return {
      id: this.id,
      name: this.name,
      date: this.date.toISOString(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}

export const AuctionSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  date: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export interface AuctionJSON {
  id?: number;
  name: string;
  date: string;
  createdAt?: string;
  updatedAt?: string;
}
