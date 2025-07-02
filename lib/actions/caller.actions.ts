import { db } from "@/lib/db/dexie.db";
import { Caller } from "@/lib/models/caller.model";

export async function createCaller(caller: Caller): Promise<number> {
  return await db.callers.add(caller.toJSON());
}

export async function getAllCallers(): Promise<Caller[]> {
  const rows = await db.callers.toArray();
  return rows.map(Caller.fromJSON);
}

export async function getCallerById(id: number): Promise<Caller | undefined> {
  const row = await db.callers.get(id);
  return row ? Caller.fromJSON(row) : undefined;
}

export async function updateCaller(caller: Caller): Promise<number | undefined> {
  const { id, ...data } = caller.toJSON();
  if (typeof id !== "number") return undefined;
  return await db.callers.update(id, data);
}

export async function deleteCaller(id: number): Promise<void> {
  await db.callers.delete(id);
}
