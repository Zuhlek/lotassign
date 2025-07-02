"use client";
import { useState, useEffect } from "react";
import { auctionService } from "@/lib/actions/auction.actions";
import { Caller } from "@/lib/models/caller.model";

export function useCallersForAuction(auctionId: number) {
  const [callers, setCallers] = useState<Caller[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    const fetchCallers = async () => {
      setIsLoading(true);
      try {
        const auctionCallers = await auctionService.getAuctionById(auctionId);
        if (auctionCallers) {
          setCallers(auctionCallers.callers);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Failed to fetch callers for auction:", err);
        setError("Failed to fetch callers");
        setIsLoading(false);
      }
    };

    if (auctionId) {
      fetchCallers();
    }
  }, [auctionId]);

  return { callers, isLoading, error };
}
