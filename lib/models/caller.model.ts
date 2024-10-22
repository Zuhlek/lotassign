import { Language } from "@/lib/models/language.model";

export class Caller {
  id?: number | undefined;
  name: string;
  abbreviation: string;
  languages: Language[];

  constructor(id: number | undefined, name: string, abbreviation: string, languages: Language[]) {
    this.id = id;
    this.name = name;
    this.abbreviation = abbreviation;
    this.languages = languages;
  }
}
