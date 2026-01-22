"use server";

import { db } from "@/lib/db/dexie.db";
import { Assignment, AssignmentJSON } from "@/lib/models/assignment.model";

export async function createAssignment(assignment: Assignment): Promise<number> {
  return db.assignments.add(assignment.toJSON());
}

export async function getAssignmentsByAuctionId(auctionId: number): Promise<Assignment[]> {
  const rows = await db.assignments.where("auctionId").equals(auctionId).toArray();
  return rows.map(Assignment.fromJSON);
}

export async function getAssignmentsByLotId(lotId: number): Promise<Assignment[]> {
  const rows = await db.assignments.where("lotId").equals(lotId).toArray();
  return rows.map(Assignment.fromJSON);
}

export async function getAssignmentByLotAndBidder(
  lotId: number,
  bidderId: number
): Promise<Assignment | null> {
  const row = await db.assignments
    .where("[lotId+bidderId]")
    .equals([lotId, bidderId])
    .first();
  return row ? Assignment.fromJSON(row) : null;
}

export async function updateAssignment(assignment: Assignment): Promise<void> {
  if (assignment.id === undefined) throw new Error("Assignment ID required");
  assignment.updatedAt = new Date();
  await db.assignments.put(assignment.toJSON());
}

export async function deleteAssignment(id: number): Promise<void> {
  await db.assignments.delete(id);
}

export async function deleteAssignmentsByAuctionId(auctionId: number): Promise<void> {
  await db.assignments.where("auctionId").equals(auctionId).delete();
}

export async function bulkCreateAssignments(assignments: Assignment[]): Promise<void> {
  await db.assignments.bulkAdd(assignments.map(a => a.toJSON()));
}

export async function bulkReplaceAssignments(
  auctionId: number,
  assignments: Assignment[]
): Promise<void> {
  await db.transaction("rw", db.assignments, async () => {
    await db.assignments.where("auctionId").equals(auctionId).delete();
    await db.assignments.bulkAdd(assignments.map(a => a.toJSON()));
  });
}
