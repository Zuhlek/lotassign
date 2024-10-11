"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { db } from "@/lib/db/dexie.db";

export function useAuctions() {
  const [searchText, setSearchText] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const auctions = useLiveQuery(
    async () => {
      console.log("useAuctions", searchText);
      try {
        setIsLoading(true);
        const filteredAuctions = await db.auctions
          .filter((auction) => auction.name.toLowerCase().includes(searchText.toLowerCase()))
          .toArray();
        setIsLoading(false);
        return filteredAuctions;
      } catch (err) {
        setIsLoading(false);
        setError("Failed to fetch auctions");
        console.error(err);
      }
    },
    [searchText]
  );

  return { auctions, searchText, setSearchText, isLoading, error };
}
