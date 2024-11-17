"use client";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/dexie.db";
import { auctionService } from "@/lib/services/auction.service";

export function useAuctions() {
  const [searchText, setSearchText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true); // Loading initially
  const [error, setError] = useState<string | null>(null);

  const auctions = useLiveQuery(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const allAuctions = await auctionService.getAllAuctions();
      
      // Apply search filtering on fetched data
      const filteredAuctions = allAuctions.filter((auction) =>
        auction.name.toLowerCase().includes(searchText.toLowerCase())
      );
      
      setIsLoading(false); // Loading done
      return filteredAuctions;
    } catch (err) {
      console.error("Failed to fetch auctions:", err);
      setError("Failed to fetch auctions");
      setIsLoading(false);
      return [];
    }
  }, [searchText]); // Re-run the query if searchText changes

  return { auctions, searchText, setSearchText, isLoading, error };
}
