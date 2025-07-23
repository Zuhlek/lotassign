/******************************************************************
 * DB‑bezogene Hilfsfunktionen
 *****************************************************************/
import { db } from "@/lib/db/dexie.db";

import { BidderJSON }        from "@/lib/models/bidder.model";
import { CallerJSON }        from "@/lib/models/caller.model";
import { LotJSON }           from "@/lib/models/lot.model";
import { LotBidderJSON,
         LotBidderStatus }   from "@/lib/models/lot-bidder.model";
import { AuctionCallerJSON } from "@/lib/models/auction-caller.model";

export interface PlanningSnapshot {
  lots:           LotJSON[];
  lotBidders:     LotBidderJSON[];
  bidders:        BidderJSON[];
  callers:        CallerJSON[];
  auctionCallers: AuctionCallerJSON[];
}

export async function getPlanningSnapshot(
  auctionId: number,
): Promise<PlanningSnapshot> {
  return db.transaction(
    "r",
    [db.lots, db.bidders, db.callers, db.lotBidders, db.auctionCallers],
    async () => ({
      lots:           await db.lots.where("auctionId").equals(auctionId).sortBy("number"),
      lotBidders:     await db.lotBidders.where("auctionId").equals(auctionId).toArray(),
      bidders:        await db.bidders.toArray(),
      auctionCallers: await db.auctionCallers.where("auctionId").equals(auctionId).toArray(),
      callers:        await db.callers.toArray(),
    }),
  );
}

export async function persistCallerAssignments(
  auctionId: number,
  assignment: Map<number, number>,
): Promise<void> {
  if (!assignment.size) return;

  await db.transaction("rw", [db.lotBidders], async () => {
    const rows = await db.lotBidders.where("auctionId").equals(auctionId).toArray();

    const updated = rows.map(lb =>
      assignment.has(lb.bidderId)
        ? { ...lb, callerId: assignment.get(lb.bidderId)!, status: "assigned" as LotBidderStatus }
        : lb,
    );

    await db.lotBidders.bulkPut(updated);
  });
}
