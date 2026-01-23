import { db } from "@/lib/db/dexie.db";

export async function importToDatabase(jsonData: string): Promise<void> {
  const backup = JSON.parse(jsonData);

  await db.transaction(
    "rw",
    [db.auctions, db.lots, db.bidders, db.callers, db.auctionCallers, db.lotBidders, db.assignments, db.auctionConfigs],
    async () => {
      // Clear all tables
      await Promise.all([
        db.auctions.clear(),
        db.lots.clear(),
        db.bidders.clear(),
        db.callers.clear(),
        db.auctionCallers.clear(),
        db.lotBidders.clear(),
        db.assignments.clear(),
        db.auctionConfigs.clear(),
      ]);

      // Import core data
      await db.auctions.bulkPut(backup.auctions);
      await db.lots.bulkPut(backup.lots);
      await db.bidders.bulkPut(backup.bidders);
      await db.callers.bulkPut(backup.callers);
      await db.auctionCallers.bulkPut(backup.auctionCallers);
      await db.lotBidders.bulkPut(backup.lotBidders);

      // Handle optional new tables (backwards compatibility with older backups)
      if (backup.assignments && Array.isArray(backup.assignments)) {
        await db.assignments.bulkPut(backup.assignments);
      }
      if (backup.auctionConfigs && Array.isArray(backup.auctionConfigs)) {
        await db.auctionConfigs.bulkPut(backup.auctionConfigs);
      }
    }
  );
}

export interface DatabaseBackup {
  version: number;
  exportedAt: string;
  auctions: unknown[];
  lots: unknown[];
  bidders: unknown[];
  callers: unknown[];
  auctionCallers: unknown[];
  lotBidders: unknown[];
  assignments?: unknown[];
  auctionConfigs?: unknown[];
}

export async function exportDatabase(): Promise<DatabaseBackup> {
  const [auctions, lots, bidders, callers, auctionCallers, lotBidders, assignments, auctionConfigs] =
    await Promise.all([
      db.auctions.toArray(),
      db.lots.toArray(),
      db.bidders.toArray(),
      db.callers.toArray(),
      db.auctionCallers.toArray(),
      db.lotBidders.toArray(),
      db.assignments.toArray(),
      db.auctionConfigs.toArray(),
    ]);

  return {
    version: 4,
    exportedAt: new Date().toISOString(),
    auctions,
    lots,
    bidders,
    callers,
    auctionCallers,
    lotBidders,
    assignments,
    auctionConfigs,
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
