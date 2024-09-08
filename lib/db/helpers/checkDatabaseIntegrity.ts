import { db } from "@/lib/db/dexie.db";

export async function checkDatabaseIntegrity(): Promise<{
  status: "success" | "warning" | "error";
  message: string;
}> {
  const auctionsCount = await db.auctions.count();
  const lotsCount = await db.lots.count();
  const biddersCount = await db.bidders.count();
  const callersCount = await db.callers.count();
  const assignmentsCount = await db.assignments.count();

  if (
    auctionsCount === 0 &&
    lotsCount === 0 &&
    biddersCount === 0 &&
    callersCount === 0 &&
    assignmentsCount === 0
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
    assignmentsCount !== 0
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
