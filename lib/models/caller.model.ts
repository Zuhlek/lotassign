import { z } from "zod";
import { Language } from "./language.enum";

export class Caller {
  id?: number;
  name: string;
  abbreviation: string;
  languages: Language[];

  constructor(name: string, abbreviation: string, languages: Language[], id?: number) {
    this.name = name;
    this.abbreviation = abbreviation;

    this.languages = languages;
    this.id = id;
  }

  static fromJSON(json: CallerJSON): Caller {
    const parsed = CallerSchema.parse(json);
    return new Caller(parsed.name, parsed.abbreviation, parsed.languages, parsed.id);
  }

  toJSON(): CallerJSON {
    return {
      id: this.id,
      name: this.name,
      abbreviation: this.abbreviation,
      languages: this.languages,
    };
  }
}

export const CallerSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  abbreviation: z.string(),
  languages: z.array(z.nativeEnum(Language)),
});

export interface CallerJSON {
  id?: number;
  name: string;
  abbreviation: string;
  languages: Language[];
}

