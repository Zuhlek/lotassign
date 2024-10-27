import Dexie, { Table, type EntityTable } from "dexie";
import { Bidder } from "@/lib/models/bidder.model";
import callersData from "@/dummy-data/callers.json";
import bidderPerLotData from "@/dummy-data/biddersPerLots.json";
import { Language } from "@/lib/models/language.model";
import { bidderService } from "@/lib/services/bidder.service";
import { callerService } from "@/lib/services/caller.service";
import { LotDTO } from "@/lib/dto/lot.dto";
import { BidderDTO } from "@/lib/dto/bidder.dto";
import { CallerDTO } from "@/lib/dto/caller.dto";
import { AssignmentDTO } from "@/lib/dto/assignment.dto";
import { PrioCallerAssignmentDTO } from "@/lib/dto/prio-caller-assignment.dto";
import { AuctionDTO } from "@/lib/dto/auction.dto";

export class MyDatabase extends Dexie {
  auctions!: Table<AuctionDTO, number>;
  lots!: Table<LotDTO, number>;
  bidders!: Table<BidderDTO, number>;
  callers!: Table<CallerDTO, number>;
  assignments!: Table<AssignmentDTO, number>;
  prioCallerAssignments!: Table<PrioCallerAssignmentDTO, number>;

  constructor() {
    super("LotAssignDB");
    this.version(1).stores({
      auctions: "++id,name,date,*lotIds,*callerIds",
      lots: "++id,number,description,auctionId,[number+auctionId],*assignmentIds",
      bidders: "++id,name,*languages,phoneNumber",
      callers: "++id,name,abbreviation,*languages",
      assignments: "++id,lotId,bidderId,callerId,isFinal",
      prioCallerAssignments: "++id, auctionId, bidderId, callerId"
    });
  }
}

const db = new MyDatabase();

async function clearDB() {
  await db.delete();
  await db.open(); 
}

async function loadAuctionAndCallerDummyData() {

  const auctionId = await db.auctions.add({ name: "Dummy Auction", date: new Date() });

  for (const c of callersData) {
    const languages = c.Sprache
      .map((lang) => Object.values(Language).find((val) => val === lang))  
      .filter((lang): lang is Language => lang !== undefined); 

    callerService.createCaller(c.Name, c.Kürzel, languages);
  }

  return auctionId;
}

async function loadLotsBiddersAndAssignmentsDummyData(auctionId: number) {

  const biddersToAdd: Bidder[] = [];

  const bidderMap = new Map();
  const lotMap = new Map();

  for (const bpl of bidderPerLotData) {
    let bidderId;
    if (!bidderMap.has(bpl.BidderName)) {

      const languages = bpl.BidderLanguages
      .map((lang) => Object.values(Language).find((val) => val === lang))  
      .filter((lang): lang is Language => lang !== undefined); 

      bidderService.createBidder(new Bidder(undefined, bpl.BidderName, languages, bpl.BidderPhoneNumber));
      bidderMap.set(bpl.BidderName, bidderId);
    } else {
      bidderId = bidderMap.get(bpl.BidderName);
    }

    let lotId;
    if (!lotMap.has(bpl.LotNumber)) {
      lotId = await db.lots.add({
        number: parseInt(bpl.LotNumber),
        description: bpl.LotName,
        auctionId: auctionId,
        assignmentIds: [],
      });
      lotMap.set(bpl.LotNumber, lotId);
    } else {
      lotId = lotMap.get(bpl.LotNumber);
    }

    const assignmentId = await db.assignments.add({
      lotId: lotId,
      bidderId: bidderId,
      callerId: undefined, // Assuming no caller initially
      isFinal: false,
    });

    if (assignmentId !== undefined) {
      const lot = await db.lots.get(lotId);
      if (lot && lot.assignmentIds) {
        await db.lots.update(lotId, { assignmentIds: [...lot.assignmentIds, assignmentId] });
      }
    }
  }
}




export { db, clearDB, loadAuctionAndCallerDummyData, loadLotsBiddersAndAssignmentsDummyData };
