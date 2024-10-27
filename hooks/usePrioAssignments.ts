"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { prioCallerAssignmentService } from "@/lib/services/prio-caller-assignment.service";
import { useState } from "react";

export function usePrioAssignments(auctionId: number) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  const prioAssignments = useLiveQuery(async () => {
    console.log("usePrioAssignments", auctionId);
    try {
      setIsLoading(true);
      const data = await prioCallerAssignmentService.getPrioCallerAssignmentsByAuctionId(auctionId);
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
