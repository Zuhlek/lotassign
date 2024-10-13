"use client";
import { useState, useEffect } from "react";
import { AuctionService } from "@/lib/services/auction.service";
import { Caller } from "@/lib/models/caller.model";

export function useCallersForAuction(auctionId: number) {
  const [callers, setCallers] = useState<Caller[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCallers = async () => {
      setIsLoading(true);
      try {
        const auctionCallers = await AuctionService.getCallersForAuction(auctionId);
        setCallers(auctionCallers);
        setIsLoading(false);
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
