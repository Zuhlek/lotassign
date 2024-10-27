"use client";
import { useState, useEffect } from "react";
import { auctionService } from "@/lib/services/auction.service";
import { Auction } from "@/lib/models/auction.model";

export function useAuctions() {
  const [searchText, setSearchText] = useState<string>("");
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("useAuctions", searchText);
    const fetchAuctions = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Step 1: Fetch all Auctions
        const allAuctions = await auctionService.getAllAuctions();

        // Step 2: Filter Auctions based on searchText
        const filteredAuctions = allAuctions.filter((auction) =>
          auction.name.toLowerCase().includes(searchText.toLowerCase())
        );

        setAuctions(filteredAuctions);
        setIsLoading(false);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch auctions");
        setIsLoading(false);
      }
    };

    fetchAuctions();
  }, [searchText]);

  return { auctions, searchText, setSearchText, isLoading, error };
}
