import { Bidder } from '@/lib/models/bidder.model';
import { languagesToLanguageArray, languagesToStringArray } from '@/lib/models/language.model';

export class BidderDTO {
  id?: number;
  name: string;
  languages: string[];
  phoneNumber: string;

  constructor(
    name: string,
    languages: string[],
    phoneNumber: string,
    id?: number
  ) {
    this.id = id;
    this.name = name;
    this.languages = languages;
    this.phoneNumber = phoneNumber;
  }

  static fromModel(bidder: Bidder): BidderDTO {
    return new BidderDTO(
      bidder.name,
      languagesToStringArray(bidder.languages),
      bidder.phoneNumber,
      bidder.id
    );
  }

  static fromData(data: any): BidderDTO {
    return new BidderDTO(
      data.name,
      data.languages || [],
      data.phoneNumber,
      data.id
    );
  }

  toModel(): Bidder {
    const { id, name, languages, phoneNumber } = this;
    return new Bidder(
      id,
      name,
      languagesToLanguageArray(languages),
      phoneNumber
    );
  }
}
