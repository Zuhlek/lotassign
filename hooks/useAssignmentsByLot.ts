"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { db } from "@/lib/db/dexie.db";
import { Lot } from "@/lib/models/lot.model";

export function useAssignmentsByLot(lot: Lot) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const assignmentsForLot = useLiveQuery(
    async () => {
      console.log("useAssignmentsByLot", lot);
      try {
        setIsLoading(true);
        const assignmentsForLot = await db.assignments
        .where("id")
        .anyOf(lot.assignmentIds || [])
        .toArray();
        setIsLoading(false);
        return assignmentsForLot;
      } catch (err) {
        setIsLoading(false);
        setError("Failed to fetch auction");
        console.error(err);
      }
    },
    [lot]
  );

  return { assignmentsForLot, isLoading, error };
}
