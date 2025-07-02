import Dexie, { Table } from "dexie";

import { AuctionJSON }        from "@/lib/models/auction.model";
import { LotJSON }            from "@/lib/models/lot.model";
import { BidderJSON }         from "@/lib/models/bidder.model";
import { CallerJSON }         from "@/lib/models/caller.model";
import { AuctionCallerJSON }  from "@/lib/models/auction-caller.model";
import { LotBidderJSON }      from "@/lib/models/lot-bidder.model";

export class MyDatabase extends Dexie {
  auctions!:        Table<AuctionJSON,       number>;
  lots!:            Table<LotJSON,           number>;
  bidders!:         Table<BidderJSON,        number>;
  callers!:         Table<CallerJSON,        number>;
  auctionCallers!:  Table<AuctionCallerJSON, number>;
  lotBidders!:      Table<LotBidderJSON,     number>;

  constructor() {
    super("LotAssignDB");

    this.version(1).stores({
      auctions:       "++id, name, date",
      lots:           "++id, auctionId, number, [auctionId+number]",
      bidders:        "++id, name, phone, *languages",
      callers:        "++id, abbreviation, name, *languages",
      auctionCallers: "++id, auctionId, callerId, [auctionId+callerId]",
      lotBidders:     "++id, auctionId, lotId, bidderId,"
                    + "preferredCallerId, callerId, status,"
                    + "[lotId+bidderId], [auctionId+status], [callerId+lotId]",
    });
  }
}

export const db = new MyDatabase();
