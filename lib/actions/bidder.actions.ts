import { db } from "@/lib/db/dexie.db";
import { Bidder } from "@/lib/models/bidder.model";

export async function createBidder(bidder: Bidder): Promise<number> {
  return await db.bidders.add(bidder.toJSON());
}

export async function getAllBidders(): Promise<Bidder[]> {
  const rows = await db.bidders.toArray();
  return rows.map(Bidder.fromJSON);
}

export async function getBidderById(id: number): Promise<Bidder | undefined> {
  const row = await db.bidders.get(id);
  return row ? Bidder.fromJSON(row) : undefined;
}

export async function updateBidder(bidder: Bidder): Promise<number | undefined> {
  const json = bidder.toJSON();
  if (json.id === undefined) return undefined;
  const { id, ...data } = json;
  return await db.bidders.update(id, data);
}

export async function deleteBidder(id: number): Promise<void> {
  await db.bidders.delete(id);
}
