"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { PrioCallerAssignmentService } from "@/lib/services/prioCallerAssignment.service";

export function usePrioAssignments(auctionId: number) {
  const prioAssignments = useLiveQuery(() =>
    PrioCallerAssignmentService.getPrioAssignmentsByAuctionId(auctionId), [auctionId]);

  return { prioAssignments };
}
