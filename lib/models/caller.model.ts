import { z } from "zod";
import { Language } from "./language.enum";

export class Caller {
  id?: number;
  name: string;
  abbreviation: string;
  languages: Language[];
  createdAt: Date;
  updatedAt: Date;

  constructor(
    name: string,
    abbreviation: string,
    languages: Language[],
    id?: number,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    this.name = name;
    this.abbreviation = abbreviation;
    this.languages = languages;
    this.id = id;
    this.createdAt = createdAt ?? new Date();
    this.updatedAt = updatedAt ?? new Date();
  }

  static fromJSON(json: CallerJSON): Caller {
    const parsed = CallerSchema.parse(json);
    return new Caller(
      parsed.name,
      parsed.abbreviation,
      parsed.languages,
      parsed.id,
      parsed.createdAt ? new Date(parsed.createdAt) : undefined,
      parsed.updatedAt ? new Date(parsed.updatedAt) : undefined
    );
  }

  toJSON(): CallerJSON {
    return {
      id: this.id,
      name: this.name,
      abbreviation: this.abbreviation,
      languages: this.languages,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}

export const CallerSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  abbreviation: z.string(),
  languages: z.array(z.nativeEnum(Language)),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export interface CallerJSON {
  id?: number;
  name: string;
  abbreviation: string;
  languages: Language[];
  createdAt?: string;
  updatedAt?: string;
}
