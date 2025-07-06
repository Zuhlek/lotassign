import { db } from "@/lib/db/dexie.db";
import { LotBidder } from "@/lib/models/lot-bidder.model";

export async function createLotBidder(lotBidder: LotBidder): Promise<number> {
  return db.lotBidders.add(lotBidder.toJSON());
}

export async function updateLotBidder(lotBidder: LotBidder): Promise<number | undefined> {
  const { id, ...data } = lotBidder.toJSON();
  if (typeof id === "undefined") return undefined;
  return db.lotBidders.update(id, data);
}

export async function deleteLotBidder(id: number): Promise<void> {
  await db.lotBidders.delete(id);
}

export async function getLotBidderById(id: number): Promise<LotBidder | undefined> {
  const raw = await db.lotBidders.get(id);
  return raw ? LotBidder.fromJSON(raw) : undefined;
}

export async function getLotBiddersByLotId(lotId: number): Promise<LotBidder[]> {
  const rows = await db.lotBidders.where("lotId").equals(lotId).toArray();
  return rows.map(LotBidder.fromJSON);
}

export async function getLotBiddersByAuctionId(auctionId: number): Promise<LotBidder[]> {
  const rows = await db.lotBidders.where("auctionId").equals(auctionId).toArray();
  return rows.map(LotBidder.fromJSON);
}

export async function deleteLotBiddersByAuctionId(auctionId: number): Promise<void> {
  const ids = await db.lotBidders.where("auctionId").equals(auctionId).primaryKeys();
  await db.lotBidders.bulkDelete(ids as number[]);
}

export async function deleteLotBiddersByLotId(lotId: number): Promise<void> {
  const ids = await db.lotBidders.where("lotId").equals(lotId).primaryKeys();
  await db.lotBidders.bulkDelete(ids as number[]);
}
