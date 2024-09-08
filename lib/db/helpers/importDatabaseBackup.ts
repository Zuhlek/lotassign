import { db } from "@/lib/db/dexie.db";

export async function importToDatabase(jsonData: string): Promise<void> {
  const backup = JSON.parse(jsonData);

  // Lösche vorhandene Daten vor dem Wiederherstellen
  await db.auctions.clear();
  await db.lots.clear();
  await db.bidders.clear();
  await db.callers.clear();
  await db.assignments.clear();

  // Wiederherstellen der Daten
  await db.auctions.bulkPut(backup.auctions);
  await db.lots.bulkPut(backup.lots);
  await db.bidders.bulkPut(backup.bidders);
  await db.callers.bulkPut(backup.callers);
  await db.assignments.bulkPut(backup.assignments);

}
