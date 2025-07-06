import { db } from "@/lib/db/dexie.db";
import { Lot } from "@/lib/models/lot.model";

export async function createLot(lot: Lot): Promise<number> {
  const id = await db.lots.add(lot.toJSON());
  lot.id = id;
  return id;
}

export async function updateLot(lot: Lot): Promise<number | undefined> {
  const { id, ...data } = lot.toJSON();
  if (typeof id === "undefined") return undefined;
  return db.lots.update(id, data);
}

export async function deleteLot(id: number): Promise<void> {
  await db.lots.delete(id);
  const assignmentIds = await db.lotBidders.where("lotId").equals(id).primaryKeys();
  await db.lotBidders.bulkDelete(assignmentIds as number[]);
}

export async function getLotById(id: number): Promise<Lot | undefined> {
  const raw = await db.lots.get(id);
  return raw ? Lot.fromJSON(raw) : undefined;
}

export async function getLots(): Promise<Lot[]> {
  const rows = await db.lots.toArray();
  return rows.map(Lot.fromJSON);
}

export async function getLotsByAuctionId(auctionId: number): Promise<Lot[]> {
  const rows = await db.lots.where("auctionId").equals(auctionId).toArray();
  return rows.map(Lot.fromJSON);
}

export async function getLotByAuctionIdAndNumber(
  auctionId: number,
  number: number
): Promise<Lot | undefined> {
  const raw = await db.lots.where("[number+auctionId]").equals([number, auctionId]).first();
  return raw ? Lot.fromJSON(raw) : undefined;
}

export async function deleteLotsByAuctionId(auctionId: number): Promise<void> {
  const lotIds = await db.lots.where("auctionId").equals(auctionId).primaryKeys();
  await db.lots.bulkDelete(lotIds as number[]);
  await db.lotBidders.where("auctionId").equals(auctionId).delete();  
}

export async function getSurroundingLots(
  number: number,
  range: number,
  auctionId: number
): Promise<Lot[]> {
  const min = number - range;
  const max = number + range;

  const raw = await db.lots
    .where("number")
    .between(min, max, true, true)
    .and((l) => l.auctionId === auctionId)
    .toArray();

  return raw.map(Lot.fromJSON);
}
