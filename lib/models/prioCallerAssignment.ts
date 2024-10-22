import { Auction } from "@/lib/models/auction.model";
import { Bidder } from "@/lib/models/bidder.model";
import { Caller } from "@/lib/models/caller.model";

export class PrioCallerAssignment {
  public id?: number;
  public auction: Auction;
  public bidder: Bidder;
  public caller: Caller;

  constructor(
    id: number | undefined,
    auction: Auction,
    bidder: Bidder,
    caller: Caller
  ) {
    this.id = id;
    this.auction = auction;
    this.bidder = bidder;
    this.caller = caller;
  }
}
