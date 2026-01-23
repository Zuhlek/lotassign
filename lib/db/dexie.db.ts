import Dexie, { Table } from "dexie";

import { AuctionJSON }        from "@/lib/models/auction.model";
import { LotJSON }            from "@/lib/models/lot.model";
import { BidderJSON }         from "@/lib/models/bidder.model";
import { CallerJSON }         from "@/lib/models/caller.model";
import { AuctionCallerJSON }  from "@/lib/models/auction-caller.model";
import { LotBidderJSON }      from "@/lib/models/lot-bidder.model";
import { AssignmentJSON }     from "@/lib/models/assignment.model";
import { AuctionConfigJSON }  from "@/lib/models/auction-config.model";
import { CallerPriorityJSON } from "@/lib/models/caller-priority.model";

export class MyDatabase extends Dexie {
  auctions!:         Table<AuctionJSON,        number>;
  lots!:             Table<LotJSON,            number>;
  bidders!:          Table<BidderJSON,         number>;
  callers!:          Table<CallerJSON,         number>;
  auctionCallers!:   Table<AuctionCallerJSON,  number>;
  lotBidders!:       Table<LotBidderJSON,      number>;
  assignments!:      Table<AssignmentJSON,     number>;
  auctionConfigs!:   Table<AuctionConfigJSON,  number>;
  callerPriorities!: Table<CallerPriorityJSON, number>;

  constructor() {
    super("LotAssignDB");

    // Version 1: Original schema
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

    // Version 2: Add timestamp indexes
    this.version(2).stores({
      auctions:       "++id, name, date, createdAt, updatedAt",
      lots:           "++id, auctionId, number, [auctionId+number], createdAt",
      bidders:        "++id, name, phone, *languages, createdAt",
      callers:        "++id, abbreviation, name, *languages, createdAt",
      auctionCallers: "++id, auctionId, callerId, [auctionId+callerId], createdAt",
      lotBidders:     "++id, auctionId, lotId, bidderId,"
                    + "preferredCallerId, callerId, status,"
                    + "[lotId+bidderId], [auctionId+status], [callerId+lotId], createdAt",
    });

    // Version 3: Add assignments table
    this.version(3).stores({
      auctions:       "++id, name, date, createdAt, updatedAt",
      lots:           "++id, auctionId, number, [auctionId+number], createdAt",
      bidders:        "++id, name, phone, *languages, createdAt",
      callers:        "++id, abbreviation, name, *languages, createdAt",
      auctionCallers: "++id, auctionId, callerId, [auctionId+callerId], createdAt",
      lotBidders:     "++id, auctionId, lotId, bidderId,"
                    + "preferredCallerId, callerId, status,"
                    + "[lotId+bidderId], [auctionId+status], [callerId+lotId], createdAt",
      assignments:    "++id, auctionId, lotId, bidderId, callerId, status, source,"
                    + "[lotId+bidderId], [auctionId+callerId], createdAt",
    });

    // Version 4: Add auction config table
    this.version(4).stores({
      auctions:       "++id, name, date, createdAt, updatedAt",
      lots:           "++id, auctionId, number, [auctionId+number], createdAt",
      bidders:        "++id, name, phone, *languages, createdAt",
      callers:        "++id, abbreviation, name, *languages, createdAt",
      auctionCallers: "++id, auctionId, callerId, [auctionId+callerId], createdAt",
      lotBidders:     "++id, auctionId, lotId, bidderId,"
                    + "preferredCallerId, callerId, status,"
                    + "[lotId+bidderId], [auctionId+status], [callerId+lotId], createdAt",
      assignments:    "++id, auctionId, lotId, bidderId, callerId, status, source,"
                    + "[lotId+bidderId], [auctionId+callerId], createdAt",
      auctionConfigs: "++id, auctionId, createdAt",
    });

    // Version 5: Add caller priorities table and isManual field to lotBidders
    this.version(5).stores({
      auctions:         "++id, name, date, createdAt, updatedAt",
      lots:             "++id, auctionId, number, [auctionId+number], createdAt",
      bidders:          "++id, name, phone, *languages, createdAt",
      callers:          "++id, abbreviation, name, *languages, createdAt",
      auctionCallers:   "++id, auctionId, callerId, [auctionId+callerId], createdAt",
      lotBidders:       "++id, auctionId, lotId, bidderId,"
                      + "preferredCallerId, callerId, status, isManual,"
                      + "[lotId+bidderId], [auctionId+status], [callerId+lotId], createdAt",
      assignments:      "++id, auctionId, lotId, bidderId, callerId, status, source,"
                      + "[lotId+bidderId], [auctionId+callerId], createdAt",
      auctionConfigs:   "++id, auctionId, createdAt",
      callerPriorities: "++id, auctionId, callerId, [auctionId+callerId]",
    });
  }
}

export const db = new MyDatabase();
