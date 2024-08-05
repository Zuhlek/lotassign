import { Language } from "./language.model";

export type Caller = {
  id?: number;
  name: string;
  abbreviation: string;
  languages: (Language | undefined)[];
};
