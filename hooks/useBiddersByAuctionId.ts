"use client";
import { useState, useEffect } from "react";
import { lotService } from "@/lib/services/lot.service";
import { bidderService } from "@/lib/services/bidder.service";
import { Bidder } from "@/lib/models/bidder.model";
import { Assignment } from "@/lib/models/assignment.model";
import { assignmentService } from "@/lib/services/assignment.service";

export function useBiddersByAuctionId(auctionId: number) {
  const [bidders, setBidders] = useState<Bidder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    console.log("useBiddersByAuctionId", auctionId);
    const fetchBidders = async () => {
      try {
        setIsLoading(true);
        setError(undefined);

        // Step 1: Fetch all Lots associated with the Auction
        const lots = await lotService.getAllLotsByAuctionId(auctionId);
        const lotIds = lots.map((lot) => lot.id).filter((id): id is number => id !== undefined);

        if (lotIds.length === 0) {
          setBidders([]);
          setIsLoading(false);
          return;
        }

        // Step 2: Fetch all Assignments for the Lots
        const assignmentsPromises = lotIds.map((lotId) => assignmentService.getAssignmentsByLotId(lotId));
        const assignmentsArrays = await Promise.all(assignmentsPromises);
        const assignments: Assignment[] = assignmentsArrays.flat();

        // Step 3: Extract Unique Bidder IDs
        const uniqueBidderIds = Array.from(new Set(assignments.map((a) => a.bidder.id))).filter(
          (id): id is number => id !== undefined
        );

        if (uniqueBidderIds.length === 0) {
          setBidders([]);
          setIsLoading(false);
          return;
        }

        // Step 4: Fetch Bidders Concurrently
        const bidderPromises = uniqueBidderIds.map((id) => bidderService.getBidderById(id));
        const biddersFetched = await Promise.all(bidderPromises);
        const validBidders = biddersFetched.filter((bidder): bidder is Bidder => bidder !== undefined);

        setBidders(validBidders);
        setIsLoading(false);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch bidders");
        setIsLoading(false);
      }
    };

    if (auctionId) {
      fetchBidders();
    } else {
      setBidders([]);
      setIsLoading(false);
    }
  }, [auctionId]);

  return { bidders, isLoading, error };
}
