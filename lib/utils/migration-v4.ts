import { db } from "@/lib/db/dexie.db";
import { Assignment } from "@/lib/models/assignment.model";

/**
 * Migrates existing LotBidder.callerId data to the new Assignment table.
 * This should be run once when upgrading from v3 to v4.
 */
export async function migrateToAssignments(): Promise<{
  migrated: number;
  skipped: number;
}> {
  let migrated = 0;
  let skipped = 0;

  await db.transaction("rw", [db.lotBidders, db.assignments], async () => {
    const lotBidders = await db.lotBidders.toArray();

    for (const lb of lotBidders) {
      // Only migrate if there's an assigned caller
      if (lb.callerId === undefined || lb.callerId === null) {
        skipped++;
        continue;
      }

      // Check if assignment already exists
      const existing = await db.assignments
        .where("[lotId+bidderId]")
        .equals([lb.lotId, lb.bidderId])
        .first();

      if (existing) {
        skipped++;
        continue;
      }

      // Determine status based on LotBidder status
      let status: "pending" | "active" | "completed";
      if (lb.status === "final") {
        status = "completed";
      } else if (lb.status === "assigned") {
        status = "active";
      } else {
        status = "pending";
      }

      // Create new assignment
      const assignment = new Assignment(
        lb.auctionId,
        lb.lotId,
        lb.bidderId,
        lb.callerId,
        status,
        "auto" // Assume auto since we don't have history
      );

      await db.assignments.add(assignment.toJSON());
      migrated++;
    }
  });

  return { migrated, skipped };
}

/**
 * Checks if migration is needed
 */
export async function needsMigration(): Promise<boolean> {
  const lotBiddersWithCaller = await db.lotBidders
    .filter(lb => lb.callerId !== undefined && lb.callerId !== null)
    .count();

  const assignmentCount = await db.assignments.count();

  // Migration needed if there are assigned LotBidders but no Assignments
  return lotBiddersWithCaller > 0 && assignmentCount === 0;
}

/**
 * Runs migration if needed and returns the result
 */
export async function runMigrationIfNeeded(): Promise<{
  needed: boolean;
  result?: { migrated: number; skipped: number };
}> {
  const needed = await needsMigration();

  if (!needed) {
    return { needed: false };
  }

  const result = await migrateToAssignments();
  console.log(`Migration complete: ${result.migrated} migrated, ${result.skipped} skipped`);

  return { needed: true, result };
}
