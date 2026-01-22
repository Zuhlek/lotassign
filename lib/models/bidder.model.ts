import { z } from "zod";
import { Language } from "./language.enum";

export class Bidder {
  id?: number;
  name: string;
  phone: string;
  languages: Language[];
  createdAt: Date;
  updatedAt: Date;

  constructor(
    name: string,
    phone: string,
    languages: Language[],
    id?: number,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    this.name = name;
    this.phone = phone;
    this.languages = languages;
    this.id = id;
    this.createdAt = createdAt ?? new Date();
    this.updatedAt = updatedAt ?? new Date();
  }

  static fromJSON(json: BidderJSON): Bidder {
    const parsed = BidderSchema.parse(json);
    return new Bidder(
      parsed.name,
      parsed.phone,
      parsed.languages,
      parsed.id,
      parsed.createdAt ? new Date(parsed.createdAt) : undefined,
      parsed.updatedAt ? new Date(parsed.updatedAt) : undefined
    );
  }

  toJSON(): BidderJSON {
    return {
      id: this.id,
      name: this.name,
      phone: this.phone,
      languages: this.languages,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}

export const BidderSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  phone: z.string(),
  languages: z.array(z.nativeEnum(Language)),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export interface BidderJSON {
  id?: number;
  name: string;
  phone: string;
  languages: Language[];
  createdAt?: string;
  updatedAt?: string;
}
