import { z } from "zod";

export class Lot {
  id?: number;
  auctionId: number;
  number: number;
  title: string;

  constructor(auctionId: number, number: number, title: string, id?: number) {
    this.auctionId = auctionId;
    this.number = number;
    this.title = title;
    this.id = id;
  }

  static fromJSON(json: LotJSON): Lot {
    const parsed = LotSchema.parse(json);
    return new Lot(parsed.auctionId, parsed.number, parsed.title, parsed.id);
  }

  toJSON(): LotJSON {
    return {
      id: this.id,
      auctionId: this.auctionId,
      number: this.number,
      title: this.title,
    };
  }
}

export const LotSchema = z.object({
  id: z.number().optional(),
  auctionId: z.number(),
  number: z.number(),
  title: z.string(),
});

export interface LotJSON {
  id?: number;
  auctionId: number;
  number: number;
  title: string;
}

