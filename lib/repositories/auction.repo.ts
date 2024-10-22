import { db } from "../db/dexie.db";
import { Auction } from "../models/auction.model";
import { lotRepo } from "./lot.repo";
import { callerRepo } from "./caller.repo";

class AuctionRepo {

  async createAuction(auction: Auction): Promise<number> {
    return await db.auctions.add(auction);
  }

  async getAllAuctions(): Promise<Auction[]> {
    const auctions = await db.auctions.toArray();
    if (!auctions) return [];
    return Promise.all(auctions.map((a) => new AuctionDTO(a).toModel()));
  }
  

}

export const auctionRepo = new AuctionRepo();

export class AuctionDTO {

  public id?: number;
  public name: string;
  public date: Date;
  public lotIds: number[];
  public callerIds: number[];

  constructor(
    id: number | undefined,
    name: string,
    date: Date,
    lotIds: number[],
    callerIds: number[]
  ) {
    this.id = id;
    this.name = name;
    this.date = date;
    this.lotIds = lotIds;
    this.callerIds = callerIds;
  }

  async toModel(): Promise<Auction> {
    const lots = await lotRepo.ge(this.lotIds);
    const callers = await callerRepo.getCallersByIds(this.callerIds);

    return new Auction(this.id, this.name, this.date, lots, callers);
  }
}