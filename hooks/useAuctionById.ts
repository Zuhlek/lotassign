"use client";
import { useState, useEffect } from "react";
import { auctionService } from "@/lib/services/auction.service";
import { Auction } from "@/lib/models/auction.model";

export function useAuctionById(auctionId: number) {
  const [auction, setAuction] = useState<Auction | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("useAuctionById", auctionId);
    const fetchAuction = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const fetchedAuction = await auctionService.getAuctionById(auctionId);
        setAuction(fetchedAuction);
        setIsLoading(false);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch auction");
        setIsLoading(false);
      }
    };

    if (auctionId) {
      fetchAuction();
    } else {
      setAuction(undefined);
      setIsLoading(false);
    }
  }, [auctionId]);

  return { auction, isLoading, error };
}
