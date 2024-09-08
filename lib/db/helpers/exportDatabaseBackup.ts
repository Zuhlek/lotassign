import { db } from "@/lib/db/dexie.db";

export async function exportDatabase(): Promise<any> {
    const auctions = await db.auctions.toArray();
    const lots = await db.lots.toArray();
    const bidders = await db.bidders.toArray();
    const callers = await db.callers.toArray();
    const assignments = await db.assignments.toArray();
  
    // Erstelle ein vollständiges JSON-Backup
    const backup = {
      auctions,
      lots,
      bidders,
      callers,
      assignments
    };
  
    // Konvertiere das Backup in JSON
    return backup;
  }
  