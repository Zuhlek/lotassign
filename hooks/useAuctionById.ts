"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { db } from "@/lib/db/dexie.db";

export function useAuctionById(auctionId: number) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const auction = useLiveQuery(
    async () => {
      try {
        setIsLoading(true);
        const auction = await db.auctions.get(auctionId);
        setIsLoading(false);
        return auction;
      } catch (err) {
        setIsLoading(false);
        setError("Failed to fetch auction");
        console.error(err);
      }
    },
    [auctionId]
  );

  return { auction, isLoading, error };
}
