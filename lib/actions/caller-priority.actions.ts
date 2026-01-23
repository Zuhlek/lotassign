"use client";

import { db } from "@/lib/db/dexie.db";
import { CallerPriority, CallerPriorityJSON } from "@/lib/models/caller-priority.model";

export async function getCallerPrioritiesByAuctionId(auctionId: number): Promise<CallerPriority[]> {
  const records = await db.callerPriorities.where("auctionId").equals(auctionId).toArray();
  return records.map(CallerPriority.fromJSON);
}

export async function getCallerPriority(auctionId: number, callerId: number): Promise<CallerPriority | undefined> {
  const record = await db.callerPriorities
    .where("[auctionId+callerId]")
    .equals([auctionId, callerId])
    .first();
  return record ? CallerPriority.fromJSON(record) : undefined;
}

export async function setCallerPriority(
  auctionId: number,
  callerId: number,
  bidderIds: number[]
): Promise<number> {
  const existing = await db.callerPriorities
    .where("[auctionId+callerId]")
    .equals([auctionId, callerId])
    .first();

  const now = new Date().toISOString();

  if (existing) {
    await db.callerPriorities.update(existing.id!, {
      bidderIds,
      updatedAt: now,
    });
    return existing.id!;
  } else {
    const record: CallerPriorityJSON = {
      auctionId,
      callerId,
      bidderIds,
      createdAt: now,
      updatedAt: now,
    };
    return await db.callerPriorities.add(record);
  }
}

export async function deleteCallerPriority(id: number): Promise<void> {
  await db.callerPriorities.delete(id);
}

export async function deleteCallerPrioritiesByAuctionId(auctionId: number): Promise<void> {
  await db.callerPriorities.where("auctionId").equals(auctionId).delete();
}
