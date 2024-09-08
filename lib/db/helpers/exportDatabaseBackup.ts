import { MyDatabase } from "../dexie.db";

async function exportDatabase(db: MyDatabase): Promise<string> {
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
    return JSON.stringify(backup);
  }
  