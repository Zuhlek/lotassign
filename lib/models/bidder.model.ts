import { Language } from "./language.model";

export type Bidder = {
  id?: number;
  name: string;
  phoneNumber: string;
  languages: (Language | undefined)[];
}
