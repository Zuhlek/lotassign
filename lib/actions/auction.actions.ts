import { db } from "@/lib/db/dexie.db";
import { Auction } from "@/lib/models/auction.model";

async function hydrateAuction(raw: any): Promise<Auction> {
  const auction = Auction.fromJSON(raw);
  return auction;
}

export async function createAuction(auction: Auction): Promise<number> {
  const id = await db.auctions.add(auction.toJSON());
  auction.id = id;

  return id;
}

export async function updateAuction(auction: Auction): Promise<number | undefined> {
  if (!auction.id) return undefined;
  const auctionData = auction.toJSON();
  const id = auctionData.id as number;
  const { id: _id, ...data } = auctionData;
  const updated = await db.auctions.update(id, data);
  return updated;
}

export async function deleteAuction(id: number): Promise<void> {
  await db.auctions.delete(id);

  const lotIds = await db.lots.where("auctionId").equals(id).primaryKeys();
  await db.lots.bulkDelete(lotIds as number[]);

  const lotBidderIds = await db.lotBidders.where("lotId").anyOf(lotIds as number[]).primaryKeys();
  await db.lotBidders.bulkDelete(lotBidderIds as number[]);

  await db.auctionCallers.where("auctionId").equals(id).delete();
}

export async function getAuctionById(id: number): Promise<Auction | undefined> {
  const raw = await db.auctions.get(id);
  if (!raw) return undefined;
  return hydrateAuction(raw);
}

export async function getAllAuctions(): Promise<Auction[]> {
  const rawAuctions = await db.auctions.toArray();
  return Promise.all(rawAuctions.map(hydrateAuction));
}
