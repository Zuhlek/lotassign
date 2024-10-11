"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { PrioCallerAssignmentService } from "@/lib/services/prioCallerAssignment.service";
import { useState } from "react";

export function usePrioAssignments(auctionId: number) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const prioAssignments = useLiveQuery(async () => {
    console.log("usePrioAssignments", auctionId);
    try {
      setIsLoading(true);
      const data = await PrioCallerAssignmentService.getPrioAssignmentsByAuctionId(auctionId);
      setIsLoading(false);
      return data;
    } catch (err) {
      setIsLoading(false);
      setError("Failed to fetch prio assignments");
      console.error(err);
    }
  });

  return { prioAssignments, isLoading, error };
}
