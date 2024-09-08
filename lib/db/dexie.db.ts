import Dexie, { type EntityTable } from "dexie";
import { Lot } from "@/lib/models/lot.model";
import { Bidder } from "@/lib/models/bidder.model";
import { Caller } from "@/lib/models/caller.model";
import { Assignment } from "@/lib/models/assignment.model";
import { Auction } from "@/lib/models/auction.model";
import callersData from "@/dummy-data/callers.json";
import bidderPerLotData from "@/dummy-data/biddersPerLots.json";
import { Language } from "@/lib/models/language.model";

export class MyDatabase extends Dexie {
  auctions!: EntityTable<Auction, "id">;
  lots!: EntityTable<Lot, "id">;
  bidders!: EntityTable<Bidder, "id">;
  callers!: EntityTable<Caller, "id">;
  assignments!: EntityTable<Assignment, "id">;

  constructor() {
    super("LotAssignDB");
    this.version(1).stores({
      auctions: "++id,name,date,*lotIds,*callerIds",
      lots: "++id,number,description,auctionId,*assignmentIds",
      bidders: "++id,name,*languages,phoneNumber",
      callers: "++id,name,abbreviation,*languages",
      assignments: "++id,lotId,bidderId,callerId,isFinal",
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
    await db.callers.add({
      name: c.Name,
      abbreviation: c.Kürzel,
      languages: c.Sprache.map((lang) =>
        Object.values(Language).find((val) => val === lang)
          ? Object.values(Language).find((val) => val === lang)
          : Language.Englisch
      ),
    });
  }

  return auctionId;
}

async function loadLotsBiddersAndAssignmentsDummyData(auctionId: number) {
  console.log("Loading lots, bidders, and assignments dummy data...");
  console.log("Auction ID:", auctionId);
  const bidderMap = new Map();
  const lotMap = new Map();

  for (const bpl of bidderPerLotData) {
    let bidderId;
    if (!bidderMap.has(bpl.BidderName)) {
      bidderId = await db.bidders.add({
        name: bpl.BidderName,
        phoneNumber: bpl.BidderPhoneNumber,
        languages: bpl.BidderLanguages.map((lang) =>
          Object.values(Language).find((val) => val === lang)
            ? Object.values(Language).find((val) => val === lang)
            : Language.Englisch
        ),
      });
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
