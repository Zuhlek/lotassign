import Dexie, { Table } from "dexie";
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
import { auctionService } from "@/lib/services/auction.service";
import { Caller } from "@/lib/models/caller.model";
import { Auction } from "@/lib/models/auction.model";
import { Assignment } from "@/lib/models/assignment.model";
import { Lot } from "@/lib/models/lot.model";
import { assignmentService } from "@/lib/services/assignment.service";
import { lotService } from "@/lib/services/lot.service";

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

async function loadAuctionAndCallerDummyData(): Promise<number> {

  const newAuction = new Auction(undefined, "Dummy Auction", new Date(), [], []);
  const auctionId = await auctionService.createAuction(newAuction);
  
  newAuction.id = auctionId;
  await auctionService.updateAuction(newAuction);

  return auctionId;
}

async function loadLotsBiddersAndAssignmentsDummyData(auctionId: number): Promise<void> {
  const bidderMap = new Map<string, Bidder>();
  const lotMap = new Map<string, Lot>();

  for (const bpl of bidderPerLotData) {
    // Step 1: Create or Retrieve Bidder
    let bidder: Bidder | undefined;
    if (!bidderMap.has(bpl.BidderName)) {
      const languages = bpl.BidderLanguages
        .map((lang) => Object.values(Language).find((val) => val === lang))
        .filter((lang): lang is Language => lang !== undefined);

      // Instantiate Bidder model
      const newBidder = new Bidder(undefined, bpl.BidderName, languages, bpl.BidderPhoneNumber);

      // Create Bidder via Service
      const bidderId = await bidderService.createBidder(newBidder);

      // Retrieve the created Bidder
      bidder = await bidderService.getBidderById(bidderId);
      if (!bidder) throw new Error(`Failed to create bidder: ${bpl.BidderName}`);

      // Store in map for reuse
      bidderMap.set(bpl.BidderName, bidder);
    } else {
      bidder = bidderMap.get(bpl.BidderName)!;
    }

    // Step 2: Create or Retrieve Lot
    let lot: Lot;
    if (!lotMap.has(bpl.LotNumber)) {
      // Instantiate Lot model
      const newLot = new Lot(undefined, parseInt(bpl.LotNumber), parseInt(bpl.LotName), auctionId.toString(), []);

      // Create Lot via Service
      lot = await lotService.createLot(newLot);
      lotMap.set(bpl.LotNumber, lot);
    } else {
      lot = lotMap.get(bpl.LotNumber)!;
    }

    // Step 3: Create Assignment
    const newAssignment = new Assignment(
      undefined,      // ID will be assigned by the database
      undefined,      // Caller is undefined initially
      lot,            // Associated Lot
      bidder,         // Associated Bidder
      false           // isFinal flag
    );

    // Create Assignment via Service
    const assignmentId = await assignmentService.createAssignment(newAssignment);

    // Optionally, retrieve the created Assignment to confirm
    const createdAssignment = await assignmentService.getAssignmentById(assignmentId);
    if (!createdAssignment) {
      throw new Error(`Failed to create assignment for Lot ${bpl.LotNumber} and Bidder ${bpl.BidderName}`);
    }

    // Note: The `createAssignment` method should handle associating the Assignment with the Lot
    // via the `assignmentIds` array in the Lot. Ensure that this logic is implemented within the service.
  }
}




export { db, clearDB, loadAuctionAndCallerDummyData, loadLotsBiddersAndAssignmentsDummyData };
