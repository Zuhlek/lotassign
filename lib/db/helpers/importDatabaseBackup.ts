import { MyDatabase } from "../dexie.db";

async function importDatabase(db: MyDatabase, jsonData: string): Promise<void> {
    const backup = JSON.parse(jsonData);
  
    await db.transaction('rw', [db.auctions, db.lots, db.bidders, db.callers, db.assignments], async () => {
      await db.auctions.bulkPut(backup.auctions);
      await db.lots.bulkPut(backup.lots);
      await db.bidders.bulkPut(backup.bidders);
      await db.callers.bulkPut(backup.callers);
      await db.assignments.bulkPut(backup.assignments);
    });
  
    console.log("Database restored successfully.");
  }
  