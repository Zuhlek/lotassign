import { Language } from "./language.model";

export class Bidder {

  public id?: number;
  public name: string;
  public languages: Language[];
  public phoneNumber: string;

  constructor(id: number | undefined, name: string, languages: Language[], phoneNumber: string) {
    this.id = id;
    this.name = name;
    this.languages = languages;
    this.phoneNumber = phoneNumber;
  }

}
