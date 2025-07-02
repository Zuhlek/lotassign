import { z } from "zod";
import { Language } from "./language.enum";

export class Bidder {
  id?: number;
  name: string;
  phone: string;
  languages: Language[];

  constructor(name: string, phone: string, languages: Language[], id?: number) {
    this.name = name;
    this.phone = phone;
    this.languages = languages;
    this.id = id;
  }

  static fromJSON(json: BidderJSON): Bidder {
    const parsed = BidderSchema.parse(json);
    return new Bidder(parsed.name, parsed.phone, parsed.languages, parsed.id);
  }

  toJSON(): BidderJSON {
    return {
      id: this.id,
      name: this.name,
      phone: this.phone,
      languages: this.languages,
    };
  }
}

export const BidderSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  phone: z.string(),
  languages: z.array(z.nativeEnum(Language)),
});

export interface BidderJSON {
  id?: number;
  name: string;
  phone: string;
  languages: Language[];
}

