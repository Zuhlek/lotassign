import { db } from "@/lib/db/dexie.db";
import { AuctionCaller } from "@/lib/models/auction-caller.model";

export async function createAuctionCaller(auctionCaller: AuctionCaller): Promise<number> {
  return db.auctionCallers.add(auctionCaller.toJSON());
}

export async function setAuctionCallers(auctionId: number, callerIds: number[]): Promise<void> {
  await deleteAuctionCallersByAuctionId(auctionId);

  if (callerIds.length === 0) return;

  const newEntries = callerIds.map(callerId => new AuctionCaller(auctionId, callerId).toJSON());
  await db.auctionCallers.bulkAdd(newEntries);
}

export async function deleteAuctionCaller(id: number): Promise<void> {
  await db.auctionCallers.delete(id);
}

export async function getAuctionCallersByAuctionId(auctionId: number): Promise<AuctionCaller[]> {
  const rows = await db.auctionCallers.where("auctionId").equals(auctionId).toArray();
  return rows.map(AuctionCaller.fromJSON);
}

export async function deleteAuctionCallersByAuctionId(auctionId: number): Promise<void> {
  const ids = await db.auctionCallers.where("auctionId").equals(auctionId).primaryKeys();
  await db.auctionCallers.bulkDelete(ids as number[]);
}
