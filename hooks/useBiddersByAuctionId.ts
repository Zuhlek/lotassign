"use client";
import { useState, useEffect } from "react";
import { LotService } from "@/lib/services/lot.service";
import { AssignmentService } from "@/lib/services/assignment.service";
import { BidderService } from "@/lib/services/bidder.service";
import { Bidder } from "@/lib/models/bidder.model";
import { Assignment } from "@/lib/models/assignment.model";

export function useBiddersByAuctionId(auctionId: number) {
  const [bidders, setBidders] = useState<Bidder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBidders = async () => {
      try {
        setIsLoading(true);
        const lots = await LotService.getAllLotsByAuctionId(auctionId);
        const lotIds = lots.map((lot) => lot.id);

        let assignments: Assignment[] = [];
        for (const lotId of lotIds) {
          const lotAssignments = await AssignmentService.getAssignmentsByLotId(lotId);
          assignments = assignments.concat(lotAssignments);
        }

        const uniqueBidderIds = Array.from(new Set(assignments.map((a) => a.bidderId)));

        let bidders: Bidder[] = [];
        for (const id of uniqueBidderIds) {
          const bidder = await BidderService.getBidderById(id);
          if (bidder) {
            bidders.push(bidder);
          }
        }

        setBidders(bidders);
        setIsLoading(false);
      } catch (err) {
        setError("Failed to fetch bidders");
        setIsLoading(false);
      }
    };

    fetchBidders();
  }, [auctionId]);

  return { bidders, isLoading, error };
}
