import { Auction } from '@/lib/models/auction.model';
import { Lot } from '@/lib/models/lot.model';
import { Caller } from '@/lib/models/caller.model';

export class AuctionDTO {
  id?: number;
  name: string;
  date: Date;
  lotIds: number[];
  callerIds: number[];

  constructor(
    name: string,
    date: Date,
    lotIds: number[],
    callerIds: number[],
    id?: number
  ) {
    this.id = id;
    this.name = name;
    this.date = date;
    this.lotIds = lotIds;
    this.callerIds = callerIds;
  }

  static fromModel(auction: Auction): AuctionDTO {
    const lotIds = auction.lots ? auction.lots.map(lot => lot.id!).filter(id => id !== undefined) : [];
    const callerIds = auction.callers ? auction.callers.map(caller => caller.id!).filter(id => id !== undefined) : [];
    return new AuctionDTO(
      auction.name,
      auction.date,
      lotIds,
      callerIds,
      auction.id
    );
  }

  static fromData(data: any): AuctionDTO {
    return new AuctionDTO(
      data.name,
      new Date(data.date),
      data.lotIds || [],
      data.callerIds || [],
      data.id
    );
  }

  toModel(lots: Lot[], callers: Caller[]): Auction {
    return new Auction(
      this.id,
      this.name,
      this.date,
      lots,
      callers
    );
  }
}
