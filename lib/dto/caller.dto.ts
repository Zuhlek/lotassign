import { Caller } from '@/lib/models/caller.model';
import { languagesToLanguageArray, languagesToStringArray } from '@/lib/models/language.model';

export class CallerDTO {
  id?: number;
  name: string;
  abbreviation: string;
  languages: string[];

  constructor(
    name: string,
    abbreviation: string,
    languages: string[],
    id?: number
  ) {
    this.id = id;
    this.name = name;
    this.abbreviation = abbreviation;
    this.languages = languages;
  }

  static fromModel(caller: Caller): CallerDTO {
    return new CallerDTO(
      caller.name,
      caller.abbreviation,
      languagesToStringArray(caller.languages),
      caller.id
    );
  }

  static fromData(data: any): CallerDTO {
    return new CallerDTO(
      data.name,
      data.abbreviation,
      data.languages || [],
      data.id
    );
  }

  toModel(): Caller {
    const { id, name, abbreviation, languages } = this;
    return new Caller(
      id,
      name,
      abbreviation,
      languagesToLanguageArray(languages)
    );
  }
}