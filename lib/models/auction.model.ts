import { z } from "zod";
import { Lot, LotJSON, LotSchema } from "./lot.model";

export class Auction {
  id?: number;
  name: string;
  date: Date;
  lots: Lot[] = [];

  constructor(name: string, date: Date, lots: Lot[] = [], id?: number) {
    this.name = name;
    this.date = date;
    this.lots = lots;
    this.id = id;
  }

  static fromJSON(json: AuctionJSON): Auction {
    const parsed = AuctionSchema.parse(json);
    return new Auction(
      parsed.name,
      new Date(parsed.date),
      parsed.lots ? parsed.lots.map(Lot.fromJSON) : [],
      parsed.id
    );
  }

  toJSON(): AuctionJSON {
    return {
      id: this.id,
      name: this.name,
      date: this.date.toISOString(),
      lots: this.lots.map(l => l.toJSON()),
    };
  }
}

export const AuctionSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  date: z.string(),
  lots: z.array(LotSchema).optional(),
});

export interface AuctionJSON {
  id?: number;
  name: string;
  date: string;
  lots?: LotJSON[];
}

