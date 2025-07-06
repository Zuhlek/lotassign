import { z } from "zod";

export class Auction {
  id?: number;
  name: string;
  date: Date;

  constructor(name: string, date: Date, id?: number) {
    this.name = name;
    this.date = date;
    this.id = id;
  }

  static fromJSON(json: AuctionJSON): Auction {
    const parsed = AuctionSchema.parse(json);
    return new Auction(
      parsed.name,
      new Date(parsed.date),
      parsed.id
    );
  }

  toJSON(): AuctionJSON {
    return {
      id: this.id,
      name: this.name,
      date: this.date.toISOString(),
    };
  }
}

export const AuctionSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  date: z.string(),
});

export interface AuctionJSON {
  id?: number;
  name: string;
  date: string;
}

