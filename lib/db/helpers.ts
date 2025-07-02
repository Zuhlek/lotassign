import { db } from "@/lib/db/dexie.db";

import callersData from "@/dummy-data/callers.json";
import bidderPerLotData from "@/dummy-data/biddersPerLots.json";

import { createAuction } from "@/lib/actions/auction.actions";
import { createLot } from "@/lib/actions/lot.actions";
import { createBidder } from "@/lib/actions/bidder.actions";
import { createCaller } from "@/lib/actions/caller.actions";
import { createAuctionCaller } from "@/lib/actions/auction-caller.actions";
import { createLotBidder } from "@/lib/actions/lot-bidder.actions";

import { Auction } from "@/lib/models/auction.model";
import { Caller } from "@/lib/models/caller.model";
import { AuctionCaller } from "@/lib/models/auction-caller.model";
import { Bidder } from "@/lib/models/bidder.model";
import { Lot } from "@/lib/models/lot.model";
import { LotBidder } from "@/lib/models/lot-bidder.model";
import { Language } from "@/lib/models/language.enum";
import { LotBidderStatus } from "@/lib/models/lot-bidder.model";

export async function importToDatabase(jsonData: string): Promise<void> {
  const backup = JSON.parse(jsonData);

  await db.auctions.clear();
  await db.lots.clear();
  await db.bidders.clear();
  await db.callers.clear();
  await db.auctionCallers.clear();
  await db.lotBidders.clear();

  await db.auctions.bulkPut(backup.auctions);
  await db.lots.bulkPut(backup.lots);
  await db.bidders.bulkPut(backup.bidders);
  await db.callers.bulkPut(backup.callers);
  await db.auctionCallers.bulkPut(backup.auctionCallers);
  await db.lotBidders.bulkPut(backup.lotBidders);
}

export async function exportDatabase(): Promise<any> {
  const auctions = await db.auctions.toArray();
  const lots = await db.lots.toArray();
  const bidders = await db.bidders.toArray();
  const callers = await db.callers.toArray();
  const auctionCallers = await db.auctionCallers.toArray();
  const lotBidders = await db.lotBidders.toArray();

  return {
    auctions,
    lots,
    bidders,
    callers,
    auctionCallers,
    lotBidders,
  };
}

export async function checkDatabaseIntegrity(): Promise<{
  status: "success" | "warning" | "error";
  message: string;
}> {
  const auctionsCount = await db.auctions.count();
  const lotsCount = await db.lots.count();
  const biddersCount = await db.bidders.count();
  const callersCount = await db.callers.count();
  const auctionCallersCount = await db.auctionCallers.count();
  const lotBiddersCount = await db.lotBidders.count();

  if (
    auctionsCount === 0 &&
    lotsCount === 0 &&
    biddersCount === 0 &&
    callersCount === 0 &&
    auctionCallersCount === 0 &&
    lotBiddersCount === 0
  ) {
    return {
      status: "error",
      message: "No data available. Consider importing a backup file.",
    };
  } else if (
    auctionsCount !== 0 &&
    lotsCount !== 0 &&
    biddersCount !== 0 &&
    callersCount !== 0 &&
    auctionCallersCount !== 0 &&
    lotBiddersCount !== 0
  ) {
    return {
      status: "success",
      message: "All necessary data is present.",
    };
  } else {
    return {
      status: "warning",
      message: "Some data is missing. Please check what's missing and import accordingly.",
    };
  }
}

export async function clearDB() {
  await db.delete();
  await db.open();
}

export async function loadAuctionAndCallerDummyData(): Promise<number> {
  const auction = new Auction("Dummy Auction", new Date());
  const auctionId = await createAuction(auction);

  for (const raw of callersData) {
    const name = raw["Name"] ?? "Unnamed";
    const abbreviation = raw["Kürzel"] ?? "";
    const languages = raw["Sprache"] as Language[];

    const caller = new Caller(name, abbreviation, languages);
    const callerId = await createCaller(caller);

    const auctionCaller = new AuctionCaller(auctionId, callerId);
    await createAuctionCaller(auctionCaller);
  }

  return auctionId;
}

export async function loadLotsBiddersAndAssignmentsDummyData(auctionId: number) {
  const bidderIds = new Map<string, number>();
  const lotIds = new Map<string, number>();

  for (const row of bidderPerLotData) {
    let bidderId = bidderIds.get(row.BidderName);
    if (!bidderId) {
      const bidder = new Bidder(
        row.BidderName ?? "Unnamed Bidder",
        row.BidderPhoneNumber ?? "",
        row.BidderLanguages as Language[]
      );
      bidderId = await createBidder(bidder);
      bidderIds.set(row.BidderName, bidderId);
    }

    let lotId = lotIds.get(row.LotNumber);
    if (!lotId) {
      const lot = new Lot(
        auctionId,
        parseInt(row.LotNumber, 10),
        row.LotName ?? "Untitled Lot"
      );
      lotId = await createLot(lot);
      lotIds.set(row.LotNumber, lotId);
    }

    const lotBidder = new LotBidder(
      auctionId,
      lotId,
      bidderId,
      "planned" satisfies LotBidderStatus
    );

    await createLotBidder(lotBidder);
  }
}
