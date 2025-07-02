import { z } from "zod";
import { Language } from "./language.enum";

export class Caller {
  id?: number;
  abbreviation: string;
  name: string;
  languages: Language[];

  constructor(abbreviation: string, name: string, languages: Language[], id?: number) {
    this.abbreviation = abbreviation;
    this.name = name;
    this.languages = languages;
    this.id = id;
  }

  static fromJSON(json: CallerJSON): Caller {
    const parsed = CallerSchema.parse(json);
    return new Caller(parsed.abbreviation, parsed.name, parsed.languages, parsed.id);
  }

  toJSON(): CallerJSON {
    return {
      id: this.id,
      abbreviation: this.abbreviation,
      name: this.name,
      languages: this.languages,
    };
  }
}

export const CallerSchema = z.object({
  id: z.number().optional(),
  abbreviation: z.string(),
  name: z.string(),
  languages: z.array(z.nativeEnum(Language)),
});

export interface CallerJSON {
  id?: number;
  abbreviation: string;
  name: string;
  languages: Language[];
}

